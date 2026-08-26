import mongoose from 'mongoose';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {Comment} from '../models/comment.model.js';

const getVideoComment=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const {page=1,limit=10}=req.query;  //?page=2&limit=10

    if(!videoId){
        throw new ApiError(400,"Video Id is required!");
    }
    const aggregate=Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{   //join user as owner
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner'
            },
        },
        {
            $unwind:'$owner'//take out the object from array of object
        },
        {
            $project:{
                content:1,
                vedio:1,
                createdAt:1,
                owner:{
                    _id:1,
                    username:1,
                    avatar:1,
                }
            }
        },
        {
            $sort:{
                createdAt:-1,     //sort comments on recent one first-desc
            }
        }
    ]);
    const option={
        page:Number(page),
        limit:Number(limit),
    }
    const comments=await Comment.aggregatePaginate(
        aggregate,
        option,
    )
    return res.status(200)
    .json(
        new ApiResponse(200,comments,'Comment fetched in pagination format.')
    )
})

const addComment=asyncHandler(async(req,res)=>{
    const {content}=req.body;
    const {videoId}=req.params;
    const user=req.user;  //calling a middleware auth.middleware.js which add user in req.user

    if(!content){
        throw new ApiError(400,"Content is important");
    }
    if(!videoId){
        throw new ApiError(400,"video id is required.");
    }
    if(!user){
        throw new ApiError(400,"Cant fetch user from middleware.");
    }
    const com=await Comment.create({
        content:content.trim(),
        video:videoId,
        user:user._id
    }) 
    return res.status(200)
    .json(
        new ApiResponse(200,com,"comment added successfully.")
    )
})

const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    if(!commentId){
        throw new ApiError(400,"comment id is required");
    }
    if(!(mongoose.Types.ObjectId.isValid(commentId))){
        throw new ApiError(400,"Not a valid comment id");
    }
    const deletedcomment=await Comment.findByIdAndDelete(
        commentId
    );
    if(!deleteComment){
        throw new ApiError(400,"comment not found.");
    }
    return res.status(200)
    .json(
        new ApiResponse(200,deleteComment,"comment deleted successfully.")
    )
})

const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const {content}=req.body;
    if(!commentId){
        throw new ApiError(400,"comment id is required.");
    }
    if(!content?.trim()){
        throw new ApiError(400,"content is required.");
    }
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Not valid comment id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found.");
    }

    // Authorization check
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment."
        );
    }


    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{content:content.trim()}
        },
        {
            new:true,
            runValidators:true,
        }
    )
    if(!updatedComment){
        throw new ApiError(400,"comment updation unsuccessful");
    }
    return res.status(200)
    .json(
        new ApiResponse(200,updateComment,"comment updated successfully.")
    )
})

export {
    getVideoComment,
    addComment,
    deleteComment,
    updateComment
}