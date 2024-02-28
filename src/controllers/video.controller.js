import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { User } from "../models/user.model.js";


const publishVideo=asyncHandler(async(req,res)=>{
    /*
    1-get title and description
    2-get video and thumbnail
    3-upload on cloudinary
    4-upload on mongo
    5-return res
    */

    //get title and des
    const {title,description}=req.body //jwt to check if user is logged in or not
    console.log(title);

    if (!title) {
        throw new ApiError(400,"title for a video is req")
    }


    // get video and thumbnail
    const videoLocalPath = req.files?.videoFile[0].path
    if (!videoLocalPath) {
        throw new ApiError(400,"No video found")
    }
    
    const thumbnailLocalPath = req.files?.thumbnail[0].path
    if (!thumbnailLocalPath) {
        throw new ApiError(400,"No thumbnail found")
    }


    //upload on cloudinary
    const videoFile=await uploadOnCloudinary(videoLocalPath)
    if (!videoFile) {
        throw new ApiError(400,"video not uploaded on cloudinary")
    }

    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(400,"thumbnail not uploaded on cloudinary")
    }

    console.log("Video and thumbnail uploaded on cloudinary");

    //getting the user
    const user=await User.findById(req.user?._id)

    //store the data on mongo 
    const video=await Video.create({
        videoFile:videoFile.secure_url,
        thumbnail:thumbnail.url,
        owner:user._id,
        title:title,
        description:description || "",
        duration:videoFile.duration

    })

    //return the res
    return (
        res
        .status(200)
        .json(new ApiResponse(200,video, "Video uploaded successfully"))
    )

})


const getAllVideos=asyncHandler(async(req,res)=>{
    /*
    1-extract query parameters
    2-construct the query
    3-execute the query
    4- return the response
    */

    //extracting query parameters
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    //constructing mongodb query
    const conditions = {};
    if (query) {
        conditions.title = { $regex: query, $options: 'i' }; // Case-insensitive search
    }
    if (userId) {
        conditions.userId = userId;
    }

    const sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;
    }
    

    // Execute the query
    const videos = await Video.find(conditions)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    // Return the videos
    res.status(200).json(new ApiResponse(200,videos,"videos fetched successfully"));
})


const getVideoById=asyncHandler(async(req,res)=>{
    try {
        const { videoId } = req.params
        if(!videoId){
            throw new ApiError(400,"videoId cant be fetched from params")
        }
    
        const video=await Video.findById(videoId)
        if(!video){
            throw new ApiError(400,"Cant find video")
        }

        return(
            res
            .status(200)
            .json(new ApiResponse(200,video,"video fetched successfully"))
        )

    } catch (error) {
        throw new ApiError(400,`Internal Error ${error}` )
    }
})


const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"videoId cant be fetched from params")
    }

    //only the owner can update the video details
    const video = await Video.findById(videoId)
    const user= await User.findById(req.user?._id)

    if (video?.owner.equals(user)) {
        const video=await Video.findById(videoId)
        if(!video){
            throw new ApiError(400,"Cant find video")
        }
    
        //updating title and description
        const {title,description}=req.body
        if (!title) {
            throw new ApiError(400, "Title is required");
        }
        
        if (!description) {
            throw new ApiError(400, "Description is required");
        }
    
        video.title=title
        video.description=description
        
    
    
        //updating thumbnail
        const newThumbnailLocalFilePath=req.file?.path
        if(!newThumbnailLocalFilePath){
            throw new ApiError(400,"Thumbnail is not uploaded")
        }
    
        const newThumbnail=await uploadOnCloudinary(newThumbnailLocalFilePath)
    
        if(!newThumbnail){
            throw new ApiError(400,"new Thumbnail not uploaded on cloudinary")
        }
    
        video.thumbnail=newThumbnail.url
        
        //saving the changes
        await video.save({ validateBeforeSave: false })
    
        //returning the response
        return(
            res
            .status(200)
            .json(new ApiResponse(200,video,"video details updated successfully"))
        )
    }
    else{
        throw new ApiError(400,"Video details cant be updated")
    }

})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"videoId cant be fetched from params")
    }
    
    const video = await Video.findById(videoId)
    const user= await User.findById(req.user?._id)


    //only the owner can delete the video
    if (video?.owner.equals(user)) {
        await Video.findByIdAndDelete(videoId)
    }

    return(
        res
        .status(200)
        .json(new ApiResponse(200,{},"Video deleted successfully"))
    )
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"videoId cant be fetched from params")
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;

    await video.save({ validateBeforeSave: false })

    return(
        res
        .status(200)
        .json(200,video.isPublished,"Video publish toggled successfully")
    )
})


export{
    publishVideo,
    getAllVideos,
    getVideoById,
    updateVideoDetails,
    deleteVideo,
    togglePublishStatus
}