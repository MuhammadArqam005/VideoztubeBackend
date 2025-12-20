import { Router } from "express";
import { getSign } from "../utils/cloudinary.js";

const router = Router();
router.route("/").get(getSign)

export default router
