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

export const signupValidator = [
    body("userName").trim().notEmpty().withMessage("Username is required"),
    body("password").trim().notEmpty().withMessage("Password is required")
];