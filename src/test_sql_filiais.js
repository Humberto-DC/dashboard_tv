const { Client } = require('pg');
const EMPRESA_IDS = ["1", "2", "3", "5", "6"];
const SQL_FILIAIS = `
WITH
  params_cte AS (SELECT CURRENT_DATE::date AS ref),
  periodo_cte AS (
    SELECT
      date_trunc('month', pm.ref)::date AS dt_ini,
      (date_trunc('month', pm.ref) + interval '1 month - 1 day')::date AS dt_fim
    FROM params_cte pm
  ),
  metas_filial_cte AS (
    SELECT m.empresa_id::text AS empresa_id, COALESCE(SUM(m.meta::numeric), 0)::numeric AS meta
    FROM public.metas m
    WHERE m.empresa_id::text = ANY($1::text[])
      AND m.ano_mes::text = (EXTRACT(YEAR FROM CURRENT_DATE)::text || LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::text, 2, '0'))
    GROUP BY 1
  ),
  orc_filt_f_cte AS (
    SELECT 
      o.orcamento_id,
      o.empresa_id::text,
      o.valor_pedido,
      o.valor_ipi,
      o.valor_subst_trib,
      o.valor_fcp_st,
      o.valor_outras_desp_manual,
      o.valor_total_retencao_fin,
      o.valor_frete_processado,
      o.valor_frete_extra_manual,
      o.totalmente_devolvido,
      o.perc_lucro_fechamento,
      o.data_recebimento
    FROM public.orcamentos o
    CROSS JOIN periodo_cte p
    WHERE o.data_recebimento >= p.dt_ini AND o.data_recebimento < (p.dt_fim + interval '1 day')
      AND COALESCE(o.cancelado,'N') = 'N'
      AND COALESCE(o.recebido,'S') = 'S'
      AND o.empresa_id::text = ANY($1::text[])
  ),
  vendas_itens_f_cte AS (
    SELECT 
        io.orcamento_id,
        SUM(COALESCE((io.quantidade * io.icms_medio)::numeric, 0))::numeric as icms_rs,
        SUM(COALESCE(io.valor_desconto_pis::numeric, 0) + COALESCE(io.valor_desconto_cofins::numeric, 0)) as pis_cofins_rs,
        SUM(COALESCE((io.quantidade * io.custo_comercial)::numeric, 0))::numeric as custo_total,
        SUM(COALESCE(io.valor_juros_embutidos::numeric, 0)) as juros_embutidos_rs
    FROM public.itens_orcamentos io
    WHERE EXISTS (SELECT 1 FROM orc_filt_f_cte ofc WHERE ofc.orcamento_id = io.orcamento_id)
    GROUP BY 1
  ),
  devolucoes_vendas_f_cte AS (
    SELECT 
        rd.orcamento_id as orcamento_id,
        SUM(COALESCE((ird.quantidade * ird.preco_venda)::numeric, 0))::numeric as dev_val
    FROM public.itens_requisicoes_devolucoes ird
    JOIN public.requisicoes_devolucoes rd ON rd.requisicao_id = ird.requisicao_id
    WHERE EXISTS (SELECT 1 FROM orc_filt_f_cte ofc WHERE ofc.orcamento_id = rd.orcamento_id)
      AND ird.data_hora_alteracao >= (SELECT dt_ini FROM periodo_cte)
      AND ird.data_hora_alteracao < ((SELECT dt_fim FROM periodo_cte) + interval '1 day')
    GROUP BY 1
  ),
  vendas_cte AS (
    SELECT
      o.empresa_id,
      SUM(COALESCE(o.valor_pedido::numeric,0))::numeric AS valor_bruto,
      SUM(
        COALESCE(o.valor_pedido::numeric, 0) 
        - COALESCE(o.valor_ipi::numeric, 0) 
        - COALESCE(o.valor_subst_trib::numeric, 0) 
        - COALESCE(o.valor_fcp_st::numeric, 0) 
        - COALESCE(o.valor_frete_processado::numeric, 0) 
        - COALESCE(o.valor_frete_extra_manual::numeric, 0) 
        - COALESCE(o.valor_outras_desp_manual::numeric, 0)
        - COALESCE(o.valor_total_retencao_fin::numeric, 0)
        - COALESCE(vi.juros_embutidos_rs, 0)
      )::numeric AS valor_liq_venda,
      SUM(COALESCE(o.valor_pedido::numeric,0) - COALESCE(vi.juros_embutidos_rs, 0))::numeric AS base_lucro_presente,
      SUM((COALESCE(o.valor_pedido::numeric,0) - COALESCE(vi.juros_embutidos_rs, 0)) * COALESCE(o.perc_lucro_fechamento, 0) / 100.0)::numeric AS lucro_abs,
      SUM(CASE WHEN o.data_recebimento::date = CURRENT_DATE THEN 
        (COALESCE(o.valor_pedido::numeric,0) - COALESCE(vi.juros_embutidos_rs, 0))
        * COALESCE(o.perc_lucro_fechamento, 0) / 100.0 ELSE 0 END)::numeric AS lucro_hoje_abs,
      SUM(COALESCE(o.valor_outras_desp_manual::numeric,0))::numeric AS desp_op,
      COUNT(DISTINCT o.orcamento_id)::int AS closed_budgets 
    FROM orc_filt_f_cte o
    LEFT JOIN vendas_itens_f_cte vi ON vi.orcamento_id = o.orcamento_id
    LEFT JOIN devolucoes_vendas_f_cte dv ON dv.orcamento_id = o.orcamento_id
    GROUP BY 1
  ),
  dev_cte AS (
    SELECT 
      rd.empresa_id::text AS empresa_id, 
      SUM(COALESCE((ird.quantidade * ird.preco_venda)::numeric, 0))::numeric AS total_dev,
      SUM(COALESCE((ird.quantidade * ird.preco_venda)::numeric, 0) * COALESCE(o.perc_lucro_fechamento, 0) / 100.0)::numeric AS total_dev_profit
    FROM public.itens_requisicoes_devolucoes ird
    JOIN public.requisicoes_devolucoes rd ON ird.requisicao_id = rd.requisicao_id
    LEFT JOIN public.orcamentos o ON o.orcamento_id = rd.orcamento_id
    CROSS JOIN periodo_cte p_inner
    WHERE ird.data_hora_alteracao >= p_inner.dt_ini AND ird.data_hora_alteracao < (p_inner.dt_fim + interval '1 day')
      AND rd.empresa_id::text = ANY($1::text[])
    GROUP BY 1
  ),
  realizado_cte AS (
    SELECT vds.empresa_id,
      COALESCE(vds.valor_liq_venda, 0) - COALESCE(dv.total_dev, 0) AS net_sales,
      vds.closed_budgets,
      COALESCE(vds.lucro_abs, 0) - COALESCE(dv.total_dev_profit, 0) AS lucro_abs,
      vds.lucro_hoje_abs,
      COALESCE(vds.base_lucro_presente, 0) - COALESCE(dv.total_dev, 0) AS base_lucro_presente,
      CASE WHEN (COALESCE(vds.base_lucro_presente, 0) - COALESCE(dv.total_dev, 0)) > 0 
           THEN ROUND(((COALESCE(vds.lucro_abs, 0) - COALESCE(dv.total_dev_profit, 0)) / (COALESCE(vds.base_lucro_presente, 0) - COALESCE(dv.total_dev, 0)) * 100.0)::numeric, 3) 
           ELSE 0 END AS profit_pct
    FROM vendas_cte vds LEFT JOIN dev_cte dv ON dv.empresa_id = vds.empresa_id
  ),
  vendas_hoje_cte AS (
    SELECT o.empresa_id::text AS empresa_id,
      SUM(COALESCE(o.valor_pedido::numeric,0))::numeric AS valor_bruto,
      SUM(
        COALESCE(o.valor_pedido::numeric, 0) 
        - COALESCE(o.valor_ipi::numeric, 0) 
        - COALESCE(o.valor_subst_trib::numeric, 0) 
        - COALESCE(o.valor_fcp_st::numeric, 0) 
        - COALESCE(o.valor_frete_processado::numeric, 0) 
        - COALESCE(o.valor_frete_extra_manual::numeric, 0) 
        - COALESCE(o.valor_outras_desp_manual::numeric, 0)
        - COALESCE(o.valor_total_retencao_fin::numeric, 0)
      )::numeric AS v_liq_hoje_sem_tc,
      SUM(COALESCE((SELECT SUM(COALESCE(io_sub.valor_juros_embutidos::numeric, 0)) FROM public.itens_orcamentos io_sub WHERE io_sub.orcamento_id = o.orcamento_id), 0))::numeric as tc_hoje
    FROM public.orcamentos o
    WHERE o.data_recebimento >= CURRENT_DATE AND o.data_recebimento < (CURRENT_DATE + interval '1 day')
      AND COALESCE(o.cancelado,'N') = 'N'
      AND o.empresa_id::text = ANY($1::text[])
    GROUP BY 1
  ),
  dev_hoje_cte AS (
    SELECT rd.empresa_id::text AS empresa_id, SUM(COALESCE((ird.quantidade*ird.preco_venda)::numeric,0))::numeric AS total_dev
    FROM public.itens_requisicoes_devolucoes ird
    JOIN public.requisicoes_devolucoes rd ON ird.requisicao_id = rd.requisicao_id
    WHERE ird.data_hora_alteracao >= CURRENT_DATE AND ird.data_hora_alteracao < (CURRENT_DATE + interval '1 day')
      AND rd.empresa_id::text = ANY($1::text[])
    GROUP BY 1
  ),
  realizado_hoje_cte AS (
    SELECT vh.empresa_id,
      ROUND((COALESCE(vh.v_liq_hoje_sem_tc,0) - COALESCE(vh.tc_hoje, 0) - COALESCE(d_h.total_dev,0))::numeric, 2) AS net_today
    FROM vendas_hoje_cte vh LEFT JOIN dev_hoje_cte d_h ON d_h.empresa_id = vh.empresa_id
  )
SELECT
  e.empresa_id::text,
  COALESCE(e.nome_resumido,'')::text AS name,
  COALESCE(mf.meta,0)::numeric AS goal,
  COALESCE(rz.net_sales,0)::numeric AS realized,
  CASE WHEN COALESCE(mf.meta,0) > 0 THEN (COALESCE(rz.net_sales,0)/mf.meta)*100 ELSE 0 END::numeric AS pct,
  COALESCE(rh.net_today,0)::numeric AS realized_today,
  COALESCE(rz.closed_budgets,0)::int AS closed_budgets,
  COALESCE(rz.profit_pct,0)::numeric AS profit_pct,
       COALESCE(rz.lucro_abs, 0)::numeric AS lucro_abs,
  COALESCE(rz.lucro_hoje_abs, 0)::numeric AS lucro_hoje_abs,
  COALESCE(rz.base_lucro_presente, 0)::numeric AS base_lucro_pres
FROM public.empresas e
LEFT JOIN metas_filial_cte mf ON mf.empresa_id = e.empresa_id::text
LEFT JOIN realizado_cte rz ON rz.empresa_id = e.empresa_id::text
LEFT JOIN realizado_hoje_cte rh ON rh.empresa_id = e.empresa_id::text
WHERE e.empresa_id::text = ANY($1::text[])
ORDER BY pct DESC;
`;

async function test() {
    const client = new Client({
        host: '172.16.0.32',
        port: 5432,
        database: 'migracao_oracle',
        user: 'radar_dev',
        password: '121279'
    });
    try {
        await client.connect();
        const res = await client.query(SQL_FILIAIS, [EMPRESA_IDS]);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
test();
