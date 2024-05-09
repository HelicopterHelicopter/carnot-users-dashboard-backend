import { Router } from "express";
import { getAllUsersData, uploadProfilePic } from "../controllers/user-controllers";
import multer from 'multer';
import { verifyToken } from "../utils/token-manager";

const userRoutes = Router();
const storage = multer.memoryStorage();
const upload = multer({storage:storage});

userRoutes.get("/",getAllUsersData);
userRoutes.post("/upload",upload.single('profilePic'),verifyToken,uploadProfilePic);

export default userRoutes;