import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.js";
import { UploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser=asyncHandler(async (req,res,next)=>{
    console.log(req.body);
    const {fullname,username,password,email}=req.body;      //taking the information
    // if(email)console.log("email:",email);

    if([email,password,username,fullname].some((field=>field?.trim()===""))){         //should not empty
        throw new ApiError(400,"All Fields are required!");
    }

    const existedUser=await User.findOne({                             //already existed User?
        $or:[{username} , {email}]
    })
    if(existedUser){
        throw new ApiError(400,"User already exist!");
    }
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverimageLocalPath = req.files?.coverimage?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file not found");
    } 
    // console.log("Avatar Local Path:", avatarLocalPath);
    const avatar=await UploadOnCloudinary(avatarLocalPath);                        //local to cloudinary 
    const coverimage=await UploadOnCloudinary(coverimageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file not found again")
    }

    const user = await User.create({
        fullname,
        username,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverimage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Sorry! Can't create User")
    }
    return res.status(201).json(
        new ApiResponse(201,createdUser,"User registered Successfully!!")
    )
})

export {registerUser}