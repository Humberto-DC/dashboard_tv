const oracledb = require("oracledb");
const dbConfig = { user: "CONSULTA", password: "DADOS", connectString: "172.16.0.8:1521/santripdb" };

const f = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

const SQL_DEV = `
SELECT
  SUM(n.valor_produtos) AS valor_devolucoes
FROM ADM.notas_fiscais n
WHERE TRUNC(n.data_emissao) >= TRUNC(SYSDATE, 'MM')
  AND n.empresa_id IN (1, 2, 3, 5, 6)
  AND (n.devolucao_id IS NOT NULL OR n.cfop_id IN ('1.201', '1.202', '1.410', '1.411', '2.201', '2.202', '2.410', '2.411'))
`;

async function main() {
    let conn;
    try {
        conn = await oracledb.getConnection(dbConfig);
        const rOrc = await conn.execute(SQL_ORC, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rDev = await conn.execute(SQL_DEV, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        const vProd = Number(rOrc.rows[0].VALOR_PRODUTOS || 0);
        const vDesc = Number(rOrc.rows[0].VALOR_DESCONTO || 0);
        const vDev = Number(rDev.rows[0].VALOR_DEVOLUCOES || 0);

        const resultado = vProd - vDesc - vDev;

        console.log("=== CÁLCULO EXATO SOLICITADO ===");
        console.log(`(+) valor_produtos     :  ${f(vProd).padStart(18)}`);
        console.log(`(-) valor_desconto     : -${f(vDesc).padStart(18)}`);
        console.log(`(-) devoluções         : -${f(vDev).padStart(18)}`);
        console.log("-----------------------------------------");
        console.log(`(=) REALIZADO LÍQUIDO  :  ${f(resultado).padStart(18)}`);
        console.log("=========================================\n");

    } catch (e) { console.error(e); } finally { if (conn) await conn.close(); }
}
main();
