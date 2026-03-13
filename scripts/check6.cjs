const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

const SQL = `
SELECT
  SUM(o.valor_produtos) AS valor_produtos,
  SUM(o.valor_produtos - o.valor_desconto) AS prod_liq,
  SUM(o.valor_pedido) AS valor_pedido,
  SUM(COALESCE(o.valor_outras_despesas, 0)) AS outras_despesas,
  SUM(o.valor_desconto) AS descontos
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
        const r = (await conn.execute(SQL, [], { outFormat: oracledb.OUT_FORMAT_OBJECT })).rows[0];

        console.log(`SUM(valor_produtos): ${f(r.VALOR_PRODUTOS)}`);
        console.log(`SUM(valor_produtos - valor_desconto): ${f(r.PROD_LIQ)}`);
        console.log(`SUM(valor_desconto): ${f(r.DESCONTOS)}`);

    } catch (e) { console.error(e); } finally { if (conn) await conn.close(); }
}
main();
