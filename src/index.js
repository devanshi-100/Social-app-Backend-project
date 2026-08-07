import "./config.js";

import connectDB from "./db/index.js";
import app from "./app.js";

connectDB().then(()=>{
    app.on("error",(err)=>{ throw err; });
    app.listen(process.env.PORT || 8000,()=>{
        console.log("server on port:", process.env.PORT || 8000);
    });
}).catch((err)=>{
    console.log(err);
});