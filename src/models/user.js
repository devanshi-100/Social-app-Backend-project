import mongoose from 'moongose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema=new mongoose.schema({
    username:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
        index:true,
    },
    email:{
        type:String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
        index:true,
    },
    fullname:{
        type:String,
        lowercase:true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String, //(provide from third party->cloudinary url)
        required:true,
    },
    coverImage:{
        type:String,       //cloudinary url
    },
    password:{
        type:String,
        required:[true,'Password is required!'],
    },
    watchHistory:[{
        type: Schema.Types.ObjectId,
        ref:'Video'
    }],
    refreshToken:{
        type:String,
    }
},{timeStamp:true})


videoSchema.pre("save",async function(next){
    if(!this.isModified("password"))return next();
    this.password=bcrypt.hash(this.password,10)
    next();
})

videoSchema.methods.ispasswordCorrect=function (password){
    return await bcrypt.compare(password,this.password)
}

videoSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id:this_id,
        email:this.email,
        fullname:this.fullname,
        username:this.username
    },process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}

videoSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this_id
    },process.env.EXPIRY_TOKEN_SECRET,{expiresIn:process.env.EXPIRY_TOKEN_EXPIRY})
}

export const User=mongoose.model('User',userSchema)

