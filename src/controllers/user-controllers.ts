import { Request, Response, NextFunction } from "express";
import { pool } from "../db/connect";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";


export const getAllUsersData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [users] = await pool.query(`SELECT Id,UserName,Name,DOB,Gender,MobileNo,Address,ProfilePicUrl FROM Users WHERE IsActive=1`);
        return res.status(200).json({ message: "OK", users: users });
    } catch (e) {
        console.log(e);
        return res.status(200).json({ message: "ERROR", cause: e.message });
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