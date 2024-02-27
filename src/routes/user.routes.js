import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessTokenEndPoint, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secured routes(user is logged in)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessTokenEndPoint)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/watch-history").get(verifyJWT, getWatchHistory)



router.route("/avatar").patch(verifyJWT, upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"),updateUserCoverImage)

//for params
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile)


export default router