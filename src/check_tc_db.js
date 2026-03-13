const { Client } = require('pg');
async function run() {
    const client = new Client({
        host: '172.16.0.32',
        port: 5432,
        database: 'migracao_oracle',
        user: 'radar_dev',
        password: '121279'
    });
    try {
        await client.connect();
        const res = await client.query("SELECT table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%tc%' AND table_schema = 'public' LIMIT 20");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
