import { Router } from "express";
import { getAllUsersData } from "../controllers/user-controllers";

const userRoutes = Router();

userRoutes.get("/",getAllUsersData);

export default userRoutes;