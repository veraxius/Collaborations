require("dotenv").config();

const cors = require("cors");
const express = require("express");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Auth server running on port ${PORT}`);
});
