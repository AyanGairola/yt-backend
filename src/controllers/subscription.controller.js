import {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Cannot find the channel")
    }

    const channel=await User.findById(channelId) //channel is also user
    if(!channel){
        throw new ApiError(404,"Channel does not exist")
    }

    const user = await User.findOne({
        refreshToken: req.cookies.refreshToken,
    })
    if (!user) {
        throw new ApiError(404, "Subscriber not found")
    }


    const userSub=await Subscription.findOne({
        subscriber: user._id,
        channel: channelId,
    });

    //if user is subscribed- unsubscribe 
    if(userSub){
        const unsubscribe= await Subscription.findOneAndDelete(
            {
                subscriber: user._id,
                channel: channel._id
            }
        )

        if (!unsubscribe) {
            throw new ApiError(500, "Something went wrong while unsubscribing ");
        }

        return(
            res
            .status(200)
            .json(new ApiResponse(200,unsubscribe,"User unsubscribed"))
        )
    }

    //else subscribe the channel
    if(!userSub){
        const subscribe=await Subscription.create(
            {
                subscriber: user._id,
                channel: channel._id
            }
        )
        if (!subscribe) {
            throw new ApiError(500,"Error while subscribing the channel")
        }
        return(
            res
            .status(200)
            .json(new ApiResponse(200,subscribe,"User subscribed"))
        )
        
    }
})

//controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Cannot fetch channel id from params")
    }

    const channel=await User.findById(channelId)
    if(!channel){
        throw new ApiError(404,"Channel does not exist")
    }


    //get the subscribers
    const subscribers=await Subscription.find(
        {
            channel:channel?._id
        }
    ).populate('subscriber')

    //get the subscriber count
    const subscriberCount=await Subscription.countDocuments({
        channel:channelId
    })


    //returning the response
    return(
        res
        .status(200)
        .json(new ApiResponse(200,{subscriberCount,subscribers},"Subscribers retrieved successfully"))
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate('channel');

    const subscriptionsCount=await Subscription.countDocuments({
        subscriber: subscriberId    
    })

    //returning the response
    return(
        res
        .status(200)
        .json(new ApiResponse(200,{subscriptionsCount,subscriptions},"Subscribed channels fetched successfully"))
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}