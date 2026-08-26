import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import { userRouter } from './routes/user.router.js';
app.use("/user",userRouter);

import {commentRouter} from './routes/comment.route.js';
app.use("/comment",commentRouter);

import { videoRouter } from './routes/video.route.js';
app.use("/video",videoRouter);


export default app;