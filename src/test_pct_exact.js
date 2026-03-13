const { Pool } = require('pg');
const pool = new Pool({ host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279' });

async function run() {
    const empresaIds = ['1', '2', '3', '5', '6'];
    try {
        const sql = `
WITH
  periodo_cte AS (SELECT date_trunc('month', CURRENT_DATE)::date AS dt_ini, (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date AS dt_fim),
  orc AS (
    SELECT o.orcamento_id, o.valor_pedido, o.valor_ipi, o.valor_subst_trib,
      o.valor_fcp_st, o.valor_outras_desp_manual, o.valor_frete_processado,
      o.valor_frete_extra_manual, o.totalmente_devolvido, o.perc_lucro_fechamento
    FROM public.orcamentos o CROSS JOIN periodo_cte p
    WHERE o.data_recebimento >= p.dt_ini AND o.data_recebimento < (p.dt_fim + interval '1 day')
      AND COALESCE(o.cancelado,'N') = 'N' AND COALESCE(o.recebido,'S') = 'S'
      AND o.empresa_id::text = ANY($1::text[])
  ),
  itens AS (
    SELECT io.orcamento_id, SUM(COALESCE(io.quantidade * io.icms_medio, 0)) as icms_rs,
        SUM(COALESCE(io.valor_desconto_pis::numeric, 0) + COALESCE(io.valor_desconto_cofins::numeric, 0)) as pis_cofins_rs,
        SUM(COALESCE(io.quantidade * io.custo_comercial, 0)) as custo_total
    FROM public.itens_orcamentos io WHERE EXISTS (SELECT 1 FROM orc WHERE orc.orcamento_id = io.orcamento_id)
    GROUP BY 1
  )
  SELECT
    SUM(CASE WHEN COALESCE(o.totalmente_devolvido,'N')='N' THEN COALESCE(o.valor_pedido,0)-COALESCE(o.valor_ipi,0)-COALESCE(o.valor_subst_trib,0)-COALESCE(o.valor_fcp_st,0)-COALESCE(o.valor_outras_desp_manual,0)-COALESCE(o.valor_frete_processado,0)-COALESCE(o.valor_frete_extra_manual,0)-COALESCE(i.icms_rs,0)-COALESCE(i.pis_cofins_rs,0) ELSE 0 END)::float AS base_sem_dev,
    SUM(CASE WHEN COALESCE(o.totalmente_devolvido,'N')='N' THEN COALESCE(i.custo_total, 0) ELSE 0 END)::float AS custo_nd,
    SUM(CASE WHEN COALESCE(o.totalmente_devolvido,'N')='N' THEN (COALESCE(o.valor_pedido,0)-COALESCE(o.valor_ipi,0)-COALESCE(o.valor_subst_trib,0)-COALESCE(o.valor_fcp_st,0)-COALESCE(o.valor_outras_desp_manual,0)-COALESCE(o.valor_frete_processado,0)-COALESCE(o.valor_frete_extra_manual,0)-COALESCE(i.icms_rs,0)-COALESCE(i.pis_cofins_rs,0)) * COALESCE(o.perc_lucro_fechamento, 0) / 100.0 ELSE 0 END)::float AS lucro_perc_fecha
  FROM orc o LEFT JOIN itens i ON i.orcamento_id = o.orcamento_id
        `;
        const res = await pool.query(sql, [empresaIds]);
        const r = res.rows[0];
        const base = Number(r.base_sem_dev);
        const custo = Number(r.custo_nd);
        const lucroA = base - custo;
        const lucroB = Number(r.lucro_perc_fecha);

        const lines = [
            "Base (sem devolver): " + base.toFixed(2),
            "Custo (nao devolvidos): " + custo.toFixed(2),
            "Formula A (Base - Custo): " + lucroA.toFixed(2) + " => " + (lucroA / base * 100).toFixed(3) + "%",
            "Formula B (perc_fechamento): " + lucroB.toFixed(2) + " => " + (lucroB / base * 100).toFixed(3) + "%",
            "Target: -0.79%"
        ];
        require('fs').writeFileSync('/tmp/profit_result.txt', lines.join('\n'));
        process.stdout.write(lines.join('\n') + '\n');
    } catch (e) { console.error(String(e)) }
    pool.end();
}
run();
