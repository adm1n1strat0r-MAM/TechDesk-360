import express from "express";

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "../controllers/user.controller.js";

import { validateUser } from "../middleware/validateUser.middleware.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { requireAnyPermission } from "../middleware/authorize.middleware.js";

const router = express.Router();

// Create user
router.use(authenticate);

router.post("/", requireAnyPermission(["id-new-user"]), validateUser, createUser);

// Get all users
router.get("/", requireAnyPermission(["id-users-details"]), getUsers);

// Get user by ID
router.get("/:id", requireAnyPermission(["id-users-details"]), getUserById);

// Update user
router.put("/:id", requireAnyPermission(["id-users-details"]), validateUser, updateUser);

// Delete user
router.delete("/:id", requireAnyPermission(["id-users-details"]), deleteUser);
router.post("/:id/reset-password", requireAnyPermission(["id-role-management"]), resetUserPassword);

export default router;
