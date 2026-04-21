import "server-only";


import postgres from 'postgres'

const sql= postgres('postgres://postgres:S@vin4451@62.60.212.187:5432/lsevin',{
     debug(connection, query, params, types) {
    console.log("-----------------------------SQL:-----------------------------");
    console.log("SQL:", query);
    console.log("Params:", params);
    console.log("-----------------------------END:-----------------------------");
  },
    host:'62.60.212.187',
    port:5432,
    database:'lsevin',
    username:'postgres',
    password:'S@vin4451',
})


export default sql;