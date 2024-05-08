import { Request,Response,NextFunction } from "express";
import {hash,compare} from 'bcrypt';
import { pool } from "../db/connect";
import User from "../models/User";
import { COOKIE_NAME } from "../utils/constants";
import { createToken } from "../utils/token-manager";
import { ResultSetHeader } from "mysql2";

export const login = async (req:Request,res:Response,next:NextFunction) => {

    try{

        const {userName,password} = req.body;

        const checkIfUserExistQuery = 'SELECT * FROM Users WHERE UserName=? AND IsActive=1';
        const [users] = await pool.query<User[]>(checkIfUserExistQuery,[userName]);
        if(!users.length){
            return res.status(401).json({message:"User not registered"});
        }

        const user = users[0];

        const isPasswordCorrect = await compare(password,user.Password);

        if(!isPasswordCorrect){
            return res.status(403).json({message:"Incorrect password"});
        }

        res.clearCookie(COOKIE_NAME,{
            httpOnly:true,
            signed:true,
            domain:"localhost",
            path:"/"
        });

        const token = createToken(user.Id,"7d");
        const expires = new Date();
        expires.setDate(expires.getDate()+7);

        res.cookie(COOKIE_NAME,token,{
            path:"/",
            domain:"localhost",
            expires,
            httpOnly:true,
            signed:true
        });

        return res.status(200).json({message:"OK",username:user.UserName});
    }catch(e){
        console.log(e);
        return res.status(200).json({message:"ERROR",cause:e.message});
    }

}

export const signup = async (req:Request, res:Response, next:NextFunction) => {
    try{
        const {userName,email,password} = req.body;   

        if(!await checkExistingUser(userName)){
            return res.status(401).json({message:"User already exists with the given Username."});
        }

        const hashedPassword = await hash(password,10);

        const sql = 'INSERT INTO Users (UserName,Password,Email,IsActive,CreatedBy,CreatedAt) VALUES (?,?,?,?,?,NOW())';
        const [results] = await pool.query<ResultSetHeader>(sql,[userName,hashedPassword,email,1,userName]);

        const userId = results.insertId;

        res.clearCookie(COOKIE_NAME,{
            httpOnly:true,
            signed:true,
            domain:"localhost",
            path:"/"
        });

        const token = createToken(userId,"7d");
        const expires = new Date();
        expires.setDate(expires.getDate()+7);

        res.cookie(COOKIE_NAME,token,{
            path:"/",
            httpOnly:true,
            signed:true,
            domain:"localhost",
            expires
        });


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