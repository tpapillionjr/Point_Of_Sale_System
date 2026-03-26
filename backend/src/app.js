import express from "express";
import cors from "cors";
import itemsRoutes from "./routes/items.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import shiftsRoutes from "./routes/shifts.routes.js";
import tablesRoutes from "./routes/tables.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/items", itemsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/shifts", shiftsRoutes);
app.use("/api/tables", tablesRoutes);

export default app;
