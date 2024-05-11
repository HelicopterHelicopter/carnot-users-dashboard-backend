import { Router } from "express";
import { getAllUsersData, getUserProfileDetails, updateProfile, uploadProfilePic } from "../controllers/user-controllers";
import multer from 'multer';
import { verifyToken } from "../utils/token-manager";
import { signOut } from "../controllers/auth-controller";

const userRoutes = Router();
const storage = multer.memoryStorage();
const upload = multer({storage:storage});

userRoutes.get("/",verifyToken,getAllUsersData);
userRoutes.post("/upload",upload.single('profilePic'),verifyToken,uploadProfilePic);
userRoutes.get("/profile",verifyToken,getUserProfileDetails);
userRoutes.put("/profile",verifyToken,updateProfile);


export default userRoutes;