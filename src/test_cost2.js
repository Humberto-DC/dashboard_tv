const { Pool } = require('pg');
const pool = new Pool({ host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279' });

async function run() {
    try {
        const sql1 = `
            SELECT sum(quantidade * custo_comercial) FROM itens_orcamentos io 
            WHERE EXISTS (SELECT 1 FROM orcamentos o WHERE o.orcamento_id = io.orcamento_id AND data_recebimento >= '2026-02-01' AND data_recebimento <= '2026-02-28' AND COALESCE(cancelado, 'N') = 'N' AND COALESCE(recebido, 'S') = 'S' AND empresa_id::int IN (1,2,3,5,6))
        `;
        const res1 = await pool.query(sql1);
        console.log('Query 1 (Exists):', res1.rows[0]);

        const sql2 = `
            SELECT sum( (SELECT SUM(COALESCE(io.quantidade * io.custo_comercial, 0)) FROM public.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id) )
            FROM orcamentos o
            WHERE data_recebimento >= '2026-02-01' AND data_recebimento <= '2026-02-28' AND COALESCE(cancelado, 'N') = 'N' AND COALESCE(recebido, 'S') = 'S' AND empresa_id::int IN (1,2,3,5,6)
        `;
        const res2 = await pool.query(sql2);
        console.log('Query 2 (Subquery in select):', res2.rows[0]);
    } catch (e) { console.error(e) }
    pool.end();
}
run();
