import { Playlist } from "../models/playlist.model.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist=asyncHandler(async(req,res)=>{
    /*
    1-get name and description
    2-upload on mongo
    3-return res
    */


    //get name and description
    const {name,description}=req.body
    if(!name){
        throw new ApiError(400,"Name for playlist is required")
    }
    if(!description){
        throw new ApiError(400,"description for playlist is required")
    }

    const user=await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"Could not find user")
    }

    //uploading on mongo
    try {
        const playlist=await Playlist.create({
            name:name,
            description:description,
            owner:user._id
        })
    
        if(!playlist){
            throw new ApiError(400,"Error while creating playlist")
        }
    
        //returning the response
        return(
            res
            .status(200)
            .json(new ApiResponse(200,playlist,"Playlist created successfully"))
        )
    } catch (error) {
        throw new ApiError(400,`Error while creating playlist ${error}`)
    }

})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid userId")
    }

    const user=await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"Could not find user")
    }

    const playlist=await Playlist.find(
        {
            owner:user._id
        }
    )
    
    return(
        res
        .status(200)
        .json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
    )
})


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id");
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"Playlist Id cannot be fetched")
    }

    return(
        res
        .status(200)
        .json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
    )

})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }
    
    //checking if video exists
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Cannot find the video")
    }

    // Check if video is already in the playlist
    const playlist = await Playlist.findById(playlistId);
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }

    //pushing video to playlist
    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,{
            $push:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    //returning the response
    return(
        res
        .status(200)
        .json(new ApiResponse(200,updatedPlaylist,"Video added to the playlist successfully"))
    )

})


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    //checking if video and playlist exists
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video does not exist")
    }

    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"Playlist does not exist")
    }
    console.log('Playlist found');

    // Checking if video is in the playlist
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is not in the playlist");
    }

    //removing the video from playlist
    try {
        await Playlist.findByIdAndUpdate(
            playlistId,{
                $pull:{
                    videos:videoId
                }
            },
            {
                new:true
            }
        )

        //returning the response
        return(
            res
            .status(200)
            .json(new ApiResponse(200,playlist,"Video removed successfully from the playlist"))
        )
    } catch (error) {
        throw new ApiError("Something went wrong while removing the video from playlist")
    }

})


const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id");
    }
    
    const playlist = await Playlist.findByIdAndDelete(playlistId);
    
    if (!playlist) {
        throw new ApiError(500, "Something went wrong while deleting the playlist");
    }
    
   return(
    res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist deleted successfully"))
   )
    
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    

    //checking parameters
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Cannot find playlist ID")
    }

    if(!name){
        throw new ApiError(400,"name is required")
    }
    if(!description){
        throw new ApiError(400,"description is required")
    }

    //updating playlist
    try {
        const playlist=await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set:{
                    name:name,
                    description:description
                }
            },{
                new:true
            }
        )
    
        if(!playlist){
            throw new ApiError(400,"Error while updating playlist")
        }
    
        //returning res
        return(
            res
            .status(200)
            .json(new ApiResponse(200,playlist,"Playlist name and description updated successfully "))
        )
    } catch (error) {
        throw new ApiError(400,`Error while updating playlist ${error}`)
    }
})



export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
