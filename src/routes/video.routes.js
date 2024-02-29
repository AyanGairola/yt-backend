import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus, updateVideoDetails } from "../controllers/video.controller.js";


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
router.route("/:videoId").get(verifyJWT,getVideoById)
router.route("/update-video/:videoId").post(verifyJWT,upload.single("thumbnail"), updateVideoDetails)
router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo)
router.route("/toggle-publish-status/:videoId").post(verifyJWT,togglePublishStatus)



export default router