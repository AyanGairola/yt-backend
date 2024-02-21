import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js";


dotenv.config({
    path:'./env'
})
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("express-db connection error", error); //hosakta h ki humari app hi db se baat nhi kar parahi jabki database connect hogya h 
    })

    app.listen(process.env.PORT || 8000,()=>{
        console.log("Server is running at port", process.env.PORT);
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed", err)
})
