import {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID")
    if (channelId === req.user._id.toString()) throw new ApiError(400, "You cannot subscribe to yourself")
    if (!(await User.exists({ _id: channelId }))) throw new ApiError(404, "Channel not found")
    const filter = { subscriber: req.user._id, channel: channelId }
    const subscription = await Subscription.findOne(filter)
    if (subscription) {
        await subscription.deleteOne()
        return res.status(200).json(new ApiResponse(200, { isSubscribed: false }, "Channel unsubscribed"))
    }
    await Subscription.create(filter)
    return res.status(200).json(new ApiResponse(200, { isSubscribed: true }, "Channel subscribed"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID")
    if (!(await User.exists({ _id: channelId }))) throw new ApiError(404, "Channel not found")
    const subscriptions = await Subscription.find({ channel: channelId }).populate("subscriber", "username fullName avatar")
    return res.status(200).json(new ApiResponse(200, subscriptions.map(({ subscriber }) => subscriber), "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid subscriber ID")
    if (!(await User.exists({ _id: subscriberId }))) throw new ApiError(404, "User not found")
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate("channel", "username fullName avatar coverImage")
    return res.status(200).json(new ApiResponse(200, subscriptions.map(({ channel }) => channel), "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
