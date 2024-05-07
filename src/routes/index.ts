import { Router } from "express";
import userRoutes from "./user-routes";
import authRoutes from "./auth-routes";

const appRouter = Router();

appRouter.use("/users",userRoutes);
appRouter.use("/auth",authRoutes);

export default appRouter;