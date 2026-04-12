import express from "express";
import cors from "cors";
import backOfficeRoutes from "./routes/back-office.routes.js";
import itemsRoutes from "./routes/items.routes.js";
import kitchenRoutes from "./routes/kitchen.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import shiftsRoutes from "./routes/shifts.routes.js";
import tablesRoutes from "./routes/tables.routes.js";
import usersRoutes from "./routes/users.routes.js";
import customerRoutes from "./routes/customer.routes.js";

const app = express();

// Middleware to capture client IP address properly
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "POS backend is running.",
    health: "/health",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/back-office", backOfficeRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/shifts", shiftsRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/customer", customerRoutes);

export default app;
