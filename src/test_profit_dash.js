const { Pool } = require('pg');
const pool = new Pool({ host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279' });

async function run() {
    const dateIni = '2026-02-01';
    const dateFim = '2026-02-28';
    const empresaIds = ['1', '2', '3', '5', '6'];

    try {
        const sql = `
WITH
  params_cte AS (SELECT CURRENT_DATE::date AS ref),
  periodo_cte AS (
    SELECT $1::date AS dt_ini, $2::date AS dt_fim
  ),
  orc_filt_f_cte AS (
    SELECT 
      o.orcamento_id,
      o.empresa_id::text as empresa_id,
      o.valor_pedido,
      o.valor_ipi,
      o.valor_subst_trib,
      o.valor_fcp_st,
      o.valor_outras_desp_manual,
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
      AND o.empresa_id::text = ANY($3::text[])
  ),
  vendas_itens_f_cte AS (
    SELECT 
        io.orcamento_id,
        SUM(COALESCE(io.quantidade * io.icms_medio, 0)) as icms_rs,
        SUM(COALESCE(io.valor_desconto_pis::numeric, 0) + COALESCE(io.valor_desconto_cofins::numeric, 0)) as pis_cofins_rs,
        SUM(COALESCE(io.quantidade * io.custo_comercial, 0)) as custo_total
    FROM public.itens_orcamentos io
    WHERE EXISTS (SELECT 1 FROM orc_filt_f_cte ofc WHERE ofc.orcamento_id = io.orcamento_id)
    GROUP BY 1
  ),
  vendas_cte AS (
    SELECT
      o.empresa_id,
      SUM(CASE WHEN COALESCE(o.totalmente_devolvido,'N')='N' THEN 
        (COALESCE(o.valor_pedido,0) - COALESCE(o.valor_ipi,0) - COALESCE(o.valor_subst_trib,0) - COALESCE(o.valor_fcp_st,0) - COALESCE(o.valor_outras_desp_manual,0) - COALESCE(o.valor_frete_processado, 0) - COALESCE(o.valor_frete_extra_manual, 0) - COALESCE(vi.icms_rs, 0) - COALESCE(vi.pis_cofins_rs, 0))
      ELSE 0 END)::numeric AS base_lucro_presente,
      SUM(CASE WHEN COALESCE(o.totalmente_devolvido,'N')='N' THEN COALESCE(vi.custo_total, 0) ELSE 0 END)::numeric AS custo_total
    FROM orc_filt_f_cte o
    LEFT JOIN vendas_itens_f_cte vi ON vi.orcamento_id = o.orcamento_id
    GROUP BY 1
  )
  SELECT 
    SUM(base_lucro_presente) as base_total,
    SUM(custo_total) as custo_total
  FROM vendas_cte
        `;
        const res = await pool.query(sql, [dateIni, dateFim, empresaIds]);
        console.log(res.rows[0]);
    } catch (e) { console.error(e) }
    pool.end();
}
run();
