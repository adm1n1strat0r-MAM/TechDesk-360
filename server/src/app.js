import express from "express";
import cors from "cors";


import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import roleRoutes from "./routes/role.routes.js";
import labCaseRoutes from "./routes/labCase.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: '5mb' }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TechDesk 360 API is running",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/lab-cases", labCaseRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/inventory", inventoryRoutes);

// Error middleware must be last
app.use(errorHandler);

export default app;
