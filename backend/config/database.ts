import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "ethiobankers",
  password: "ethiobankersnetwork",
  database: "ethiobankers",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = {
  query: pool.execute.bind(pool),
  // Wrapper for convenience: query(sql, params?) => Promise<[rows, fields]>
};

console.log(
  "[MYSQL] Database pool initialized for ethiobankers@localhost:3306",
);
