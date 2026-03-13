const { Pool } = require('pg');
const pool = new Pool({ host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279' });

async function run() {
    try {
        const sql1 = `
            SELECT sum( (SELECT SUM(COALESCE(io.quantidade * io.custo_comercial, 0)) FROM public.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id) ) as total_custo
            FROM orcamentos o
            WHERE o.data_recebimento >= '2026-02-01' AND o.data_recebimento <= '2026-02-28' AND COALESCE(o.cancelado, 'N') = 'N' AND COALESCE(o.recebido, 'S') = 'S' AND o.empresa_id::text = ANY(ARRAY['1','2','3','5','6']::text[])
        `;
        const res1 = await pool.query(sql1);
        console.log('Query 1 Cost:', res1.rows[0]);
    } catch (e) { console.error(e) }
    pool.end();
}
run();
