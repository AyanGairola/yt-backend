import { Router } from "express";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";
import { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus, updateVideoDetails } from "../controllers/video.controller";


const router=Router()

router.route("/publish-video").post(verifyJWT,
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    publishVideo
)


router.route("/get-all-videos").get(getAllVideos)
router.route("/video/:videoId").get(verifyJWT,getVideoById)
router.route("/update-video/:videoId").post(verifyJWT,updateVideoDetails)
router.route("/delete-video/:videoId").post(verifyJWT,deleteVideo)
router.route("/toggle-publish-status/:videoId").post(verifyJWT,togglePublishStatus)



export default router