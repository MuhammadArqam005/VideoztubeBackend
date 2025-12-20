import { toggleLikeVideo,toggleLikeComment, getUserLikedVideos } from "../controllers/like.controller.js";
import { Router } from "express";
import verifyJwt from "../middleware/verifyjwt.middleware.js";

const router = Router();
router.use(verifyJwt);
router.route("/togglelike/v/:videoId").post(toggleLikeVideo); // toggle video like button
router.route("/togglelike/c/:commentId").post(toggleLikeComment); // toggle comment like button
router.route("/videos").get(getUserLikedVideos) // get user liked videos
export default router;
