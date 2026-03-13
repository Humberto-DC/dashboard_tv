const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

const SQL = `
SELECT
  o.empresa_id,
  SUM(o.valor_produtos) AS valor_produtos_bruto,
  SUM(o.valor_produtos - o.valor_desconto) AS valor_produtos_liquido,
  SUM(o.valor_pedido) AS valor_pedido,
  SUM(o.valor_pedido - COALESCE(o.valor_outras_despesas, 0)) AS valor_pedido_sem_outras
FROM ADM.orcamentos o
WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
  AND o.data_recebimento IS NOT NULL
  AND COALESCE(o.cancelado, 'N') = 'N'
  AND o.empresa_id IN (1, 2, 3, 5, 6)
  AND (o.recebido = 'S' OR o.pedido_fechado = 'S')
GROUP BY o.empresa_id
ORDER BY o.empresa_id
`;

const SQL_REC = `
SELECT
  o.empresa_id,
  SUM(o.valor_produtos) AS valor_produtos_bruto
FROM ADM.orcamentos o
WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
  AND o.data_recebimento IS NOT NULL
  AND COALESCE(o.cancelado, 'N') = 'N'
  AND o.empresa_id IN (1, 2, 3, 5, 6)
  AND o.recebido = 'S'
GROUP BY o.empresa_id
ORDER BY o.empresa_id
`;

async function main() {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    console.log("=== Apenas RECEBIDO = 'S' ===");
    const r1 = await conn.execute(SQL_REC, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.table(r1.rows);

    console.log("=== RECEBIDO = 'S' OR PEDIDO_FECHADO = 'S' ===");
    const r2 = await conn.execute(SQL, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.table(r2.rows);
  } catch (e) { console.error(e); } finally { if (conn) await conn.close(); }
}
main();
