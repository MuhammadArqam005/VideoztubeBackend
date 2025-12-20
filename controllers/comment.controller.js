import Comment from "../models/comment.model.js";
import mongoose from "mongoose";

const getComments = async (req, res) => {
    try {
        const { videoId } = req.params;
        const getVideoComments = await Comment.aggregatePaginate([
            {
                $match: {
                    onVideo: new mongoose.Types.ObjectId(videoId),
                    delete : false
                }
            }, {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "commentBy",
                    as: "commenter",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            }, {
                $addFields: {
                    ownComment: {
                        $in: [
                            req.user._id, {
                                $map: {
                                    input: "$commenter",
                                    as: "comm",
                                    in: "$$comm._id"
                                }
                            }
                        ]
                    }
                }
            }, {
                $lookup: {
                    from: "comments",
                    foreignField: 'onComment',
                    localField: '_id',
                    as: "reply"
                }
            },
            {
                $addFields: {
                    replies: {
                        $size: "$reply"
                    }
                }
            },
            {
                $lookup: {
                    from: "likes",
                    foreignField: "comment",
                    localField: "_id",
                    as: 'likes'
                }
            }, {
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
                    commenter: 1,
                    content: 1,
                    createdAt: 1,
                    liked: 1,
                    likesCount: 1,
                    ownComment: 1,
                    replies: 1
                }
            },
            {
                $sort: {
                    ownComment: -1,
                    createdAt: -1
                }
            }
        ], {
            page: req.query.page,
            limit: req.query.limit
        })
        
        return res.status(200).json(getVideoComments)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
}

const addComment = async (req, res) => {
    try {
        const { videoId } = req.params;
        const { comment } = req.body;
        if (!comment) {
            return res.status(400).json("Invalid Credentials")
        }

        const userComment = await Comment.create({
            content: comment,
            onVideo: videoId,
            commentBy: req.user._id
        })
        const newId = await userComment._id
        const newComment = await Comment.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(newId)
                }
            }, {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "commentBy",
                    as: "commenter",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            }, {
                $addFields: {
                    ownComment: {
                        $in: [
                            req.user._id, {
                                $map: {
                                    input: "$commenter",
                                    as: "comm",
                                    in: "$$comm._id"
                                }
                            }
                        ]
                    }
                }
            }
        ])
        return res.status(200).json(newComment)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
}
const getReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        
        const getCommentReplies = await Comment.aggregatePaginate([
            {
                $match: {
                    onComment: new mongoose.Types.ObjectId(commentId),
                    delete : false
                }
            }, {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "commentBy",
                    as: "commenter",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            }, {
                $addFields: {
                    ownComment: {
                        $in: [
                            req.user._id, {
                                $map: {
                                    input: "$commenter",
                                    as: "comm",
                                    in: "$$comm._id"
                                }
                            }
                        ]
                    }
                }
            }, {
                $lookup: {
                    from: "comments",
                    foreignField: 'onComment',
                    localField: '_id',
                    as: "reply"
                }
            },
            {
                $addFields: {
                    replies: {
                        $size: "$reply"
                    }
                }
            }, {
                $lookup: {
                    from: "likes",
                    foreignField: "comment",
                    localField: "_id",
                    as: 'likes'
                }
            }, {
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
                    commenter: 1,
                    content: 1,
                    createdAt: 1,
                    liked: 1,
                    likesCount: 1,
                    ownComment: 1,
                    replies: 1

                }
            },
            {
                $sort: {
                    ownComment: -1,
                    createdAt: -1
                }
            }
        ], {
            page: req.query.page,
            limit: req.query.limit
        })
        if (getCommentReplies.length < 1) {
            return res.status(200).json("No comments")
        }
        return res.status(200).json(getCommentReplies)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
}
const addReply = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reply } = req.body;
        if (!reply) {
            return res.status(400).json("Invalid Credentials")
        }

        const userComment = await Comment.create({
            content: reply,
            onComment: commentId,
            commentBy: req.user._id
        })
        const newId = await userComment._id
        const newComment = await Comment.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(newId)
                }
            }, {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "commentBy",
                    as: "commenter",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            }, {
                $addFields: {
                    ownComment: {
                        $in: [
                            req.user._id, {
                                $map: {
                                    input: "$commenter",
                                    as: "comm",
                                    in: "$$comm._id"
                                }
                            }
                        ]
                    }
                }
            }
        ])
        return res.status(200).json(newComment)
    }
    catch (err) {
        return res.status(500).json(err.message)
    }
}

const updateComment = async (req, res) => {
    try {
        const { comment } = req.body;
        if (!comment) {
            return res.status(400).json("Invalid Credentials")
        }
        const { commentId } = req.params;
        const updateComment = await Comment.findByIdAndUpdate(commentId, {
            $set: {
                content: comment
            }
        }, {
            new: true
        })

        return res.status(200).json(updateComment)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
};

const ifRepliesDel = async (id)=>{
    const replies = await Comment.find({
        onComment : id 
    });
    if(replies){
        for(let i=0;i<replies.length;i++){
            const deleteComment = await Comment.findById(replies[i]);
            deleteComment.delete = true;
            await deleteComment.save({
                validateBeforeSave : false
            })
        await ifRepliesDel(replies[i]._id);
      }
    }
}

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        
        const deleteComment = await Comment.findById(commentId);
        deleteComment.delete = true;
        await deleteComment.save({
            validateBeforeSave : false
        })
        await ifRepliesDel(deleteComment._id)
        const deleteTrueComment = await Comment.deleteMany({
            delete : true
        })

        
        
       
        return res.status(200).json(deleteComment)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
};

export { addComment, getComments, updateComment, deleteComment, addReply, getReplies }