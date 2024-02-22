import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export {registerUser}
