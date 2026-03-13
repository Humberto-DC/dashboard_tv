// Diagnóstico atualizado: Verifica os totais de pedidos agora (13:11)
const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

const SQL = `
SELECT
  COUNT(*)                                                    AS qtd_pedidos,
  SUM(o.valor_pedido)                                         AS total_valor_pedido,
  SUM(COALESCE(o.valor_outras_despesas, 0))                   AS total_outras_despesas,
  SUM(o.valor_pedido - COALESCE(o.valor_outras_despesas, 0))  AS total_pedido_liq_outras_desp,
  SUM(o.valor_produtos - o.valor_desconto)                    AS total_produtos_liq
FROM ADM.orcamentos o
WHERE TRUNC(o.data_recebimento) >= TRUNC(SYSDATE, 'MM')
  AND o.data_recebimento IS NOT NULL
  AND COALESCE(o.cancelado, 'N') = 'N'
  AND o.empresa_id IN (1, 2, 3, 5, 6)
  AND (o.pedido_fechado = 'S' OR o.recebido = 'S')
`;

const f = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function main() {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(SQL, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const r = result.rows[0];

    console.log("\n====== TOTAIS ATUAIS (AGORA) ======");
    console.log(`Qtd. Pedidos           : ${r.QTD_PEDIDOS}`);
    console.log(`Valor Pedido (Total)   : ${f(r.TOTAL_VALOR_PEDIDO)}`);
    console.log(`(-) Outras Despesas    : ${f(r.TOTAL_OUTRAS_DESPESAS)}`);
    console.log(`= Pedido Liq Out.Desp  : ${f(r.TOTAL_PEDIDO_LIQ_OUTRAS_DESP)}`);
    console.log(`-----------------------------------`);
    console.log(`Prod Liq Desconto      : ${f(r.TOTAL_PRODUTOS_LIQ)}`);
    console.log("===================================\n");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    if (conn) await conn.close();
  }
}

main();
