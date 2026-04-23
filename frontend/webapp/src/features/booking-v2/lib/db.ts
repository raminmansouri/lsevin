import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for booking-v2 standalone module.");
}

export const sql = postgres(connectionString, {
   debug(connection, query, params, types) {
    console.log("-----------------------------SQL:-----------------------------");
    console.log("SQL:", query);
    console.log("Params:", params);
    console.log("-----------------------------END:-----------------------------");
  },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
  prepare: false,
});
