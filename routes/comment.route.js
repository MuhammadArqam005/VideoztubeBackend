import { addComment,addReply,deleteComment,getComments, getReplies, updateComment } from "../controllers/comment.controller.js";
import verifyJwt from "../middleware/verifyjwt.middleware.js";
import { Router } from "express";
const router = Router();
router.use(verifyJwt)
router.route("/:videoId")
.get(getComments) // fetch video comments
.post(addComment); // add comments on video
router.route("/c/:commentId")
.get(getReplies) // fetch comment replies
.post(addReply) // add replies on comment
.put(updateComment) // update comment
.delete(deleteComment) // delete comment
export default router;