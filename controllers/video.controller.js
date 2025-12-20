import mongoose from "mongoose";
import User from "../models/user.model.js";
import Video from "../models/video.model.js";
import playlist from "../models/playlist.model.js";
import { deleteFileCloudinary } from "../utils/cloudinary.js";
const publishVideo = async (req, res) => {
    try {
        const { title, description, video, thumbnail, duration } = req.body;
        let videoName;
        if (video) {
            const videoUrl = await video.split("/");
            videoName = await videoUrl[videoUrl.length - 1].split(".")[0];
        }
        let thumbnailName;
        if (thumbnail) {
            const thumbnailUrl = await thumbnail.split("/");
            thumbnailName = await thumbnailUrl[thumbnailUrl.length - 1].split(".")[0];
        }

        if (!title || !description) {
            if (video) await deleteFileCloudinary(videoName, "image");
            if (thumbnail) await deleteFileCloudinary(thumbnailName, "image")
            return res.status(400).json("Invalid credentials");
        }
        if (!video || !thumbnail) {
            if (video) await deleteFileCloudinary(videoName, "image");
            if (thumbnail) await deleteFileCloudinary(thumbnailName, "image")
            return res.status(400).json({
                err: "video and Thumbnail both are required"
            })
        }
        const createVideo = await Video.create({
            videoFile: video,
            thumbnailFile: thumbnail,
            title,
            description,
            duration: duration,
            owner: req.user?._id
        })
        return res.status(200).json({
            createVideo
        })
    }
    catch (err) {
        res.status(500).json({
            err: "Error"
        })
    }
}
const getVideos = async (req, res) => {
    const videos = await Video.aggregatePaginate([
        {
            $match: {
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
                pipeline: [{
                    $project: {
                        username: 1,
                        avatar: 1
                    }
                }
                ]
            },
        },
        {
            $sort: {
                views: -1
            }
        }
    ], {
        page: req.query.page,
        limit: req.query.limit,
    })
    res.send(videos);
}
const watchVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await Video.aggregate([{
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers",
                        },
                    },
                    {
                        $addFields: {
                            isSubscribe: {
                                $in: [
                                    req.user._id,
                                    {
                                        $map: {
                                            input: "$subscribers",
                                            as: "sub",
                                            in: "$$sub.subscriber"
                                        }
                                    }
                                ]
                            },
                            subscribersCount: {
                                $size: "$subscribers"
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribe: 1
                        }
                    }
                ]
            },
        },
        {
            $lookup: {
                from: "likes",
                foreignField: "video",
                localField: "_id",
                as: "likes"
            },
        },
        {
            $addFields: {
                liked: {
                    $in: [
                        req.user._id, {
                            $map: {
                                input: "$likes",
                                as: "like",
                                in: "$$like.likedBy"
                            }
                        }
                    ]
                },
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                createdAt: 1,
                description: 1,
                duration: 1,
                title: 1,
                owner: 1,
                views: 1,
                thumbnailFile: 1,
                videoFile: 1,
                liked: 1,
                likesCount: 1
            }
        }

        ])
        if (video.length < 1) {
            return res.status(404).json("Not Found")
        }
        const findUserHistory = await User.findOneAndUpdate({
            _id: req.user._id,
            watchHistory: videoId
        })
        if (findUserHistory) {
            return res.status(200).json(video[0])
        }
        const user = await User.findById(req.user._id);
        user.watchHistory = user.watchHistory.concat(videoId);
        await user.save({
            validationBeforeSave: false
        });
        return res.status(200).json(video[0])
    }
    catch (err) {
        res.status(400).json(err.message)
    }
}

const addView = async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findByIdAndUpdate({
        _id: videoId
    }, {
        $inc: {
            views: 1
        }
    }, {
        new: true
    })
    res.status(200).json(video.views)
}
const getChannelVideos = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;
        const videos = await Video.aggregatePaginate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(id)
                }
            }
        ], {
            page: page,
            limit: limit
        })
        return res.status(200).json(videos)
    }
    catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}
const getVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await Video.aggregate([{
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: 'owner',
                pipeline: [{
                    $project: {
                        username: 1,
                    }
                }]
            }
        }])
        if (!video) {
            return res.status(404).json("Not Found")
        }
        return res.status(200).json(video)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
}
const deleteVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await Video.findByIdAndDelete(videoId);
        if (!video) {
            return res.status(404).json("Not Found")
        }
        const videoFile = await video.videoFile.split("/")
        const videoName = await videoFile[videoFile.length - 1].split(".")[0]
        const thumbnailFile = await video.thumbnailFile.split("/");
        const thumbnailName = await thumbnailFile[thumbnailFile.length - 1].split(".")[0]

        const deletedVideo = await deleteFileCloudinary(videoName, "video");
        const deletedThumbnail = await deleteFileCloudinary(thumbnailName, "image")
        if (deletedVideo.result != 'ok' || deletedThumbnail.result != 'ok') {
            return res.status(404).json("not Possible")
        }

        return res.status(200).json("ok")

    }
    catch (err) {
        res.status(500).json(err.message)
    }
}
const updateVideo = async (req, res) => {
    try {

        const { videoId } = req.params;
        const { title, description, newThumbnail } = req.body;
        let newThumbnailName;
        if (newThumbnail) {
            const newThumbnailUrl = await newThumbnail.split("/");
            newThumbnailName = await newThumbnailUrl[newThumbnailUrl.length - 1].split(".")[0];
        }
        const video = await Video.findById(videoId)
        if (!video) {
            if (newThumbnail) await deleteFileCloudinary(newThumbnailName, "image")
            return res.status(404).json("Not Found")
        }
        if (newThumbnail) {
            const thumbnailFile = await video.thumbnailFile.split("/");
            const thumbnailName = await thumbnailFile[thumbnailFile.length - 1].split(".")[0]
            const deletedThumbnail = await deleteFileCloudinary(thumbnailName, "image")
            if (deletedThumbnail.result == 'ok') {
                video.thumbnailFile = newThumbnail;
            }
        }
        if (title) {
            video.title = title;
        }
        if (description) {
            video.description = description
        }
        await video.save({
            validationBeforeSave: false
        })
        return res.status(200).json(video)
    }
    catch (err) {
        res.status(404).json(err.message)
    }
}

const togglePublishBtn = async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(400).json("Not Found");
        }
        const toggleBtn = !video.isPublished
        video.isPublished = toggleBtn;
        await video.save({
            validationBeforeSave: false
        })
        return res.status(200).json("Published" ? toggleBtn : "Not Published")
    }
    catch (err) {
        res.status(400).json(err.message)
    }
}

const getSavedPlaylist = async (req, res) => {
    try {
        const { videoId } = req.params;
        const playlists = await playlist.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id)
                }
            },{
            $lookup : {
                from : "videos",
                foreignField : "_id",
                localField : "videos",
                let : {
                    "videoIds" : "$videos"
                },
                pipeline :[{
                    $addFields : {
                        index : {
                            $indexOfArray : [
                                "$$videoIds",
                                "$_id"
                            ]
                        }
                    }
                },{
                    $sort : {
                        index : 1
                    }
                },{
                    $project :{
                        index : 0
                    }
                }],
                as : "video",
            }
        }, {
                $addFields: {
                    isVideoSaved: {
                        $in: [
                            new mongoose.Types.ObjectId(videoId), {
                                $map: {
                                    input: "$videos",
                                    as: "video",
                                    in: "$$video"
                                }
                            }

                        ]

                    }
                }
            },{
                $project  : {
                    coverImage : 1,
                    title : 1,
                    isVideoSaved : 1,
                    firstVideo : {
                        $first : "$video"
                    } 
                }
            }
        ])
        return res.status(200).json(playlists);
    }
    catch (err) {
        return res.status(500).json({ err: err.message })
    }
}

export { publishVideo, getVideos, getVideo, deleteVideo, updateVideo, togglePublishBtn, watchVideo, addView, getChannelVideos, getSavedPlaylist }