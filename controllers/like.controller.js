import Like from "../models/like.model.js";
const toggleLikeVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const likeVideo = await Like.findOneAndDelete({
            video: videoId,
            likedBy: req.user._id
        })
        if (!likeVideo) {
            const newLikeVideo = await Like.create({
                video: videoId,
                likedBy: req.user._id
            })
            return res.status(200).json({
                like : true
            });
        }
        return res.status(200).json({
            like : false
        });
    }
    catch (err) {
        res.status(500).json(err.message)
    }
}

const toggleLikeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const likeComment = await Like.findOneAndDelete({
            comment: commentId,
            likedBy: req.user._id
        })
        if (!likeComment) {
            const newLikeComment = await Like.create({
                comment: commentId,
                likedBy: req.user._id
            })
            return res.status(200).json({
                like : true
            });
        }
        return res.status(200).json({
            like : false
        });
    }
    catch (err) {
        res.status(500).json(err.message)
    }
}

const getUserLikedVideos = async (req, res) => {
    try {
        const getVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: req.user._id,
                    video : {
                        $exists : true
                    }
                }
            },
            {
                $lookup : {
                    from : "videos",
                    foreignField : "_id",
                    localField:"video",
                    as: "videos",
                    pipeline : [{
                        $project : {
                            thumbnail : 1,
                            title : 1,
                            duration : 1,
                            views:1
                        }
                    }]
                }
            },
            {
             $sort : {
                createdAt : -1
             }
            },
            {
                $project : {
                    videos : 1
                }
            }
        ])

        return res.status(200).json(getVideos)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
}

export { toggleLikeVideo, toggleLikeComment,getUserLikedVideos };