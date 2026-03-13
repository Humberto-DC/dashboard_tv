const { Pool } = require('pg');
const pool = new Pool({ host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279' });

async function run() {
    try {
        // 1. Verificar colunas de custo em orcamentos
        const sql1 = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orcamentos' AND (column_name ILIKE '%custo%' OR column_name ILIKE '%valor_c%') ORDER BY 1`;
        const res1 = await pool.query(sql1);
        const orc_cols = res1.rows.map(r => r.column_name);

        // 2. Verificar colunas de custo em itens_orcamentos
        const sql2 = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'itens_orcamentos' AND (column_name ILIKE '%custo%' OR column_name ILIKE '%preco_custo%') ORDER BY 1`;
        const res2 = await pool.query(sql2);
        const itens_cols = res2.rows.map(r => r.column_name);

        const lines = [
            'ORCAMENTOS cost cols: ' + JSON.stringify(orc_cols),
            'ITENS_ORCAMENTOS cost cols: ' + JSON.stringify(itens_cols)
        ];

        // 3. Testar colunas de custo em itens_orcamentos para o período
        const testCols = ['custo_comercial', 'custo_total', 'preco_custo', 'custo_med_ponderado'];
        for (const col of itens_cols) {
            try {
                const sqlT = `SELECT SUM(COALESCE(io.${col}::numeric, 0) * COALESCE(io.quantidade, 1))::float as tot_x_qtd, SUM(COALESCE(io.${col}::numeric, 0))::float as tot_sem_qtd FROM public.itens_orcamentos io WHERE EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.orcamento_id = io.orcamento_id AND o.data_recebimento >= '2026-02-01' AND o.data_recebimento <= '2026-02-28' AND COALESCE(o.cancelado,'N')='N' AND COALESCE(o.recebido,'S')='S' AND o.empresa_id::int IN (1,2,3,5,6))`;
                const resT = await pool.query(sqlT);
                lines.push(`\nCol ${col}: x_qtd=${Number(resT.rows[0].tot_x_qtd).toFixed(2)}, sem_qtd=${Number(resT.rows[0].tot_sem_qtd).toFixed(2)}`);
            } catch (e) {
                lines.push(`\nCol ${col}: ERROR - ${e.message.substring(0, 80)}`);
            }
        }

        // 4. Verificar se há valor_custo em orcamentos
        for (const col of orc_cols) {
            try {
                const sqlO = `SELECT SUM(COALESCE(${col}::numeric, 0))::float as total FROM public.orcamentos WHERE data_recebimento >= '2026-02-01' AND data_recebimento <= '2026-02-28' AND COALESCE(cancelado,'N')='N' AND COALESCE(recebido,'S')='S' AND empresa_id::int IN (1,2,3,5,6)`;
                const resO = await pool.query(sqlO);
                lines.push(`\nORC col ${col}: SUM=${Number(resO.rows[0].total).toFixed(2)}`);
            } catch (e) {
                lines.push(`\nORC col ${col}: ERROR - ${e.message.substring(0, 80)}`);
            }
        }

        lines.push('\n\nTarget Vlr.custo Santri: 6306352.75');
        require('fs').writeFileSync('C:/tmp/custo_result.txt', lines.join(''));
        process.stdout.write(lines.join('') + '\n');
    } catch (e) { console.error(String(e)) }
    pool.end();
}
run();
