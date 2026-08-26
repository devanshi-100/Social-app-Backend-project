import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new ApiError(400, "Page must be a positive integer.");
    }
    if (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        throw new ApiError(
            400,
            "Limit must be between 1 and 100."
        );
    }

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID.");
    }

    const allowedSortFields = [
        "createdAt",
        "updatedAt",
        "views",
        "duration",
        "title"
    ];
    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, "Invalid sort field.");
    }

    const allowedSortTypes = ["asc", "desc"];
    if (!allowedSortTypes.includes(sortType)) {
        throw new ApiError(400, "Invalid sort type.");
    }

    const matchStage = {
        isPublished: true
    };

    if (query?.trim()) {
        matchStage.$or = [  //check any condition to get true and return true
            {
                title: {
                    $regex: query.trim(),  //regex--> find word in the string
                    $options: "i"           //check words without case sensitive
                }
            },
            {
                description: {
                    $regex: query.trim(),
                    $options: "i"
                }
            }
        ];
    }

    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortOrder = sortType === "asc" ? 1 : -1;

    const aggregate = Video.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    avatar: 1
                }
            }
        },
        {
            $sort: {
                [sortBy]: sortOrder
            }
        }
    ]);

    const options = {
        page: pageNumber,
        limit: limitNumber
    };

    const videos = await Video.aggregatePaginate(
        aggregate,
        options
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Videos fetched successfully."
            )
        );
});

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body;

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    const userId = req.user?._id;

    // Validate authenticated user
    if (!userId) {
        throw new ApiError(401, "Unauthorized request.");
    }

    // Validate title
    if (!title?.trim()) {
        throw new ApiError(400, "Video title is required.");
    }

    // Validate description
    if (!description?.trim()) {
        throw new ApiError(400, "Video description is required.");
    }

    // Validate video file
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required.");
    }

    // Validate thumbnail
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required.");
    }

    // Upload video to Cloudinary
    const uploadedVideo = await UploadOnCloudinary(videoLocalPath);

    if (!uploadedVideo?.url) {
        throw new ApiError(500, "Video upload failed.");
    }

    // Upload thumbnail to Cloudinary
    const uploadedThumbnail = await UploadOnCloudinary(
        thumbnailLocalPath
    );

    if (!uploadedThumbnail?.url) {
        throw new ApiError(500, "Thumbnail upload failed.");
    }

    // Create video document
    const video = await Video.create({
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        title: title.trim(),
        description: description.trim(),
        duration: uploadedVideo.duration,
        owner: userId,
        isPublished: true
    });
    if (!video) {
        throw new ApiError(500, "Video could not be published.");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                video,
                "Video published successfully."
            )
        );
});

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params;

    // Validate video ID
    if (!videoId) {
        throw new ApiError(400, "Video ID is required.");
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID.");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,

                owner: {
                    _id: 1,
                    username: 1,
                    fullname: 1,
                    avatar: 1
                }
            }
        }
    ]);

    if (!video?.length) {
        throw new ApiError(404, "Video not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video[0],
                "Video fetched successfully."
            )
        );
});

const updateVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const {title,description}=req.body;

    const videoFilePath=req.files?.videoFile?.[0]?.path;
    const thumbnailFilePath=req.files?.thumbnail?.[0]?.path;
    const user=req.user;
    if(!videoId){
        throw new ApiError(400,"video id is not valid!");
    }
    if(!user){
        throw new ApiError("user is required");
    }

    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video not found");
    }
    if(user._id.toString()!==video.owner.toString()){
        throw new ApiError(400,"You are not authorized!!");
    }
    const updateData={};
    if(title!=undefined){
        updateData.title=title;
    }
    if(description!=undefined){
        updateData.description=description;
    }
    if(videoFilePath){
        const videoFile=await UploadOnCloudinary(videoFilePath);
        if(!videoFile?.url){
            throw new ApiError(500,"video upload failed");
        }
        updateData.videoFile=videoFile.url;
        updateData.duration=videoFile.duration;
    }
    if(thumbnailFilePath){
        const thumbnail=await UploadOnCloudinary(thumbnailFilePath);
        if(!thumbnail?.url){
            throw new ApiError(500,"thumbnail upload failed");
        }
        updateData.thumbnail=thumbnail.url;
    }


    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:updateData
        },
        {
            new:true
        }
    )

    if(!updatedVideo){
        throw new ApiError(500,"video cant updated");
    }
    return res.status(200)
    .json(
        new ApiResponse(200,updatedVideo,"video updated successully")
    )

})

const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    const user=req.user;
    const video=await Video.findById(videoId);
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    if (!user) {
        throw new ApiError(401, "User is required");
    }
    if (!video) {
        throw new ApiError(404, "Video is not found");
    }
    if(user._id.toString()!==video.owner.toString()){
        throw new ApiError(403,"You are not authorized");
    }
    await Video.findByIdAndDelete(videoId)
    return res.status(200)
    .json(
        new ApiResponse(200,"","video deleted succesfully")
    )
})

const togglePublishStatus=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const user=req.user;

    if(!videoId){
        throw new ApiError(400,"video id is not valid");
    }
    if(!user){
        throw new ApiError(400,"user not exist");
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video not exist");
    }

    if(user._id.toString()!==video.owner.toString()){
        throw new ApiError(400,"user not authorized");
    }

    const updatedvideo=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!video.isPublished
            }
        },
        {
            new:true
        }
    )
    return res.status(200).
    json(
        new ApiResponse(200,updatedvideo,"video publish toggled")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
