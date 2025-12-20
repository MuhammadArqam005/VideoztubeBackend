import express from "express";
import cors from "cors"
import connectToMongo from "./db/db.js"
import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import subscribeRouter from "./routes/subscriber.route.js";
import likeRouter from "./routes/like.route.js";
import commentRouter from "./routes/comment.route.js";
import playlistRouter from "./routes/playlist.route.js";
import cookieParser from "cookie-parser";
import cloudinaryRouter from "./routes/cloudinary.route.js";

const app = express()
const port = 3000;
await connectToMongo()

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin : true,
  credentials : true
}))
app.use(cookieParser());
app.get("/",async(req,res)=>{
  res.send("Welcome to backend")
})

app.use('/api/v1/cloudinary',cloudinaryRouter)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/subscribe", subscribeRouter);
app.use("/api/v1/like", likeRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/playlist",playlistRouter)
app.listen(port, () => {
  console.log("Port listen on", port)
})
