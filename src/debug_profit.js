const { Pool } = require('pg');
const pool = new Pool({ host: '172.16.0.32', port: 5432, database: 'migracao_oracle', user: 'radar_dev', password: '121279' });

async function run() {
    const dateIni = '2026-02-01';
    const dateFim = '2026-02-28';
    const empresaIds = ['1', '2', '3', '5', '6'];

    try {
        console.log("Analyzing Profitability components for February...");
        const sql = `
            WITH base_data AS (
                SELECT 
                    o.orcamento_id,
                    o.empresa_id,
                    o.valor_pedido,
                    o.valor_ipi,
                    o.valor_subst_trib,
                    o.valor_fcp_st,
                    o.valor_frete_processado,
                    o.valor_frete_extra_manual,
                    o.valor_outras_desp_manual,
                    (SELECT SUM(COALESCE(io.quantidade * io.icms_medio, 0)) FROM public.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id) as icms_rs,
                    (SELECT SUM(COALESCE(io.valor_desconto_pis::numeric, 0) + COALESCE(io.valor_desconto_cofins::numeric, 0)) FROM public.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id) as pis_cofins_rs,
                    (SELECT SUM(COALESCE(io.quantidade * io.custo_comercial, 0)) FROM public.itens_orcamentos io WHERE io.orcamento_id = o.orcamento_id) as custo_total,
                    (SELECT SUM(COALESCE(ird.quantidade * ird.preco_venda, 0)) FROM public.itens_requisicoes_devolucoes ird JOIN public.requisicoes_devolucoes rd ON rd.requisicao_id = ird.requisicao_id WHERE rd.orcamento_id = o.orcamento_id) as dev_val
                FROM public.orcamentos o
                WHERE o.data_recebimento >= $1::date AND o.data_recebimento <= $2::date
                  AND COALESCE(o.cancelado, 'N') = 'N'
                  AND COALESCE(o.recebido, 'S') = 'S'
                  AND o.empresa_id::text = ANY($3::text[])
            )
            SELECT 
                SUM(COALESCE(valor_pedido - valor_ipi - valor_subst_trib - valor_fcp_st - valor_frete_processado - valor_frete_extra_manual - valor_outras_desp_manual - icms_rs - pis_cofins_rs - COALESCE(dev_val, 0), 0)) as total_base_presenca,
                SUM(COALESCE(custo_total, 0)) as total_custo_comercial
            FROM base_data
        `;
        const res = await pool.query(sql, [dateIni, dateFim, empresaIds]);
        const r = res.rows[0];

        const base = Number(r.total_base_presenca);
        const custo = Number(r.total_custo_comercial);
        const lucro = base - custo;
        const pct = (lucro / base) * 100;

        console.log("Results:");
        console.log("- Base Lucro Presença:", base);
        console.log("- Custo Comercial:", custo);
        console.log("- Lucro (Base - Custo):", lucro);
        console.log("- % Profitability (Presente):", pct.toFixed(2) + "%");
        console.log("\nTarget: -0.79%");

    } catch (e) { console.error(e) }
    pool.end();
}
run();
