import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {Comment} from "../models/comment.model.js"
import {Like} from "../models/like.model.js"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const currentPage = Math.max(Number(page) || 1, 1)
    const pageLimit = Math.min(Math.max(Number(limit) || 10, 1), 100)
    const match = { isPublished: true }
    if (userId) {
        if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID")
        match.owner = new mongoose.Types.ObjectId(userId)
    }
    if (query?.trim()) {
        const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        match.$or = [{ title: { $regex: safeQuery, $options: "i" } }, { description: { $regex: safeQuery, $options: "i" } }]
    }
    const allowedSortFields = new Set(["createdAt", "updatedAt", "views", "duration", "title"])
    const sortField = allowedSortFields.has(sortBy) ? sortBy : "createdAt"
    const sortDirection = sortType === "asc" ? 1 : -1
    const aggregate = Video.aggregate([
        { $match: match },
        { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "owner" } },
        { $unwind: "$owner" },
        { $project: { videoFile: 1, thumbnail: 1, title: 1, description: 1, duration: 1, views: 1, isPublished: 1, createdAt: 1, "owner._id": 1, "owner.username": 1, "owner.fullName": 1, "owner.avatar": 1 } }
    ])
    const videos = await Video.aggregatePaginate(aggregate, { page: currentPage, limit: pageLimit, sort: { [sortField]: sortDirection } })
    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const cleanTitle = title?.trim()
    const cleanDescription = description?.trim()
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    if (!cleanTitle || !cleanDescription) throw new ApiError(400, "Title and description are required")
    if (!videoLocalPath || !thumbnailLocalPath) throw new ApiError(400, "Video file and thumbnail are required")
    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    if (!videoUpload) throw new ApiError(500, "Video upload failed")
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnailUpload) {
        await deleteFromCloudinary(videoUpload.secure_url || videoUpload.url, "video")
        throw new ApiError(500, "Thumbnail upload failed")
    }
    const video = await Video.create({
        videoFile: videoUpload.secure_url || videoUpload.url,
        thumbnail: thumbnailUpload.secure_url || thumbnailUpload.url,
        title: cleanTitle,
        description: cleanDescription,
        duration: videoUpload.duration,
        owner: req.user._id
    })
    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")
    const video = await Video.findById(videoId).populate("owner", "username fullName avatar coverImage")
    if (!video || (!video.isPublished && video.owner._id.toString() !== req.user._id.toString())) throw new ApiError(404, "Video not found")
    if (video.owner._id.toString() !== req.user._id.toString()) {
        video.views += 1
        await video.save({ validateBeforeSave: false })
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { watchHistory: video._id } })
    }
    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")
    const video = await Video.findOne({ _id: videoId, owner: req.user._id })
    if (!video) throw new ApiError(404, "Video not found or you are not its owner")
    const title = req.body.title?.trim()
    const description = req.body.description?.trim()
    if (title) video.title = title
    if (description) video.description = description
    if (req.file?.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path)
        if (!thumbnail) throw new ApiError(500, "Thumbnail upload failed")
        const oldThumbnail = video.thumbnail
        video.thumbnail = thumbnail.secure_url || thumbnail.url
        await video.save()
        await deleteFromCloudinary(oldThumbnail)
    } else {
        await video.save()
    }
    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")
    const video = await Video.findOneAndDelete({ _id: videoId, owner: req.user._id })
    if (!video) throw new ApiError(404, "Video not found or you are not its owner")
    const comments = await Comment.find({ video: video._id }).select("_id")
    await Promise.all([
        deleteFromCloudinary(video.videoFile, "video"),
        deleteFromCloudinary(video.thumbnail),
        User.updateMany({}, { $pull: { watchHistory: video._id } }),
        Comment.deleteMany({ video: video._id }),
        Like.deleteMany({ $or: [{ video: video._id }, { comment: { $in: comments.map(({ _id }) => _id) } }] }),
        Playlist.updateMany({}, { $pull: { videos: video._id } })
    ])
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")
    const video = await Video.findOne({ _id: videoId, owner: req.user._id })
    if (!video) throw new ApiError(404, "Video not found or you are not its owner")
    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
