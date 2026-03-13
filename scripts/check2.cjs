// Comparação Santri vs Dashboard, filtrando apenas Recebidos ou (Recebido OR Fechado)
const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

// Valores alvo enviados pelo usuário (13:22)
const TARGETS = {
    1: 540583.34,
    2: 347018.82,
    3: 231232.00,
    5: 581916.61,
    6: 230389.44,
};
const TARGET_TOTAL = 1931140.21;

// Considerar valor produtos - desconto
const SQL = `
SELECT
  o.empresa_id,
  SUM(o.valor_produtos - o.valor_desconto) AS s_prod_liq_fechado,
  COUNT(*) as qtd_fechado
FROM ADM.orcamentos o
WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
  AND o.data_recebimento IS NOT NULL
  AND COALESCE(o.cancelado, 'N') = 'N'
  AND o.empresa_id IN (1, 2, 3, 5, 6)
  AND (o.pedido_fechado = 'S' OR o.recebido = 'S')
GROUP BY o.empresa_id
`;

const SQL_REC = `
SELECT
  o.empresa_id,
  SUM(o.valor_produtos - o.valor_desconto) AS s_prod_liq_rec,
  COUNT(*) as qtd_rec
FROM ADM.orcamentos o
WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
  AND o.data_recebimento IS NOT NULL
  AND COALESCE(o.cancelado, 'N') = 'N'
  AND o.empresa_id IN (1, 2, 3, 5, 6)
  AND o.recebido = 'S'
GROUP BY o.empresa_id
`;

const f = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function main() {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const rFechado = await conn.execute(SQL, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rRec = await conn.execute(SQL_REC, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        const dataF = {};
        for (const row of rFechado.rows) {
            dataF[row.EMPRESA_ID] = row;
        }
        const dataR = {};
        for (const row of rRec.rows) {
            dataR[row.EMPRESA_ID] = row;
        }

        console.log("=== COMPARAÇÃO DE VALORES (SANTRI vs BANCO) ===");
        console.log(`${"EMP".padEnd(4)} ${"Santri (Alvo)".padStart(20)} | ${"Nosso (FECH OR REC)".padStart(20)} ${"Diff".padStart(12)} | ${"Nosso (SÓ REC)".padStart(20)} ${"Diff".padStart(12)}`);
        console.log("-".repeat(95));

        let sumF = 0, sumR = 0;
        for (const eid of [1, 2, 3, 5, 6]) {
            const tgt = TARGETS[eid];
            const valF = dataF[eid]?.S_PROD_LIQ_FECHADO || 0;
            const valR = dataR[eid]?.S_PROD_LIQ_REC || 0;

            const diffF = valF - tgt;
            const diffR = valR - tgt;

            sumF += valF;
            sumR += valR;

            console.log(`${String(eid).padEnd(4)} ${f(tgt).padStart(20)} | ${f(valF).padStart(20)} ${f(diffF).padStart(12)} | ${f(valR).padStart(20)} ${f(diffR).padStart(12)}`);
        }
        console.log("-".repeat(95));
        console.log(`${"TOT".padEnd(4)} ${f(TARGET_TOTAL).padStart(20)} | ${f(sumF).padStart(20)} ${f(sumF - TARGET_TOTAL).padStart(12)} | ${f(sumR).padStart(20)} ${f(sumR - TARGET_TOTAL).padStart(12)}`);

    } catch (e) { console.error(e); } finally { if (conn) await conn.close(); }
}
main();
