const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

const SQL_ORC = `
SELECT
  SUM(o.valor_pedido) AS total_valor_pedido,
  SUM(COALESCE(o.valor_outras_despesas, 0)) AS total_outras_despesas
FROM ADM.orcamentos o
WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
  AND o.data_recebimento IS NOT NULL
  AND COALESCE(o.cancelado, 'N') = 'N'
  AND o.empresa_id IN (1, 2, 3, 5, 6)
  AND (o.recebido = 'S' OR o.pedido_fechado = 'S')
`;

const SQL_DEV = `
SELECT
  SUM(n.valor_produtos) AS total_devolucoes
FROM ADM.notas_fiscais n
WHERE TRUNC(n.data_emissao) >= TRUNC(SYSDATE, 'MM')
  AND n.empresa_id IN (1, 2, 3, 5, 6)
  AND (n.devolucao_id IS NOT NULL OR n.cfop_id IN ('1.201', '1.202', '1.410', '1.411', '2.201', '2.202', '2.410', '2.411'))
`;

const f = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function main() {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    const rOrc = await conn.execute(SQL_ORC, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const rDev = await conn.execute(SQL_DEV, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const valPedido = Number(rOrc.rows[0].TOTAL_VALOR_PEDIDO || 0);
    const valOutras = Number(rOrc.rows[0].TOTAL_OUTRAS_DESPESAS || 0);
    const valDev = Number(rDev.rows[0].TOTAL_DEVOLUCOES || 0);

    const realizadoLiq = valPedido - valOutras - valDev;

    console.log("=========================================");
    console.log("     DEMONSTRATIVO: REALIZADO      ");
    console.log("=========================================");
    console.log(`(+) VALOR_PEDIDO total  :  ${f(valPedido).padStart(18)}`);
    console.log(`(-) OUTRAS_DESPESAS     : -${f(valOutras).padStart(18)}`);
    console.log(`(-) DEVOLUÇÕES          : -${f(valDev).padStart(18)}`);
    console.log("-----------------------------------------");
    console.log(`(=) REALIZADO LÍQUIDO   :  ${f(realizadoLiq).padStart(18)}`);
    console.log("=========================================\n");

  } catch (e) { console.error(e); } finally { if (conn) await conn.close(); }
}
main();
