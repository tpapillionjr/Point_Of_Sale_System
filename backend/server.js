//main server code
import express from "express"
import cors from "cors"
import items from './src/routes/items.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/v1/items",items)
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

export default app


//add a get api for the library for all the data. 
//post for for server-order.js to checkout/index.js
 