import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")
    const options = { page: Math.max(Number(page) || 1, 1), limit: Math.min(Math.max(Number(limit) || 10, 1), 100), sort: { createdAt: -1 } }
    const aggregate = Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "owner" } },
        { $unwind: "$owner" },
        { $project: { content: 1, video: 1, createdAt: 1, updatedAt: 1, "owner._id": 1, "owner.username": 1, "owner.fullName": 1, "owner.avatar": 1 } }
    ])
    const comments = await Comment.aggregatePaginate(aggregate, options)
    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const content = req.body.content?.trim()
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")
    if (!content) throw new ApiError(400, "Comment content is required")
    if (!(await Video.exists({ _id: videoId, isPublished: true }))) throw new ApiError(404, "Video not found")
    const comment = await Comment.create({ content, video: videoId, owner: req.user._id })
    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const content = req.body.content?.trim()
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID")
    if (!content) throw new ApiError(400, "Comment content is required")
    const comment = await Comment.findOneAndUpdate({ _id: commentId, owner: req.user._id }, { $set: { content } }, { new: true, runValidators: true })
    if (!comment) throw new ApiError(404, "Comment not found or you are not its owner")
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID")
    const comment = await Comment.findOneAndDelete({ _id: commentId, owner: req.user._id })
    if (!comment) throw new ApiError(404, "Comment not found or you are not its owner")
    await Like.deleteMany({ comment: comment._id })
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
