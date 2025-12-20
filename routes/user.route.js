import  { Router } from "express";
import {registerUser,login,logout, getUserDetails, getWatchHistory, channelUpdate, changePassword, deleteCoverImage, getEditProfile} from "../controllers/user.controller.js";
import verifyJwt from "../middleware/verifyjwt.middleware.js";
const router = Router();
router.route("/register").post(registerUser); // register a user
router.route("/login").post(login) // login a user
router.route("/logout").post(verifyJwt,logout) //logout a user

router.route("/getuser/:username").get(verifyJwt,getUserDetails) // get user
router.route("/editprofile/:id").get(verifyJwt,getEditProfile) // get edit profile 
.post(verifyJwt,channelUpdate) // post request for avatar,coverImage,username and fullname update
.put(verifyJwt,changePassword)//put request for password update 
.delete(verifyJwt,deleteCoverImage)// delete request for cover image delete 
router.route("/watchhistory").get(verifyJwt,getWatchHistory) // get user watch history videos
export default router;