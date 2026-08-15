import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.js";
import { UploadOnCloudinary } from "../utils/cloudinary.js";
import JWT, { decode } from 'jsonwebtoken'
import mongoose from "mongoose";

const generateAccessandRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
    
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError("Something went wrong.");
    }  
}

const registerUser=asyncHandler(async (req,res,next)=>{
    //get user details fro frontend
    //validate-not empty
    //check if user is not existed-username,email
    //check for images check for avatar,
    //upload them to cloudinary,avatar,covverImage
    //remove password and refreshToken from response
    //check fro user creation
    //return res
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
    const coverimageLocalPath = req.files?.coverImage?.[0]?.path;

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

const loginUser = asyncHandler(async(req,res)=>{
    //req body->data
    //username or email,validity
    //find the user
    //password check
    //access and refresh token
    //send cookie
    const {email,password,username}=req.body;
    if(!username && !email){
        throw new ApiError(400,"username or email is invalid!!");
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(400,"User not Exit!");
    }
    const ispassValid=await user.isPasswordCorrect(password);

    if(!ispassValid){
        throw new ApiError(400,"Password is Incorrect!");
    }
    const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id);

    const loginUser=await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true,
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{user:loginUser,refreshToken,accessToken},"Logged in Successfully!!")
    )
})

const logoutUser= asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{refreshToken:1}
        }
    )
    const options={
        httpOnly:true,
        secure:true,
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User Log out!")
    )
})

const refreshAccessToken=asyncHandler(async(req,res,next)=>{
    const incomingRefToken=req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefToken){
        throw new ApiError(400,"Authorization Refresh Token required!")
    }

    const decodedToken=await JWT.verify(incomingRefToken,process.env.EXPIRY_TOKEN_SECRET);
    if(!decodedToken){
        throw new ApiError(400,"Can't Decode the Token!")
    }
    const user=await User.findById(decodedToken._id);
    if(user.refreshToken!==incomingRefToken){
        throw new ApiError(400,"Can't match your Refresh token!")
    }
    const {newAccessToken,newRefreshToken}=await generateAccessandRefreshToken(user._id);
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .cookie("AccessToken",newAccessToken,options)
    .cookie("RefreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(200,{newAccessToken,newRefreshToken},"Access Token Updated")
    )
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {currentPassword,UpdatedPassword}=req.body;
    if( !currentPassword || !UpdatedPassword ){
        throw new ApiError(400,"Enter Valid Passwords");
    }
    const user=await User.findById(req.user?._id);
    const isPasswordCorrec=await user.isPasswordCorrect(currentPassword);
    if(!isPasswordCorrec){
        throw new ApiError(400,"Password is Incorrect.");
    }

    user.password=UpdatedPassword;
    await user.save({validateBeforeSave:false});
    return res.status(200)
    .json(
        new ApiResponse(200,{},"Password Updated successfully!")
    )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email,username}=req.body;
    if(!fullname || !email ){
        throw new ApiError(400,"Give Valid fullname or email");
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{fullname,email:email,username}
        },
        {
            new:true
        }
    ).select("-password -refreshToken")
    return res.status(200).json(
        new ApiResponse(200,user,"Account details updated.")
    )
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const updatedAvatarPath=req.files?.avatar?.[0]?.path;
    if(!updatedAvatarPath){
        throw new ApiError(400,"Avatar photo is required.");
    }
    const avatar=await UploadOnCloudinary(updatedAvatarPath);
    if(!avatar){
        throw new ApiError(500,"Can't upload avatar image.")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar:avatar.url}
        },
        {
            new:true
        }
    ).select("-password -refreshToken");
    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar image is updated"));
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const updatedCoverPath=req.files?.coverImage?.[0]?.path;
    if(!updatedCoverPath){
        throw new ApiError(400,"New Cover photo is required.");
    }
    const coverImage=await UploadOnCloudinary(updatedCoverPath);
    if(!coverImage){
        throw new ApiError(400,"Can't upload cover image")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar:coverImage.url}
        },
        {
            new:true
        }
    ).select("-password -refreshToken");
    return res.status(200)
    .json(new ApiResponse(200,user,"Cover image is updated"));
})

const getUserProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params;
    if(!username){
        throw new ApiError(400,"username is missing.")
    }
    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            },
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers",
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedto"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedto"
                },
                isSubscribed:{
                    $in: [
                        new mongoose.Types.ObjectId(req.user._id),
                        "$subscribers.subscriber"
                    ]
                    // $cond:{
                    //     if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    //     then:true,
                    //     else:false,
                    // }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverimage:1,
                email:1,
            }
        }
    ])
    console.log(channel)
    if(!channel?.length){
        throw new ApiError(404,"Channel not exist");
    }
    return res.status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully!")
    )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner",
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watched History fetched successfully!"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserProfile,
    getWatchHistory
}