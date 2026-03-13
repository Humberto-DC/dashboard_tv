// Encontrar a diferença exata (Devoluções e notas)
const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

const f = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SQL = `
SELECT
  n.empresa_id,
  SUM(n.valor_produtos) AS valor_dev
FROM ADM.notas_fiscais n
WHERE TRUNC(n.data_emissao) >= TRUNC(SYSDATE, 'MM')
  AND n.empresa_id IN (1, 2, 3, 5, 6)
  AND (n.devolucao_id IS NOT NULL OR n.cfop_id IN ('1.201', '1.202', '1.410', '1.411', '2.201', '2.202', '2.410', '2.411'))
GROUP BY n.empresa_id
ORDER BY n.empresa_id
`;

async function main() {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const r = await conn.execute(SQL, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        console.log("=== DEVOLUÇÕES NO MÊS POR EMPRESA ===");
        let totDev = 0;
        for (const row of r.rows) {
            totDev += Number(row.VALOR_DEV);
            console.log(`Empresa: ${row.EMPRESA_ID} | Devolução: ${f(row.VALOR_DEV)}`);
        }
        console.log(`TOTAL DAS DEVOLUÇÕES: ${f(totDev)}`);

        console.log("\nComparando a diferença (Nosso Realizado - Seu Santri):");
        console.log(`Emp 1 (DC-TO):     Nosso tem 2.185,00 a mais.   Devolução: ${f(r.rows.find(x => x.EMPRESA_ID == 1)?.VALOR_DEV)}`);
        console.log(`Emp 2 (DC-DF-CSG): Nosso tem 2.188,75 a mais.   Devolução: ${f(r.rows.find(x => x.EMPRESA_ID == 2)?.VALOR_DEV)}`);
        console.log(`Emp 3 (DC-GO):     Nosso tem 0,00 a mais.       Devolução: ${f(r.rows.find(x => x.EMPRESA_ID == 3)?.VALOR_DEV)}`);
        console.log(`Emp 5 (DC-MA-IMP): Nosso tem 2.595,70 a mais.   Devolução: ${f(r.rows.find(x => x.EMPRESA_ID == 5)?.VALOR_DEV)}`);
        console.log(`Emp 6 (DC-MA-SLZ): Nosso tem 10.954,70 a mais.  Devolução: ${f(r.rows.find(x => x.EMPRESA_ID == 6)?.VALOR_DEV)}`);

    } catch (e) { console.error(e); } finally { if (conn) await conn.close(); }
}
main();
