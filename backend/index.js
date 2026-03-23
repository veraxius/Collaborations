import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "./lib/prisma.js";

const app = express();
const PORT = process.env.PORT || 3001;
const authRouter = express.Router();

app.use(express.json());
app.use(cors());

app.get("/", (_req, res) => {
  res.status(200).send("Backend funcionando");
});

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son requeridos" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed },
      select: { id: true, email: true, createdAt: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son requeridos" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET no configurado" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
