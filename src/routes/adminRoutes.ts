import { AdminController } from "@/controllers/adminController";
import { requireAuth } from "@/middleware/authMiddleware";
import { Router } from "express";

const adminRoutes = Router();

adminRoutes.post("/login", AdminController.login);
adminRoutes.get('/check-auth', AdminController.checkAuth);
adminRoutes.post("/logout", requireAuth, AdminController.logout);
adminRoutes.post("/change-password", AdminController.changePassword);

export default adminRoutes;
