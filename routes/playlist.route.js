import { Router } from "express";
import verifyJwt from "../middleware/verifyjwt.middleware.js";
import {getUserPlaylists, createPlaylist, getPlaylistDetails, addPlaylistVideo, saveStatusUpdate, deletePlaylist, updatePlaylist, deleteVideo, getPlaylistVideos } from "../controllers/playlist.controller.js";
const router = Router();
router.use(verifyJwt)

router.route('/')
.get(getUserPlaylists) // User Playlists
.post(createPlaylist) // User can create Playlist
.put(saveStatusUpdate) //Playlist Save and Unsave
.patch(updatePlaylist) // Update Playlist
.delete(deletePlaylist) // Delete Playlist
router.route("/:id")
.get(getPlaylistDetails) // Get particular playlist details
.post(addPlaylistVideo) // add video in particular playlist
.patch(getPlaylistVideos) // Get particular playlist videos
.delete(deleteVideo) // Delete Video
export default router