import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";

const registerUser=asyncHandler(async (req,res)=>{
    /* 
    1-get user details
    2-validate the data
    3-check for images, check for avatar
    4-upload them on cloudinary
    5-check if user already exists or not
    6-store the data in mongo
    7- give feedback to the user-return response(remove pass and responseToken)
    */


    //taking user details
    const {username,email,fullName,password}=req.body
    console.log("user:",username);



    //validating the data
    const requiredFields = ["username", "email", "fullName", "password"];
    requiredFields.forEach(field => {
        if (req.body[field]==="") {
            throw new ApiError(400, `${field} is required`);
        }
    });
    console.log("Validation complete");


    //checking for images and avatar
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar1 image is required")
    }

    
    //uploading on cloudinary
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar2 image is required")
    }



    //checking if user exists or not
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User already exists")
    }


    //storing data in database
    const user= await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""

    })

    //removing password and refresh tokens from response
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    //final check- if user has been registered or not
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }


    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Created Successfully")
    )


})


const generateAccessAndRefreshTokens= async(userId)=>{
    try {
        const user=await User.findById(userId)
        const refreshToken=user.generateRefreshToken()
        const accessToken=user.generateAccessToken()

        user.refreshToken=refreshToken

        await user.save({validateBeforeSave:false}) // yaha validation ki zarurat nhi h kyuki hum refresh token add karrhae h, we used it because it asks for required terms while saving in the database

        return {accessToken,refreshToken} 

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
    }
}


const loginUser=asyncHandler(async(req,res)=>{
    /*
    1- req.body se data 
    2- check if user is registered or not
    3- validate the username and password form th database
    4- access and refresh token to user
    5- login the user
    */


    // Taking data from req.body
    
    const {username,email,password}=req.body
    if (!(username || email)) {
        throw new ApiError(400,"Username or email is required")
    }

    // checking if user is registered or not
    
    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if (!user) {
        throw new ApiError(404,"User is not registered")
    }


    // checking the password
    const isPasswordValid=await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401,"Incorrect Password")
    }


    //refresh and access tokens and sending them to cookies

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id) // interacting with the database "can" take time

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    //returning the response
    return (
        res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user:loggedInUser,refreshToken,accessToken
                },
                "User logged in successfully"
            )
        )
        )


})


const logoutUser=asyncHandler(async(req,res)=>{
    //use auth middleware to access the user (hum form wapis se nahi bharwayenge unlike previous steps)
    
    //removing refresh token from database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
    )

    // clearing cookies
    const options={
        httpOnly:true,
        secure:true
    }

    return (
        res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        )
        )



})

const refreshAccessTokenEndPoint=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized Request")

    }

    //verifying incoming access token
    const decodedToken=jwt.verify(token,process.env.REFRESH_TOKEN_SECRET)

    const user=await User.findById(decodedToken._id)
    if (!user) {
        throw new ApiError(401,"Invalid refresh token")
    }

    if (incomingRefreshToken != user?.refreshToken) {
        throw new ApiError(401,"Expired or used refresh token")
    }

    // generating new refresh token
    
    const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id)

    //returning response
    const options={
        httpOnly:true,
        secure:true
    }

    return(
        res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,newRefreshToken
                },
                "Token refreshed successfully"
            )
        )
    )

})


const changeCurrentPassword=asyncHandler(async(req,res)=>{

    const {oldPassword,newPassword,confirmPassword}=req.body
    const user=await User.findById(req.user?._id)

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Old Password entered is wrong")
    }

    if(newPassword!=confirmPassword){
        throw new ApiError(400,"Confirm password does not match the new password")
    }

    user.password=newPassword
    user.save({validateBeforeSave:false})

    return (
        res
        .status(200)
        .json(new ApiResponse(200,{},"Password changed successfully"))
    )
})


const getCurrentUser=asyncHandler(async(req,res)=>{
    return(
        res
        .status(200)
        .json(new ApiResponse(200,req.user,"current user retrieved successfully "))
    )
})


const updateAccountDetails=asyncHandler(async(req,res)=>{
    const{fullName,email}=req.body

    if(!(fullName || email)){
        throw new ApiError(400,"Email or FullName is needed")
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName: fullName,
                email: email
            }
        },
        {
            new:true
        }
        ).select("-password")
    
    return (
        res
        .status(200)
        .json(new ApiResponse(200),user,"Account Details updated successfully")
    )
    

})


const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is not uploaded")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400,"Avatar not uploaded on cloudinary")
    }

    const user=await User.findById(req.user?._id)
    user.avatar=avatar.url

    return (
        res
        .status(200)
        .json(new ApiResponse(200),user,"Avatar updated successfully")
    )

})


const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is not uploaded")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400,"Cover Image not uploaded on cloudinary")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}).select("-password")
    

    return (
        res
        .status(200)
        .json(new ApiResponse(200),user,"Cover Image updated successfully")
    )

})



const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if (!(username?.trim())) {
        throw new ApiError(400,"Username from params is missing")
    }


    const channel= await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",     //db mai lower case mai convert hojati h, Subscription model
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{        // frontend true false milega ki sub h ya nhi
                    if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false
                }
                
                
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                avatar:1,
                coverImage: 1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1


            }
        }
    ])

    console.log(channel);

    if (channel?.length=="") {
        throw new ApiError(400,"Channel is not fetched")
    }


    return(
        res.status(200)
        .json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
    )
})



const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos", //Video model
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",   //yaha pe pura user object aagya h woh hume nhi chiye so we use another pipeline
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})




export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessTokenEndPoint, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
