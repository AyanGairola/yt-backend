import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if videoId is a valid ObjectId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const pageNumber = parseInt(page);
    const limitOfComments = parseInt(limit);

    // Find the video
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Find comments for the video
    const comments = await Comment.aggregatePaginate(
        Comment.aggregate([
            { 
                $match: { 
                    video: mongoose.Types.ObjectId(videoId) 
                } 
            },
            {
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"comment",
                    as:"likes"
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"user"
                }
            },
            {
                $addFields:{
                    likes:{
                        $size:"$likes"
                    },
                    isLiked:{
                        $in:[req.user?.id,"$likes.likedBy"]
                    },
                    username:{
                        $arrayElemAt:["$user.username",0]
                    }
                }
            },
            {
                $project:{
                    username:1,
                    content:1,
                    likes:1,
                    createdAt:1,
                    isLiked:1
                }
            },
            { 
                $sort: { createdAt: -1 } // Sort by createdAt in descending order
            } 
        ]),
        { page: pageNumber, limit: limitOfComments }
    );

    if(comments.length===0){
        throw new ApiError(400,"No comments on the video")
    }

    // Return the paginated comments
    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});


const addComment = asyncHandler(async (req, res) => {

    //getting content,video and user
    const {videoId}=req.params
    if(!videoId){
        throw new ApiError(400,"Invalid videoId")
    }

    
    const { content }=req.body
    if(!content){
        throw new ApiError(400,"Content is required")
    }

    const user=await User.findById(req.user?._id)
    const video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"cannot find the video")
    }

    //storing on mongoDB
    const comment=await Comment.create({
        content:content,
        owner:user._id,
        video:video._id
    })

    if(!createComment){
        throw new ApiError(500, "Error in creating the comment")
    }

    //returning the response
    return(
        res
        .status(200)
        .json(new ApiResponse(200,comment,"Commented successfully"))
    )

})


const updateComment = asyncHandler(async(req,res)=>{
    //getting comment 
    const {commentId}=req.params
    if (!commentId) {
        throw new ApiError(400,"Cannot find comment id")
    }

    const comment=await Comment.findById(commentId)
    //validating if the user is the one updating the comment
    const user= await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"Cant find User")
    }
    
    if(comment?.owner.equals(user)){
        const {content}=req.body
        if (!content) {
            throw new ApiError(400,"Content is required")
        }

        //updating the comment 
        comment.content=content
        await comment.save({validateBeforeSave:false})

        return(
            res
            .status(200)
            .json(new ApiResponse(200,comment,"comment updated successfully"))
        )
    }else{
        throw new ApiError(400,"Only the owner can update the comment")
    }
    
})

    
const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    if(!commentId){
        throw new ApiError(400,"comment Id cant be fetched for params")
    }
    const comment= await Comment.findById(commentId)
    if (!comment) {
        return res.status(404).json(new ApiResponse(404, {}, "Comment not found"));
    }

    const user=await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"Cant find the user")
    }


    //only the owner can delete the tweet
    if (comment?.owner.equals(user)) {
        await Comment.findByIdAndDelete(commentId)
        return(
            res
            .status(200)
            .json(new ApiResponse(200,{},"Comment deleted successfully"))
        )
    }else{
        throw new ApiError(401,"Only user can delete the comment")
    }
})


export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }
