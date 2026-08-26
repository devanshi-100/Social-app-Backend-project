import Router from 'express';
import {getVideoComment,addComment, deleteComment,updateComment} from '../controllers/comment.controller.js'
import { verifyJWT } from '../middlewares/Auth.middleware.js';

const commentRouter=Router();
commentRouter.route("/getVideoComment/:videoId").get(getVideoComment)
commentRouter.route("/addComment/:videoId").post(verifyJWT,addComment)
commentRouter.route("/deleteComment/:commentId").post(verifyJWT,deleteComment)
commentRouter.route("/updateComment/:commentId").post(verifyJWT,updateComment)


export {commentRouter};
