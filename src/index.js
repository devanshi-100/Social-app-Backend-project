import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import connectDB from "./db/index.js";
import app from "./app.js";

connectDB().then(()=>{
    app.on("error",(err)=>{throw error})
    app.listen(process.env.PORT||8000,()=>{
        console.log("server on port:",process.env.PORT);
    })
}).catch((err)=>{
    console.log(err);
});