import oracledb from "oracledb";

// O modo thin é o padrão no oracledb 6.x+
const dbConfig = {
    user: process.env.ADM_DB_USER ?? "CONSULTA",
    password: process.env.ADM_DB_PASS ?? "DADOS",
    connectString: `${process.env.ADM_DB_HOST ?? "172.16.0.8"}:${process.env.ADM_DB_PORT ?? "1521"}/${process.env.ADM_DB_NAME ?? "santripdb"}`,
};

declare global {
    // eslint-disable-next-line no-var
    var _oraclePool: oracledb.Pool | undefined;
}

async function getPool() {
    if (global._oraclePool) return global._oraclePool;

    const pool = await oracledb.createPool(dbConfig);

    if (process.env.NODE_ENV !== "production") {
        global._oraclePool = pool;
    }
    return pool;
}

export default {
    async query(sql: string, params: any[] = []) {
        const pool = await getPool();
        const connection = await pool.getConnection();
        try {
            // Converte parâmetros estilo $1 para :1 (Oracle)
            const oracleSql = sql.replace(/\$(\d+)/g, ":$1");

            const result = await connection.execute(oracleSql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });

            // Normalizar chaves para minúsculo (Oracle retorna MAIÚSCULO por padrão)
            const rows = (result.rows || []).map((row: any) => {
                const normalizedRow: any = {};
                for (const key in row) {
                    normalizedRow[key.toLowerCase()] = row[key];
                }
                return normalizedRow;
            });

            return { rows };
        } finally {
            await connection.close();
        }
    }
};
