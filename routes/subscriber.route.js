import verifyJwt from "../middleware/verifyjwt.middleware.js";
import { toggleSubscribeBtn } from "../controllers/subscriber.controller.js";

import { Router } from "express";

const router = Router();
router.use(verifyJwt)
router.route("/c/togglesubscribe/:id").post(toggleSubscribeBtn); // toggle channel subscription

export default router;