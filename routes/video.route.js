import { addView, deleteVideo, getChannelVideos, getSavedPlaylist, getVideo, getVideos, publishVideo, togglePublishBtn, updateVideo, watchVideo } from "../controllers/video.controller.js";
import { Router } from "express";
import verifyJwt from "../middleware/verifyjwt.middleware.js";

const router = Router();
router.use(verifyJwt)
router.route("/")
    .get(getVideos) // fetched all videos 
    .post(publishVideo); // post a new video

router.route("/watch/:videoId")
    .get(watchVideo) // watch a video
    .post(addView) // added a view when user watched a video
    .patch(getSavedPlaylist)
router.route("/channel/:id").get(getChannelVideos) // get specific channel videos
router.route("/:videoId")
    .get(getVideo) // get edit video
    .delete(deleteVideo) // delete that video
    .put(updateVideo) // update thumbnail ,title or description 
router.route("/toggle/publish/:videoId").put(togglePublishBtn) // toggle publish status
export default router