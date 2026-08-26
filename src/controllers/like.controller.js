import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const existingLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(200, null, "Video unliked successfully")
        )
    }

    const like = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, like, "Video liked successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const existingLike = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(200, null, "Comment unliked successfully")
        )
    }

    const like = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, like, "Comment liked successfully")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const existingLike = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(200, null, "Tweet unliked successfully")
        )
    }

    const like = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, like, "Tweet liked successfully")
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $ne: null }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ],
                            as: "owner"
                        }
                    },
                    {
                        $set: {
                            owner: { $first: "$owner" }
                        }
                    }
                ],
                as: "video"
            }
        },
        { $unwind: "$video" },
        {
            $project: {
                _id: 0,
                video: 1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
