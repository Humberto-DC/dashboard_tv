const { Pool } = require('pg');
const pool = new Pool({ host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279' });

async function run() {
    const dateIni = '2026-02-01';
    const dateFim = '2026-02-28';
    const empresaIds = ['1', '2', '3', '5', '6'];

    try {
        const sql = `
WITH
  orc_filt_f_cte AS (
    SELECT 
      o.orcamento_id,
      o.totalmente_devolvido
    FROM public.orcamentos o
    WHERE o.data_recebimento >= $1::date AND o.data_recebimento <= $2::date
      AND COALESCE(o.cancelado,'N') = 'N'
      AND COALESCE(o.recebido,'S') = 'S'
      AND o.empresa_id::text = ANY($3::text[])
  ),
  vendas_itens_f_cte AS (
    SELECT 
        io.orcamento_id,
        SUM(COALESCE(io.quantidade * io.custo_comercial, 0)) as custo_total
    FROM public.itens_orcamentos io
    WHERE EXISTS (SELECT 1 FROM orc_filt_f_cte ofc WHERE ofc.orcamento_id = io.orcamento_id)
    GROUP BY 1
  )
  SELECT 
    SUM(vi.custo_total) as full_cost,
    SUM(CASE WHEN COALESCE(o.totalmente_devolvido,'N') = 'N' THEN vi.custo_total ELSE 0 END) as non_devolved_cost
  FROM orc_filt_f_cte o
  LEFT JOIN vendas_itens_f_cte vi ON vi.orcamento_id = o.orcamento_id
        `;
        const res = await pool.query(sql, [dateIni, dateFim, empresaIds]);
        console.log("Cost check:", res.rows[0]);
    } catch (e) { console.error(e) }
    pool.end();
}
run();
