import { Router } from "express";
import { login, signup } from "../controllers/auth-controller";
import { validate, signupValidator } from "../utils/validators";

const authRoutes = Router();

authRoutes.post("/signup",validate(signupValidator),signup);
authRoutes.post("/login",validate(signupValidator),login);

export default authRoutes;