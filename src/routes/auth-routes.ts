import { Router } from "express";
import { signup } from "../controllers/auth-controller";
import { validate, signupValidator } from "../utils/validators";

const authRoutes = Router();

authRoutes.post("/signup",validate(signupValidator),signup);

export default authRoutes;