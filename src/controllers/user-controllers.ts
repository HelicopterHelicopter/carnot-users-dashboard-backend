import { Request, Response, NextFunction } from "express";
import { pool } from "../db/connect";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import User from "../models/User";
import { RowDataPacket } from "mysql2";

interface UserDTO extends RowDataPacket {
    Id:number,
    UserName:string,
    Name:string|null,
    DOB:Date|null,
    Gender:string|null,
    Address:string|null,
    ProfilePicUrl:string|null
}

export const getAllUsersData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pageNo = Number(req.query.pageNo)||1;
        const offset = (pageNo-1) * 10;
        const [users] = await pool.query<UserDTO[]>(`SELECT Id,UserName,Name,DOB,Gender,MobileNo,Address,ProfilePicUrl FROM Users WHERE IsActive=1 ORDER BY Id DESC LIMIT 10 OFFSET ${offset}`);
        const [count] = await pool.query("SELECT COUNT(Id) AS TotalCount FROM Users WHERE IsActive=1");


        const updatedUsers = users.map((user)=>{
            return {
                ...user,
                ProfilePicUrl:user.ProfilePicUrl??process.env.DEFAULT_PROFILEPIC_URL
            }
        })
        return res.status(200).json({ message: "OK", totalCount:count[0].TotalCount,users: updatedUsers });
    } catch (e) {
        console.log(e);
        return res.status(200).json({ message: "ERROR", cause: e.message });
    }
}

export const updateProfile = async (req:Request,res:Response,next:NextFunction) => {
    try{
        const {name,dob,mobileNo,address,gender} = req.body;
        const userId = res.locals.jwtData.id;
        if(userId && userId>0){
            const sql = 'UPDATE Users SET Name=?,DOB=?,MobileNo=?,Address=?,Gender=? WHERE Id=?';
            const [results] = await pool.query(sql,[name,dob,mobileNo,address,gender,userId]);
            return res.status(200).json({message:"OK"});
        }
        return res.status(401).json({message:"ERROR",cause:"Invalid user"});
    }catch(e){  
        return res.status(500).json({message:"ERROR",cause:e.message});
    }
}

export const getUserProfileDetails = async (req:Request,res:Response,next:NextFunction) => {
    try{

        const userId = res.locals.jwtData.id;
        if(userId && userId > 0){
            const [users] = await pool.query<User[]>('SELECT * FROM Users WHERE Id=?',[userId]);
            if(users && users.length){
                const user = users[0];
                console.log(user.DOB);
                return res.status(200).json({message:"OK",userDetails:{username:user.UserName,name:user.Name,dob:user.DOB,gender:user.Gender,mobileNo:user.MobileNo,address:user.Address,profilePicUrl:user.ProfilePicUrl}});
            }
        }

        return res.status(401).json({message:"ERROR",cause:"user not found"});

    }catch(e){
        return res.status(500).json({message:"ERROR",cause:e.message});
    }
}

export const uploadProfilePic = async (req, res: Response, next: NextFunction) => {
    const userId = res.locals.jwtData.id;
    if (userId && userId > 0) {
        const file = req.file;
        const s3Client = new S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            },
            region: process.env.S3_REGION
        });

        const s3FileName = randomUUID().replaceAll('-', '');
        const s3FileKey = `${s3FileName}.${req.file.mimetype.split('/')[1]}`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: s3FileKey,
            Body: req.file.buffer
        });

        const s3Res = await s3Client.send(command);
        if (s3Res.$metadata.httpStatusCode === 200) {
            try {
                const s3url = `https://carnot-users-dashboard.s3.ap-south-1.amazonaws.com/${s3FileKey}`;
                const sql = 'UPDATE Users SET ProfilePicUrl=? WHERE Id=?';
                const [results] = await pool.query(sql, [s3url, userId]);
                return res.status(200).json({message:"OK",profilePicUrl:s3url});
            } catch (e) {
                console.log(e);
                return res.status(200).json({message:"ERROR",cause:e.message});
            }



        }
    }else{
        return res.status(403).json({message:"ERROR",cause:"Invalid userId"});
    }


}