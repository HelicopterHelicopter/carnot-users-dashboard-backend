import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import appRouter from './routes';
import cookieParser from 'cookie-parser';

config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({origin:["http://localhost:5173","http://13.127.64.232:8090"],credentials:true}));
app.use(express.json());

app.use(cookieParser(process.env.COOKIE_SECRET));

app.use("/api/v1",appRouter);

app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
})