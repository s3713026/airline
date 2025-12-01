import { ConfigController } from "@/controllers/configController";
import { requireAuth } from "@/middleware/authMiddleware";
import { Router } from "express";

const configRoutes = Router();


// Chỉ admin mới có quyền xem và cập nhật cấu hình
configRoutes.get("/", requireAuth, ConfigController.getConfigs);
configRoutes.put("/", requireAuth, ConfigController.updateConfigs);
configRoutes.get("/bank",  ConfigController.getBankConfig);

export default configRoutes;