import { Router } from "express";
import { google, login, signOut, signup } from "../controllers/auth-controller";
import { validate, signupValidator, loginValidator } from "../utils/validators";
import { verifyToken } from "../utils/token-manager";

const authRoutes = Router();

authRoutes.post("/signup",validate(signupValidator),signup);
authRoutes.post("/login",validate(loginValidator),login);
authRoutes.get("/logout",verifyToken,signOut);
authRoutes.post("/google",google);

export default authRoutes;