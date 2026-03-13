const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

const f = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Ver os status disponíveis
const SQL_STATUS = `
SELECT status, COUNT(*) AS qtd
FROM ADM.requisicoes_devolucoes
WHERE TRUNC(data_devolucao) >= TRUNC(SYSDATE, 'MM')
  AND empresa_id IN (1, 2, 3, 5, 6)
GROUP BY status
ORDER BY qtd DESC
`;

// Total por empresa usando valor_devolucao e valor_produtos
const SQL_TOTAL = `
SELECT
  d.empresa_id,
  d.status,
  COUNT(*) AS qtd,
  SUM(d.valor_devolucao) AS val_devolucao,
  SUM(d.valor_produtos) AS val_produtos,
  MIN(d.data_devolucao) AS primeira,
  MAX(d.data_devolucao) AS ultima
FROM ADM.requisicoes_devolucoes d
WHERE TRUNC(d.data_devolucao) >= TRUNC(SYSDATE, 'MM')
  AND d.empresa_id IN (1, 2, 3, 5, 6)
GROUP BY d.empresa_id, d.status
ORDER BY d.empresa_id, d.status
`;

const SQL_ORC = `
SELECT
  SUM(o.valor_produtos) AS valor_produtos,
  SUM(o.valor_desconto) AS valor_desconto
FROM ADM.orcamentos o
WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
  AND o.data_recebimento IS NOT NULL
  AND COALESCE(o.cancelado, 'N') = 'N'
  AND o.empresa_id IN (1, 2, 3, 5, 6)
  AND (o.pedido_fechado = 'S' OR o.recebido = 'S')
`;

async function main() {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);

        // Status disponíveis
        console.log("=== STATUS DAS DEVOLUÇÕES DO MÊS ===");
        const rs = await conn.execute(SQL_STATUS, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        for (const r of rs.rows) console.log(`  Status='${r.STATUS}' -> ${r.QTD} registros`);

        // Totais por empresa + status
        console.log("\n=== TOTAIS POR EMPRESA E STATUS ===");
        const r2 = (await conn.execute(SQL_TOTAL, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })).rows;
        let totDev = 0, totProd = 0;
        console.log(`${"EMP".padEnd(5)} ${"ST".padEnd(4)} ${"Qtd".padStart(6)} ${"Val.Devolucao".padStart(18)} ${"Val.Produtos".padStart(18)}`);
        console.log("─".repeat(56));
        for (const r of r2) {
            console.log(`${String(r.EMPRESA_ID).padEnd(5)} ${(r.STATUS || "?").padEnd(4)} ${String(r.QTD).padStart(6)} ${f(r.VAL_DEVOLUCAO).padStart(18)} ${f(r.VAL_PRODUTOS).padStart(18)}`);
            // Acumula apenas os não-cancelados (excluindo STATUS='C')
            if (r.STATUS !== 'C') {
                totDev += Number(r.VAL_DEVOLUCAO || 0);
                totProd += Number(r.VAL_PRODUTOS || 0);
            }
        }
        console.log("─".repeat(56));
        console.log(`${"TOTAL(sem C)".padEnd(11)}${f(totDev).padStart(18)} ${f(totProd).padStart(18)}`);

        // Resultado final
        const ro = (await conn.execute(SQL_ORC, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })).rows[0];
        const vProd = Number(ro.VALOR_PRODUTOS);
        const vDesc = Number(ro.VALOR_DESCONTO);

        console.log("\n=== CÁLCULO FINAL COM REQUISICOES_DEVOLUCOES ===");
        console.log(`(+) valor_produtos (orcamentos) :  ${f(vProd)}`);
        console.log(`(-) valor_desconto              : -${f(vDesc)}`);
        console.log(`(-) devoluções (val_devolucao)  : -${f(totDev)}`);
        console.log(`────────────────────────────────────────────────`);
        console.log(`(=) REALIZADO LÍQUIDO           :  ${f(vProd - vDesc - totDev)}`);
        console.log("");
        console.log(`(-) devoluções (val_produtos)   : -${f(totProd)}`);
        console.log(`(=) REALIZADO LÍQUIDO (alt)     :  ${f(vProd - vDesc - totProd)}`);

    } catch (e) { console.error(e.message); } finally { if (conn) await conn.close(); }
}
main();
