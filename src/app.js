import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"


const app=express()


app.use(cors({
    origin: process.env.CORS_ORIGIN
}))

app.use(express.json({limit:"15kb"}))
app.use(express.urlencoded({extended: true, limit: "15kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'


//routes declare
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)


export default app;