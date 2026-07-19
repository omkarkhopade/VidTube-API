import {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name?.trim() || !description?.trim()) throw new ApiError(400, "Name and description are required")
    const playlist = await Playlist.create({ name: name.trim(), description: description.trim(), owner: req.user._id })
    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID")
    const playlists = await Playlist.find({ owner: userId }).sort({ createdAt: -1 }).populate("videos")
    return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")
    const playlist = await Playlist.findById(playlistId).populate({ path: "videos", populate: { path: "owner", select: "username fullName avatar" } }).populate("owner", "username fullName avatar")
    if (!playlist) throw new ApiError(404, "Playlist not found")
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    validateIds(playlistId, videoId)
    if (!(await Video.exists({ _id: videoId }))) throw new ApiError(404, "Video not found")
    const playlist = await Playlist.findOneAndUpdate({ _id: playlistId, owner: req.user._id }, { $addToSet: { videos: videoId } }, { new: true })
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not its owner")
    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    validateIds(playlistId, videoId)
    const playlist = await Playlist.findOneAndUpdate({ _id: playlistId, owner: req.user._id }, { $pull: { videos: videoId } }, { new: true })
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not its owner")
    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")
    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, owner: req.user._id })
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not its owner")
    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")
    if (!name?.trim() || !description?.trim()) throw new ApiError(400, "Name and description are required")
    const playlist = await Playlist.findOneAndUpdate({ _id: playlistId, owner: req.user._id }, { $set: { name: name.trim(), description: description.trim() } }, { new: true, runValidators: true })
    if (!playlist) throw new ApiError(404, "Playlist not found or you are not its owner")
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

const validateIds = (playlistId, videoId) => {
    if (!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID")
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID")
}

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
