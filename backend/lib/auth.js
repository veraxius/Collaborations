import jwt from "jsonwebtoken";

export function signToken(company) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign(
    { companyId: company.id, email: company.email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.companyId = payload.companyId;
    req.email = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
