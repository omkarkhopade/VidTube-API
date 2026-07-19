import {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const result = await toggleLike({ targetId: videoId, targetField: "video", Model: Video, userId: req.user._id })
    return res.status(200).json(new ApiResponse(200, result, result.isLiked ? "Video liked" : "Video unliked"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const result = await toggleLike({ targetId: commentId, targetField: "comment", Model: Comment, userId: req.user._id })
    return res.status(200).json(new ApiResponse(200, result, result.isLiked ? "Comment liked" : "Comment unliked"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const result = await toggleLike({ targetId: tweetId, targetField: "tweet", Model: Tweet, userId: req.user._id })
    return res.status(200).json(new ApiResponse(200, result, result.isLiked ? "Tweet liked" : "Tweet unliked"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ likedBy: req.user._id, video: { $exists: true } })
        .sort({ createdAt: -1 })
        .populate({ path: "video", match: { isPublished: true }, populate: { path: "owner", select: "username fullName avatar" } })
    const videos = likes.map(({ video }) => video).filter(Boolean)
    return res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched successfully"))
})

const toggleLike = async ({ targetId, targetField, Model, userId }) => {
    if (!isValidObjectId(targetId)) throw new ApiError(400, `Invalid ${targetField} ID`)
    if (!(await Model.exists({ _id: targetId }))) throw new ApiError(404, `${targetField} not found`)
    const filter = { [targetField]: targetId, likedBy: userId }
    const existingLike = await Like.findOne(filter)
    if (existingLike) {
        await existingLike.deleteOne()
        return { isLiked: false }
    }
    await Like.create(filter)
    return { isLiked: true }
}

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
