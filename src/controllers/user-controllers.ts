import { Request,Response,NextFunction } from "express";
import { pool } from "../db/connect";

export const getAllUsersData = async (req:Request,res:Response,next:NextFunction) => {
    try{
        const [users] = await pool.query(`SELECT Id,Name,DOB,Gender,MobileNo,Address,ProfilePicUrl FROM Users WHERE IsActive=1`);
        return res.status(200).json({message:"OK",users:users});
    }catch(e){
        console.log(e);
        return res.status(200).json({message:"ERROR",cause:e.message});
    }
}