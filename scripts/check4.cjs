const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

const SQL = `
SELECT
  SUM(o.valor_pedido) AS total_valor_pedido,
  SUM(o.valor_pedido - COALESCE(o.valor_outras_despesas, 0)) AS total_sem_outras_despesas,
  SUM(COALESCE(o.valor_outras_despesas, 0)) AS total_outras_despesas
FROM ADM.orcamentos o
WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
  AND o.data_recebimento IS NOT NULL
  AND COALESCE(o.cancelado, 'N') = 'N'
  AND o.empresa_id IN (1, 2, 3, 5, 6)
  AND (o.recebido = 'S' OR o.pedido_fechado = 'S')
`;

const f = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function main() {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const result = await conn.execute(SQL, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const r = result.rows[0];

        console.log("=== TOTAIS ATUAIS NO BANCO DE DADOS ===");
        console.log(`Soma de VALOR_PEDIDO (bruto)               : ${f(r.TOTAL_VALOR_PEDIDO)}`);
        console.log(`Soma de VALOR_OUTRAS_DESPESAS              : ${f(r.TOTAL_OUTRAS_DESPESAS)}`);
        console.log(`VALOR_PEDIDO - OUTRAS_DESPESAS (dashboard) : ${f(r.TOTAL_SEM_OUTRAS_DESPESAS)}`);

    } catch (e) { console.error(e); } finally { if (conn) await conn.close(); }
}
main();
