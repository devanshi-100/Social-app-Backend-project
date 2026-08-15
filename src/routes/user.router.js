import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken, updateAccountDetails, changeCurrentPassword, updateUserCoverImage, updateUserAvatar, getUserProfile, getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
const userRouter=Router();

userRouter.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),
    registerUser
);
userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/updateAccountDetails").patch(verifyJWT,updateAccountDetails)
userRouter.route("/changePassword").post(verifyJWT,changeCurrentPassword)
userRouter.route("/refreshAccessToken").post(refreshAccessToken)
userRouter.route("/updateAvatarImage").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)
userRouter.route("/updateCoverImage").patch(
    verifyJWT,
    upload.fields([
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),
    updateUserCoverImage
)
userRouter.route("/c/:username").post(verifyJWT,getUserProfile);
userRouter.route("/getWatchHistory").post(verifyJWT,getWatchHistory);


export {userRouter};