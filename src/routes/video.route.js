import { Router } from "express";
import {getAllVideos,publishAVideo,getVideoById,updateVideo,deleteVideo,togglePublishStatus} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const videoRouter=Router();

videoRouter.route("/").get(getAllVideos);

videoRouter.route("/publishAVideo").post(
    verifyJWT,
    upload.fields([
        {
            name:"videoFile",
            maxCount:1,
        },
        {
            name:"thumbnail",
            maxCount:1,
        }
    ]),
    publishAVideo
);

videoRouter.route("/getVideoById/:videoId").get(getVideoById);

videoRouter.route("/updateVideo/:videoId").patch(verifyJWT,
    upload.fields([
    {
        name:"videoFile",
        maxCount:1,
    },
    {
        name:"thumbnail",
        maxCount:1,
    }
]),updateVideo);

videoRouter.route("/deleteVideo/:videoId").delete(verifyJWT,deleteVideo);
videoRouter.route("/togglePublishStatus/:videoId").patch(verifyJWT,togglePublishStatus);

export {videoRouter}