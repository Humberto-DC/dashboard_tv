import { Pool } from 'pg';

const pgPool = new Pool({
    host: process.env.PG_HOST || '172.16.0.32',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: process.env.PG_DB || 'migracao_oracle',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASS || 'senha123',
});

export default {
    async query(sql: string, params: any[] = []) {
        const res = await pgPool.query(sql, params);
        return { rows: res.rows };
    }
};
