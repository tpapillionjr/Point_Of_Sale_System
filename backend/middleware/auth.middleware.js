import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireManager(req, res, next) {
  if (req.user?.role !== "manager") {
    return res.status(403).json({ error: "Manager access required" });
  }

  next();
}

export function requireKitchenOrManager(req, res, next) {
  if (!["kitchen", "manager"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Kitchen or manager access required" });
  }

  next();
}

export function requireCustomerAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Customer login required." });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.customerId) {
      return res.status(401).json({ error: "Invalid customer token." });
    }
    req.customer = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired customer token." });
  }
}
