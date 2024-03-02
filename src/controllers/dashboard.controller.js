import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const getChannelVideos = asyncHandler(async (req, res) => {
    const user= await User.findOne({
        refreshToken: req.cookies.refreshToken
    })

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const videos=await Video.find({
        owner:user?._id
    })

    if (!videos || videos.length === 0) {
        throw new ApiError(500, "Error while fetching the videos")
    }

    return(
        res
        .status(200)
        .json(new ApiResponse(200,videos,"Videos fetched successfully"))
    )
})


const getChannelStats = asyncHandler(async (req, res) => {
    const user=await User.findOne({
        refreshToken:req.cookies.refreshToken
    })

    if(!user){
        throw new ApiError(404,"User not found")
    }

    //total video views
    const totalVideoViews=await Video.aggregate([
        {
            $match:{
                owner:user._id
            }
        },
        {
            $group:{
                _id:null,
                totalViews:{
                    $sum:"$views"
                }
            }
        }
    ])

    //total likes
    const totalLikes=await Like.countDocuments({
        likedBy:user._id
    })

    //total videos
    const totalVideos = await Video.countDocuments({
        owner: user._id 
    })

    //total subs
    const totalSubscribers = await Subscription.countDocuments({
        channel: user._id 
    })


    //returning response
    return(
        res
        .status(200)
        .json(new ApiResponse(200,{
            totalVideoViews: totalVideoViews[0]?.totalViews || 0,
            totalLikes,
            totalSubscribers,
            totalVideos
        }))
    )

})


export {
    getChannelStats, 
    getChannelVideos
    }