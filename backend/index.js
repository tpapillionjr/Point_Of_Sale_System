//main database code
import app from "./server.js"
import mysql from "mysql2"
import fs from 'fs';
//import dao from "./dao/itemsDAO" //data access object
var connection = mysql.createConnection(
  {host:"group4-pos-mysql.mysql.database.azure.com",
   user:"posadmin",
   password:"gikGyb-mafnog-8tocfu",
   database:"restaurant_pos",
   port:3306,
   ssl:{ca:fs.readFileSync("./SSL.crt.pem")
    }
  }
)
connection.connect((err) => {
  if (err) {
    return console.error("Database connection failed: " + err.message);
  }
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
