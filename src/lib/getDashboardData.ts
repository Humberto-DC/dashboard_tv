import pool from "./db";
import pgPool from "./pgDb";
import { toNum } from "./utils";
import type { TVDashboardData, FilialRow, SellerRow, HistoryRow } from "@/types/dashboard";

const SELLER_IDS = [244, 12, 17, 67, 200, 110, 193, 114, 215, 108, 163, 46];

const SQL_FILIAIS = `
WITH
  metas_filial_cte AS (
    SELECT m.empresa_id, SUM(m.meta) AS meta
    FROM ADM.metas m
    WHERE m.empresa_id IN (1, 2, 3, 5, 6)
      AND CAST(m.ano_mes AS NUMBER) = (EXTRACT(YEAR FROM SYSDATE) * 100 + EXTRACT(MONTH FROM SYSDATE))
    GROUP BY m.empresa_id
  ),
  vendas_base AS (
    SELECT * FROM (
        SELECT
          e.empresa_id AS eid,
          o.data_recebimento as dt,
          (o.valor_produtos - o.valor_desconto) AS v_prod,
          COALESCE(o.valor_outras_despesas, 0) AS v_outros,
          COALESCE(o.valor_frete_processado, 0) AS v_frete,
          COALESCE(o.valor_pedido, 0) AS v_pedido,
          1 as cnt_v,
          (o.valor_produtos - o.valor_desconto - COALESCE(o.valor_total_retencao_fin, 0) - (SELECT SUM(COALESCE(io.valor_juros_embutidos, 0)) FROM ADM.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id)) AS bs,
          ((o.valor_produtos - o.valor_desconto - COALESCE(o.valor_total_retencao_fin, 0) - (SELECT SUM(COALESCE(io.valor_juros_embutidos, 0)) FROM ADM.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id)) * (o.perc_lucro_fechamento / 100.0)) AS luc,
          0 as real_dev,
          0 as bs_d, 0 as luc_d
        FROM ADM.orcamentos o
        JOIN ADM.empresas e ON e.empresa_id = o.empresa_id
        WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
          AND o.data_recebimento IS NOT NULL 
          AND COALESCE(o.cancelado,'N') = 'N'
          AND o.empresa_id IN (1, 2, 3, 5, 6) 
          AND (o.pedido_fechado = 'S' OR o.recebido = 'S')
        UNION ALL
        SELECT
          n.empresa_id, n.data_emissao, 
          0 as v_prod,
          0 as v_outros,
          0 as v_frete,
          0 as v_pedido,
          0 as cnt_v,
          0 as bs, 0 as luc,
          n.valor_produtos as real_dev,
          n.valor_produtos as bs_d, (n.valor_produtos * 0.09) as luc_d
        FROM ADM.notas_fiscais n
        WHERE TRUNC(n.data_emissao) >= TRUNC(SYSDATE, 'MM')
          AND n.empresa_id IN (1, 2, 3, 5, 6)
          AND (n.devolucao_id IS NOT NULL OR n.cfop_id IN ('1.201', '1.202', '1.410', '1.411', '2.201', '2.202', '2.410', '2.411'))
    )
  ),
  vendas_f_final AS (
    SELECT
      eid,
      SUM(v_prod) AS total_prod_gross,
      SUM(real_dev) AS total_return,
      SUM(v_frete) AS total_frete,
      SUM(v_outros) AS total_outros,
      -- Realizado = valor_pedido - outras_despesas (conforme regra exata solicitada)
      SUM(v_pedido - v_outros) AS realized_liq,
      SUM(cnt_v) AS closed_budgets,
      SUM(bs - bs_d) AS base_lucro_pres,
      SUM(luc - luc_d) AS lucro_abs,
      SUM(CASE WHEN TRUNC(dt) = TRUNC(SYSDATE) THEN v_pedido - v_outros ELSE 0 END) AS realized_today_gross,
      SUM(CASE WHEN TRUNC(dt) = TRUNC(SYSDATE) THEN cnt_v ELSE 0 END) AS today_closed_budgets,
      SUM(CASE WHEN TRUNC(dt) = TRUNC(SYSDATE) THEN luc - luc_d ELSE 0 END) AS lucro_hoje_abs
    FROM vendas_base
    GROUP BY eid
  ),
  dev_req_f AS (
    -- Devoluções confirmadas (STATUS='B') em ADM.REQUISICOES_DEVOLUCOES por filial
    SELECT
      d.empresa_id AS eid,
      SUM(d.valor_devolucao) AS v_dev_req,
      SUM(CASE WHEN TRUNC(d.data_devolucao) = TRUNC(SYSDATE) THEN d.valor_devolucao ELSE 0 END) AS v_dev_req_hoje
    FROM ADM.requisicoes_devolucoes d
    WHERE TRUNC(d.data_devolucao) >= TRUNC(SYSDATE, 'MM')
      AND d.empresa_id IN (1, 2, 3, 5, 6)
      AND d.status = 'B'
    GROUP BY d.empresa_id
  )
SELECT
  e.empresa_id, COALESCE(e.nome_resumido, '') AS name, COALESCE(mf.meta, 0) AS goal,
  CASE WHEN COALESCE(rz.base_lucro_pres, 0) > 0 THEN (COALESCE(rz.lucro_abs, 0) / rz.base_lucro_pres * 100.0) ELSE 0 END AS profit_pct,
  COALESCE(rz.lucro_abs, 0) AS lucro_abs,
  COALESCE(rz.base_lucro_pres, 0) AS base_lucro_pres,
  -- Hoje: vendas do dia menos devoluções do dia
  GREATEST(COALESCE(rz.realized_today_gross, 0) - COALESCE(dr.v_dev_req_hoje, 0), 0) AS realized_today,
  COALESCE(rz.closed_budgets, 0) AS closed_budgets,
  COALESCE(rz.today_closed_budgets, 0) AS today_closed_budgets,
  COALESCE(rz.lucro_hoje_abs, 0) AS lucro_hoje_abs,
  COALESCE(rz.total_prod_gross, 0) AS products_gross,
  COALESCE(rz.total_return, 0) AS return_val,
  COALESCE(rz.total_frete, 0) AS frete_val,
  COALESCE(rz.total_outros, 0) AS outros_val,
  -- Realizado Liq = valor_prod - desconto - devoluçoes(REQUISICOES STATUS='B')
  GREATEST(COALESCE(rz.realized_liq, 0) - COALESCE(dr.v_dev_req, 0), 0) AS realized_liq
FROM ADM.empresas e
LEFT JOIN metas_filial_cte mf ON mf.empresa_id = e.empresa_id
LEFT JOIN vendas_f_final rz ON rz.eid = e.empresa_id
LEFT JOIN dev_req_f dr ON dr.eid = e.empresa_id
WHERE e.empresa_id IN (1, 2, 3, 5, 6)
ORDER BY e.empresa_id
`;

const SQL_SELLERS = `
WITH
  orc_unico_v AS (
    SELECT * FROM (
      SELECT 
        o.orcamento_id, o.vendedor_id, o.empresa_id, o.pedido_fechado, o.recebido, o.data_recebimento, o.data_cadastro,
        (o.valor_produtos - o.valor_desconto) AS v_prod,
        COALESCE(o.valor_outras_despesas, 0) AS v_outros,
        COALESCE(o.valor_frete_processado, 0) AS v_frete,
        COALESCE(o.valor_pedido, 0) AS v_pedido,
        (o.valor_produtos - o.valor_desconto - COALESCE(o.valor_total_retencao_fin, 0) - (SELECT SUM(COALESCE(io.valor_juros_embutidos, 0)) FROM ADM.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id)) AS bs_l_pres,
        COALESCE(o.perc_lucro_fechamento, 0) AS p_lucro,
        ROW_NUMBER() OVER (PARTITION BY o.orcamento_id ORDER BY o.empresa_id) as rn
      FROM ADM.orcamentos o
      WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
        AND o.data_recebimento IS NOT NULL 
        AND COALESCE(o.cancelado,'N') = 'N'
        AND o.empresa_id IN (1, 2, 3, 5, 6)
    ) WHERE rn = 1
  ),
  vendas_v_base AS (
    SELECT
      v_u.vendedor_id AS seller_id,
      v_u.data_recebimento as dt_rec,
      v_u.data_cadastro as dt_cad,
      v_u.orcamento_id,
      v_u.v_prod,
      v_u.v_outros,
      v_u.v_frete,
      v_u.v_pedido,
      v_u.bs_l_pres,
      v_u.p_lucro,
      0 as real_dev,
      0 as bs_d, 0 as luc_d
    FROM orc_unico_v v_u
    WHERE (v_u.pedido_fechado = 'S' OR v_u.recebido = 'S')
    UNION ALL
    SELECT
      o.vendedor_id, n.data_emissao, n.data_emissao, 0, 0, 0, 0, 0,
      0, 0,
      n.valor_produtos as real_dev,
      n.valor_produtos as bs_d, (n.valor_produtos * 0.09) as luc_d
    FROM ADM.notas_fiscais n
    JOIN ADM.orcamentos o ON o.orcamento_id = n.orcamento_base_id
    WHERE TRUNC(n.data_emissao) >= TRUNC(SYSDATE, 'MM')
      AND n.empresa_id IN (1, 2, 3, 5, 6)
      AND (n.devolucao_id IS NOT NULL OR n.cfop_id IN ('1.201', '1.202', '1.410', '1.411', '2.201', '2.202', '2.410', '2.411'))
  ),
  vendas_v_final AS (
    SELECT
      seller_id,
      COUNT(DISTINCT orcamento_id) AS closed_budgets,
      -- Realizado = valor_pedido - outras_despesas (conforme regra exata solicitada)
      SUM(v_pedido - v_outros) AS realized_gross,
      SUM(v_pedido - v_outros) AS realized_liq,
      SUM(bs_l_pres - bs_d) AS base_lucro_pres,
      SUM((bs_l_pres * (p_lucro / 100.0)) - luc_d) AS lucro_abs,
      SUM(CASE WHEN TRUNC(dt_rec) = TRUNC(SYSDATE) THEN v_pedido - v_outros ELSE 0 END) AS realized_today,
      COUNT(DISTINCT CASE WHEN TRUNC(dt_rec) = TRUNC(SYSDATE) THEN orcamento_id END) AS today_closed_budgets,
      SUM(CASE WHEN TRUNC(dt_rec) >= TRUNC(SYSDATE, 'IW') THEN v_pedido - v_outros ELSE 0 END) AS realized_weekly,
      COUNT(DISTINCT CASE WHEN TRUNC(dt_rec) >= TRUNC(SYSDATE, 'IW') THEN orcamento_id END) AS weekly_closed_budgets
    FROM vendas_v_base
    GROUP BY seller_id
  ),
  metas_v_cte AS (
    SELECT im.funcionario_id AS seller_id, SUM(im.meta) AS v_meta, AVG(COALESCE(im.perc_lucro_meta, 0)) AS perc_lucro_meta
    FROM ADM.itens_metas im 
    WHERE im.ano_mes = (EXTRACT(YEAR FROM SYSDATE) * 100 + EXTRACT(MONTH FROM SYSDATE)) 
      AND im.empresa_id IN (1, 2, 3, 5, 6)
    GROUP BY im.funcionario_id
  ),
  carteira_v_cte AS (
    SELECT cl.funcionario_id AS seller_id, COUNT(DISTINCT cl.cadastro_id) AS total_clientes 
    FROM ADM.clientes cl WHERE cl.cliente_ativo <> 'N' AND cl.funcionario_id IN (244, 12, 17, 67, 200, 110, 193, 114, 215, 108, 163, 46)
    GROUP BY cl.funcionario_id
  ),
  positivacao_v_cte AS (
    -- Positivação filtrada: conta apenas clientes onde o vendedor do orçamento
    -- é o mesmo funcionario_id registrado no cadastro fixo do cliente (carteira oficial)
    SELECT o.vendedor_id AS seller_id, COUNT(DISTINCT o.cadastro_id) AS clientes_positivados
    FROM ADM.orcamentos o
    -- JOIN garante que o cliente pertence à carteira oficial do vendedor
    INNER JOIN ADM.clientes cl
      ON cl.cadastro_id = o.cadastro_id
     AND cl.funcionario_id = o.vendedor_id
     AND cl.cliente_ativo <> 'N'
    WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
      AND o.data_recebimento IS NOT NULL 
      AND (o.pedido_fechado = 'S' OR o.recebido = 'S')
      AND COALESCE(o.cancelado,'N') = 'N'
      AND o.vendedor_id IN (244, 12, 17, 67, 200, 110, 193, 114, 215, 108, 163, 46)
    GROUP BY o.vendedor_id
  ),
  dev_req_v AS (
    -- Devoluções confirmadas (STATUS='B') em ADM.REQUISICOES_DEVOLUCOES por vendedor
    SELECT
      d.vendedor_id AS seller_id,
      SUM(d.valor_devolucao) AS v_dev_req,
      SUM(CASE WHEN TRUNC(d.data_devolucao) = TRUNC(SYSDATE) THEN d.valor_devolucao ELSE 0 END) AS v_dev_req_hoje,
      SUM(CASE WHEN TRUNC(d.data_devolucao) >= TRUNC(SYSDATE, 'IW') THEN d.valor_devolucao ELSE 0 END) AS v_dev_req_semana
    FROM ADM.requisicoes_devolucoes d
    WHERE TRUNC(d.data_devolucao) >= TRUNC(SYSDATE, 'MM')
      AND d.empresa_id IN (1, 2, 3, 5, 6)
      AND d.status = 'B'
    GROUP BY d.vendedor_id
  )
SELECT
  f.funcionario_id AS seller_id, f.nome AS seller_name, COALESCE(mm.v_meta, 0) as goal_meta,
  -- Realizado líquido com devoluções descontadas
  GREATEST(COALESCE(v.realized_gross, 0) - COALESCE(dr.v_dev_req, 0), 0) AS net_sales,
  CASE WHEN COALESCE(v.base_lucro_pres, 0) > 0 THEN (COALESCE(v.lucro_abs, 0) / v.base_lucro_pres * 100.0) ELSE 0 END AS profit_pct,
  COALESCE(mm.perc_lucro_meta, 0) as profit_meta_pct,
  COALESCE(v.lucro_abs, 0) as profit_abs,
  COALESCE(v.closed_budgets, 0) as closed_budgets,
  COALESCE(cw.total_clientes, 0) AS wallet_total,
  COALESCE(pv.clientes_positivados, 0) AS wallet_positive_month,
  GREATEST(COALESCE(v.realized_today, 0) - COALESCE(dr.v_dev_req_hoje, 0), 0) AS realized_today,
  COALESCE(v.today_closed_budgets, 0) AS today_closed_budgets,
  GREATEST(COALESCE(v.realized_weekly, 0) - COALESCE(dr.v_dev_req_semana, 0), 0) AS realized_weekly,
  COALESCE(v.weekly_closed_budgets, 0) AS weekly_closed_budgets
FROM ADM.funcionarios f
INNER JOIN metas_v_cte mm ON mm.seller_id = f.funcionario_id
LEFT JOIN vendas_v_final v ON v.seller_id = f.funcionario_id
LEFT JOIN carteira_v_cte cw ON cw.seller_id = f.funcionario_id
LEFT JOIN positivacao_v_cte pv ON pv.seller_id = f.funcionario_id
LEFT JOIN dev_req_v dr ON dr.seller_id = f.funcionario_id
WHERE f.funcionario_id IN (244, 12, 17, 67, 200, 110, 193, 114, 215, 108, 163, 46)
ORDER BY net_sales DESC
`;

const SQL_DIAS = `SELECT COUNT(*) AS uteis_mes, COUNT(CASE WHEN T.D <= TRUNC(SYSDATE) THEN 1 END) AS uteis_corridos FROM (SELECT TRUNC(SYSDATE, 'MM') + LEVEL - 1 AS D FROM DUAL CONNECT BY LEVEL <= (LAST_DAY(SYSDATE) - TRUNC(SYSDATE, 'MM') + 1)) T WHERE TO_CHAR(T.D, 'D') BETWEEN '2' AND '6'`;

const SQL_HISTORY = `
WITH
  meses_agrupados AS (
    SELECT
      TRUNC(o.data_recebimento, 'MM') AS mes,
      SUM(o.valor_produtos - o.valor_desconto) AS v_prod,
      SUM(COALESCE(o.valor_outras_despesas, 0)) AS v_outros,
      SUM(o.valor_produtos - o.valor_desconto - COALESCE(o.valor_total_retencao_fin, 0) - (SELECT SUM(COALESCE(io.valor_juros_embutidos, 0)) FROM ADM.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id)) AS base_l,
      SUM((o.valor_produtos - o.valor_desconto - COALESCE(o.valor_total_retencao_fin, 0) - (SELECT SUM(COALESCE(io.valor_juros_embutidos, 0)) FROM ADM.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id)) * (COALESCE(o.perc_lucro_fechamento, 0) / 100.0)) AS luc_abs
    FROM ADM.orcamentos o
    WHERE o.data_recebimento >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -16)
      AND o.data_recebimento IS NOT NULL
      AND o.empresa_id IN (1, 2, 3, 5, 6)
      AND (o.pedido_fechado = 'S' OR o.recebido = 'S')
      AND COALESCE(o.cancelado, 'N') = 'N'
    GROUP BY TRUNC(o.data_recebimento, 'MM')
  ),
  devolucoes_historico AS (
    SELECT
      TRUNC(n.data_emissao, 'MM') AS mes,
      SUM(n.valor_produtos) AS v_dev,
      SUM(n.valor_produtos * 0.09) AS luc_d -- Estimativa de 9% de lucro perdido na devolução
    FROM ADM.notas_fiscais n
    WHERE n.data_emissao >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -16)
      AND n.empresa_id IN (1, 2, 3, 5, 6)
      AND (n.devolucao_id IS NOT NULL OR n.cfop_id IN ('1.201', '1.202', '1.410', '1.411', '2.201', '2.202', '2.410', '2.411'))
    GROUP BY TRUNC(n.data_emissao, 'MM')
  )
SELECT
  TO_CHAR(m.mes, 'YYYY-MM') AS month_label,
  (m.v_prod - COALESCE(d.v_dev, 0) + m.v_outros) AS realized,
  (m.luc_abs - COALESCE(d.luc_d, 0)) AS profit_abs,
  CASE WHEN (m.base_l - COALESCE(d.v_dev, 0)) > 0 
       THEN ((m.luc_abs - COALESCE(d.luc_d, 0)) / (m.base_l - COALESCE(d.v_dev, 0)) * 100.0) 
       ELSE 0 END AS profit_pct
FROM meses_agrupados m
LEFT JOIN devolucoes_historico d ON d.mes = m.mes
ORDER BY month_label ASC
`;

export async function getTVDashboardData(): Promise<TVDashboardData> {
  const [resFiliais, resSellers, resDias, resHistory] = await Promise.all([
    pool.query(SQL_FILIAIS),
    pool.query(SQL_SELLERS),
    pool.query(SQL_DIAS),
    pool.query(SQL_HISTORY)
  ]);

  const filiais: FilialRow[] = resFiliais.rows.map((r: any) => ({
    empresa_id: toNum(r.EMPRESA_ID || r.empresa_id),
    name: r.NAME || r.name,
    goal: toNum(r.GOAL || r.goal),
    profit_pct: toNum(r.PROFIT_PCT || r.profit_pct),
    lucro_abs: toNum(r.LUCRO_ABS || r.lucro_abs),
    base_lucro_pres: toNum(r.BASE_LUCRO_PRES || r.base_lucro_pres),
    realized_today: toNum(r.REALIZED_TODAY || r.realized_today),
    closed_budgets: toNum(r.CLOSED_BUDGETS || r.closed_budgets),
    today_closed_budgets: toNum(r.TODAY_CLOSED_BUDGETS || r.today_closed_budgets),
    lucro_hoje_abs: toNum(r.LUCRO_HOJE_ABS || r.lucro_hoje_abs),
    products_gross: toNum(r.PRODUCTS_GROSS || r.products_gross),
    return_val: toNum(r.RETURN_VAL || r.return_val),
    frete_val: toNum(r.FRETE_VAL || r.frete_val),
    outros_val: toNum(r.OUTROS_VAL || r.outros_val),
    realized_liq: toNum(r.REALIZED_LIQ || r.realized_liq),
    realized: toNum(r.REALIZED_LIQ || r.realized_liq), // for compatibility
    pct: (toNum(r.GOAL || r.goal) || 0) > 0 ? ((toNum(r.REALIZED_LIQ || r.realized_liq) || 0) / (toNum(r.GOAL || r.goal) || 1) * 100) : 0
  }));

  const sellers: SellerRow[] = resSellers.rows.map((r: any) => ({
    seller_id: toNum(r.SELLER_ID || r.seller_id),
    seller_name: r.SELLER_NAME || r.seller_name,
    goal_meta: toNum(r.GOAL_META || r.goal_meta),
    net_sales: toNum(r.NET_SALES || r.net_sales),
    profit_pct: toNum(r.PROFIT_PCT || r.profit_pct),
    profit_meta_pct: toNum(r.PROFIT_META_PCT || r.profit_meta_pct),
    profit_abs: toNum(r.PROFIT_ABS || r.profit_abs),
    closed_budgets: toNum(r.CLOSED_BUDGETS || r.closed_budgets),
    wallet_total: toNum(r.WALLET_TOTAL || r.wallet_total),
    wallet_positive_month: toNum(r.WALLET_POSITIVE_MONTH || r.wallet_positive_month),
    realized_today: toNum(r.REALIZED_TODAY || r.realized_today),
    today_closed_budgets: toNum(r.TODAY_CLOSED_BUDGETS || r.today_closed_budgets),
    realized_weekly: toNum(r.REALIZED_WEEKLY || r.realized_weekly),
    weekly_closed_budgets: toNum(r.WEEKLY_CLOSED_BUDGETS || r.weekly_closed_budgets),
    pct_achieved: toNum(r.GOAL_META || r.goal_meta) > 0 ? (toNum(r.NET_SALES || r.net_sales) / toNum(r.GOAL_META || r.goal_meta) * 100) : 0,
    weekly_meta: toNum(r.GOAL_META || r.goal_meta) / 4,
    weekly_realized: toNum(r.REALIZED_WEEKLY || r.realized_weekly),
    weekly_pct_achieved: (toNum(r.GOAL_META || r.goal_meta) / 4) > 0 ? (toNum(r.REALIZED_WEEKLY || r.realized_weekly) / (toNum(r.GOAL_META || r.goal_meta) / 4) * 100) : 0,
    weekly_bonus: 0,
    wallet_positive_pct: toNum(r.WALLET_TOTAL || r.wallet_total) > 0 ? (toNum(r.WALLET_POSITIVE_MONTH || r.wallet_positive_month) / toNum(r.WALLET_TOTAL || r.wallet_total) * 100) : 0
  }));


  const diasUteisMonth = toNum(resDias.rows[0].UTEIS_MES || resDias.rows[0].uteis_mes || resDias.rows[0][0]);
  const diasUteisElapsed = toNum(resDias.rows[0].UTEIS_CORRIDOS || resDias.rows[0].uteis_corridos || resDias.rows[0][1]);

  const allHistory: HistoryRow[] = resHistory.rows.map((r: any) => ({
    month_key: r.MONTH_LABEL || r.month_label,
    total_realized: toNum(r.REALIZED || r.realized),
    total_profit_abs: toNum(r.PROFIT_ABS || r.profit_abs),
    profit_pct: toNum(r.PROFIT_PCT || r.profit_pct)
  }));

  // Define quads based on user rule: Jan-Apr, May-Aug, Sep-Dec
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentQ = Math.floor((currentMonth - 1) / 4) + 1;
  let lastQNum = currentQ - 1;
  let lastQYear = currentYear;
  if (lastQNum === 0) { lastQNum = 3; lastQYear -= 1; }

  // Filter for last quad strictly
  const lastQStartMonth = (lastQNum - 1) * 4 + 1;
  const lastQEndMonth = lastQNum * 4;
  const lastQuadrimestreMonths = allHistory.filter(m => {
    const [y, mo] = (m.month_key || "").split("-").map(Number);
    return y === lastQYear && mo >= lastQStartMonth && mo <= lastQEndMonth;
  });

  const totalGoal = filiais.reduce((acc, f) => acc + f.goal, 0);
  const totalNetRealized = filiais.reduce((acc, f) => acc + f.realized_liq, 0);
  const totalReturn = filiais.reduce((acc, f) => acc + f.return_val, 0);
  const totalFrete = filiais.reduce((acc, f) => acc + f.frete_val, 0);
  const totalOutros = filiais.reduce((acc, f) => acc + f.outros_val, 0);
  const totalProductsGross = filiais.reduce((acc, f) => acc + f.products_gross, 0);

  const totalBaseLucro = filiais.reduce((acc, f) => acc + f.base_lucro_pres, 0);
  const totalProfitAbs = filiais.reduce((acc, f) => acc + f.lucro_abs, 0);
  const totalWallets = sellers.reduce((acc, s) => acc + s.wallet_total, 0);
  const totalPositives = sellers.reduce((acc, s) => acc + s.wallet_positive_month, 0);

  return {
    updatedAt: new Date().toISOString(),
    totalGoal,
    totalRealized: totalNetRealized,
    totalProductsGross,
    totalReturn,
    totalFrete,
    totalOutros,
    totalPct: totalGoal > 0 ? (totalNetRealized / totalGoal * 100) : 0,
    totalClosedBudgets: filiais.reduce((acc, f) => acc + f.closed_budgets, 0),
    todayClosedBudgets: filiais.reduce((acc, f) => acc + f.today_closed_budgets, 0),
    todayRealized: filiais.reduce((acc, f) => acc + f.realized_today, 0),
    businessDaysMonth: diasUteisMonth,
    businessDaysElapsed: diasUteisElapsed,
    businessDaysRemaining: Math.max(0, diasUteisMonth - diasUteisElapsed),
    filiais,
    sellers,
    positivacaoTotal: totalWallets,
    positivacaoPositive: totalPositives,
    positivacaoPct: totalWallets > 0 ? (totalPositives / totalWallets * 100) : 0,
    totalProfitMonth: totalProfitAbs,
    totalProfitToday: filiais.reduce((acc, f) => acc + f.lucro_hoje_abs, 0),
    totalProfitPct: totalBaseLucro > 0 ? (totalProfitAbs / totalBaseLucro * 100) : 0,
    history: allHistory, // components will filter this
    lastQuadrimestreMonths
  };
}
