const { Pool } = require('pg');
const pool = new Pool({ host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279' });

async function run() {
    const dateIni = '2026-02-01';
    const dateFim = '2026-02-28';
    const empresaIds = ['1', '2', '3', '5', '6'];

    try {
        console.log("Detailed investigation for target 6.397.513,79...");
        const sql = `
            WITH sales AS (
                SELECT 
                    empresa_id::text,
                    SUM(COALESCE(valor_pedido, 0)) as bruto,
                    SUM(COALESCE(valor_frete_processado, 0) + COALESCE(valor_frete_extra_manual, 0)) as frete,
                    SUM(COALESCE(valor_outras_desp_manual, 0)) as desp
                FROM orcamentos
                WHERE data_recebimento >= $1::date AND data_recebimento <= $2::date
                  AND COALESCE(cancelado, 'N') = 'N'
                  AND COALESCE(recebido, 'S') = 'S'
                  AND empresa_id::text = ANY($3::text[])
                GROUP BY 1
            ),
            dev AS (
                SELECT 
                    rd.empresa_id::text,
                    SUM(COALESCE(ird.quantidade * ird.preco_venda, 0)) as total_dev
                FROM itens_requisicoes_devolucoes ird
                JOIN requisicoes_devolucoes rd ON rd.requisicao_id = ird.requisicao_id
                WHERE ird.data_hora_alteracao >= $1::date AND ird.data_hora_alteracao <= $2::date
                  AND rd.empresa_id::text = ANY($3::text[])
                GROUP BY 1
            )
            SELECT 
                s.empresa_id,
                s.bruto,
                s.frete,
                s.desp,
                COALESCE(d.total_dev, 0) as dev,
                (s.bruto - COALESCE(d.total_dev, 0)) as liq,
                (s.bruto - COALESCE(d.total_dev, 0) - s.frete) as test_realized
            FROM sales s
            LEFT JOIN dev d ON d.empresa_id = s.empresa_id
            ORDER BY s.empresa_id
        `;
        const res = await pool.query(sql, [dateIni, dateFim, empresaIds]);
        console.table(res.rows);

        const totalRealized = res.rows.reduce((acc, r) => acc + Number(r.test_realized), 0);
        console.log("TOTAL REALIZADO (Liq - Frete):", totalRealized);
        console.log("TARGET:", 6397513.79);
        console.log("DIFF:", totalRealized - 6397513.79);

    } catch (e) { console.error(e) }
    pool.end();
}
run();
