import { Router } from "express";
import { login, signup } from "../controllers/auth-controller";
import { validate, signupValidator, loginValidator } from "../utils/validators";

const authRoutes = Router();

authRoutes.post("/signup",validate(signupValidator),signup);
authRoutes.post("/login",validate(loginValidator),login);

export default authRoutes;