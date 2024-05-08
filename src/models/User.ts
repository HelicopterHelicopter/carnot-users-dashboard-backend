import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket{
    Id:number,
    UserName:string,
    Name:string,
    DOB:Date,
    Gender:string,
    MobileNo:string,
    Address:string,
    ProfilePicUrl:string,
    Password:string,
    IsActive:boolean,
    CreatedBy:string,
    CreatedAt:Date,
    UpdatedBy:string,
    UpdatedAt:Date,
    Email:string
};

export default User;