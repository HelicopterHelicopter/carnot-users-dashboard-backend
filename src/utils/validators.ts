import { NextFunction, Request, Response } from 'express';
import {body,ValidationChain, validationResult} from  'express-validator';

export const validate = (validations:ValidationChain[]) => {
    return async (req:Request,res:Response,next:NextFunction) => {
        for(let validation of validations){
            const result = await validation.run(req);
            if(!result.isEmpty()){
                break;
            }
        }

        const errors = validationResult(req);

        if(errors.isEmpty()){
            return next();
        }

        res.status(422).json({message:"ERROR",errors:errors.array()});
    }
}

export const loginValidator = [
    body("userName").trim().notEmpty().withMessage("Username is required"),
    body("password").trim().isLength({min:6}).withMessage("Password should contain atleast 6 characters")
];

export const signupValidator = [
    body("email").trim().isEmail().withMessage("Email is required"),
    ...loginValidator
];

