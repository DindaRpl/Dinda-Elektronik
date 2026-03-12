const { Pool } = require("pg");

const pool = new Pool ({
    user: "postgres",
    host: "localhost",
    database: "toko_online_dinda",
    password: "postgres",
    port: 5432,
});

module.exports = pool;