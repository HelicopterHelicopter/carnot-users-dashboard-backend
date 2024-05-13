import { Request, Response, NextFunction } from "express";
import { hash, compare } from 'bcrypt';
import { pool } from "../db/connect";
import User from "../models/User";
import { COOKIE_NAME } from "../utils/constants";
import { createToken } from "../utils/token-manager";
import { ResultSetHeader } from "mysql2";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export const login = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const { userName, password } = req.body;

        const checkIfUserExistQuery = 'SELECT * FROM Users WHERE UserName=? AND IsActive=1';
        const [users] = await pool.query<User[]>(checkIfUserExistQuery, [userName]);
        if (!users.length) {
            return res.status(200).json({ message: "User not registered" });
        }

        const user = users[0];

        const isPasswordCorrect = await compare(password, user.Password);

        if (!isPasswordCorrect) {
            return res.status(200).json({ message: "Incorrect password" });
        }

        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            signed: true,
            domain: "localhost",
            path: "/"
        });

        const token = createToken(user.Id, "7d");
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);

        res.cookie(COOKIE_NAME, token, {
            path: "/",
            domain: "carnot-users-dashboard-client.vercel.app",
            expires,
            httpOnly: true,
            signed: true
        });

        return res.status(200).json({ message: "OK", userDetails: { username: user.UserName, name: user.Name, dob: user.DOB, profilePic: user.ProfilePicUrl ?? process.env.DEFAULT_PROFILEPIC_URL, mobileNo: user.MobileNo, address: user.Address,email:user.Email } });
    } catch (e) {
        console.log(e);
        return res.status(200).json({ message: "ERROR", cause: e.message });
    }

}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userName, email, password } = req.body;

        if (!await checkExistingUser(userName)) {
            return res.status(200).json({ message: "User already exists with the given Username." });
        }

        const hashedPassword = await hash(password, 10);

        const sql = 'INSERT INTO Users (UserName,Password,Email,IsActive,CreatedBy,CreatedAt) VALUES (?,?,?,?,?,NOW())';
        const [results] = await pool.query<ResultSetHeader>(sql, [userName, hashedPassword, email, 1, userName]);

        const userId = results.insertId;

        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            signed: true,
            domain: "localhost",
            path: "/"
        });

        const token = createToken(userId, "7d");
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);

        res.cookie(COOKIE_NAME, token, {
            path: "/",
            httpOnly: true,
            signed: true,
            domain: "localhost",
            expires
        });


        return res.status(201).json({ message: "OK",userDetails:{username:userName,name:null,dob:null,profilePic:process.env.DEFAULT_PROFILEPIC_URL,mobileNo: null, address: null,email:email} });
    } catch (e) {
        return res.status(200).json({ message: "ERROR", cause: e.message });
    }
}

export const checkExistingUser = async (userName: string) => {
    try {
        const sql = 'SELECT * FROM Users WHERE UserName=? AND IsActive=1';
        const [users] = await pool.query<User[]>(sql, [userName]);
        if (!users.length) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

export const signOut = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const userId = res.locals.jwtData.id;

        console.log(userId);

        if (userId && userId > 0) {
            const sql = "SELECT * FROM Users WHERE Id=? AND IsActive = 1";
            const [users] = await pool.query<User[]>(sql, [userId]);
            if (users.length) {
                res.clearCookie(COOKIE_NAME, {
                    httpOnly: true,
                    domain: "localhost",
                    signed: true,
                    path: "/"
                });

                return res.status(200).json({ message: "OK" });
            }
        }

        return res.status(401).json({ message: "ERROR", cause: "User not registered or token malfunctioned" });

    } catch (e) {
        console.log(e);
        return res.status(200).json({ message: "ERROR", cause: e.message });
    }
}

export const google = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const verify = await verifyGoogleAccessToken(req.body.token);
        console.log(verify);
        if (!verify.isVerified) {
            return res.status(401).json({ message: "Invalid token" });
        }
        const [users] = await pool.query<User[]>("SELECT * FROM Users WHERE Email=? AND IsActive=1", [verify.email]);
        if (users.length) {

            const user = users[0];
            const token = createToken(user.Id, "7d");
            const expires = new Date();
            expires.setDate(expires.getDate() + 7);

            res.cookie(COOKIE_NAME, token, {
                path: "/",
                domain: "localhost",
                expires,
                httpOnly: true,
                signed: true
            });

            return res.status(200).json({ message: "OK", userDetails: { username: user.UserName, name: user.Name, dob: user.DOB, gender:user.Gender,profilePic: user.ProfilePicUrl ?? process.env.DEFAULT_PROFILEPIC_URL, mobileNo: user.MobileNo, address: user.Address,email:user.Email } });

        } else {
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = await hash(generatedPassword,10);
            const generatedUsername = verify.name.split(' ').join(' ').toLowerCase() + Math.random().toString(36).slice(-8);

            const sql = 'INSERT INTO Users (UserName,Name,Password,Email,ProfilePicUrl,IsActive,CreatedBy,CreatedAt) VALUES (?,?,?,?,?,1,?,NOW())';
            const [results] = await pool.query<ResultSetHeader>(sql,[generatedUsername,verify.name,hashedPassword,verify.email,verify.picture,generatedUsername]);

            const userId = results.insertId;

            res.clearCookie(COOKIE_NAME, {
                httpOnly: true,
                signed: true,
                domain: "localhost",
                path: "/"
            });
    
            const token = createToken(userId, "7d");
            const expires = new Date();
            expires.setDate(expires.getDate() + 7);
    
            res.cookie(COOKIE_NAME, token, {
                path: "/",
                httpOnly: true,
                signed: true,
                domain: "localhost",
                expires
            });

            return res.status(200).json({ message: "OK" , userDetails: { username: generatedUsername, name: verify.name, dob: "", profilePic: verify.pictuire ?? process.env.DEFAULT_PROFILEPIC_URL, mobileNo: null, address: null,email:verify.email,gender:null }});
        }
    } catch (e) {
        console.log(e);
        return res.status(200).json({message:"ERROR",cause:e.message});
    }

}

const verifyGoogleAccessToken = async (access_token: string) => {
    try {
        const userData = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
        console.log(userData.status);
        if (userData.status !== 200) {
            return { isVerified: false }
        } else {
            const data = await userData.data;
            console.log(data);
            return { ...data, isVerified: true };
        }
    } catch (e) {
        return { isVerified: false }
    }
}
