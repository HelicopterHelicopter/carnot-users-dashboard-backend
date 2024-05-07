import { Request,Response,NextFunction } from "express";
import {hash,compare} from 'bcrypt';
import { pool } from "../db/connect";
import User from "../models/User";

export const login = async (req:Request,res:Response,next:NextFunction) => {

}

export const signup = async (req:Request, res:Response, next:NextFunction) => {
    try{
        const {userName,password} = req.body;   

        if(!await checkExistingUser(userName)){
            return res.status(401).json({message:"User already exists with the given Username."});
        }

        const hashedPassword = await hash(password,10);

        const sql = 'INSERT INTO Users (UserName,Password,IsActive,CreatedBy,CreatedAt) VALUES (?,?,?,?,NOW())';
        await pool.query(sql,[userName,hashedPassword,1,userName]);

        return res.status(201).json({message:"User Created Successfully"});
    }catch(e){
        return res.status(200).json({message:"ERROR",cause:e.message});
    }
}

export const checkExistingUser = async (userName:string) => {
    try{
        const sql = 'SELECT * FROM Users WHERE UserName=? AND IsActive=1';
        const [users] = await pool.query<User[]>(sql,[userName]);
        if(!users.length){
            return true;
        }else{
            return false;
        }
    }catch(e){
        return false;
    }
}