import Playlist from "../models/playlist.model.js";
import Video from "../models/video.model.js"
import mongoose from "mongoose";
import { deleteFileCloudinary } from "../utils/cloudinary.js";

const getUserPlaylists = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const playlist = await Playlist.aggregatePaginate([
            {
                $match: {
                    $or: [
                        {
                            owner: new mongoose.Types.ObjectId(req.user._id)
                        },
                        {
                            savedBy: new mongoose.Types.ObjectId(req.user._id)
                        }
                    ]
                }
            }, {
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
                    }]
                }
            }, {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    let: {
                        "videoIds": "$videos"
                    },
                    pipeline: [{
                        $addFields: {
                            index: {
                                $indexOfArray: [
                                    "$$videoIds",
                                    "$_id"
                                ]
                            }
                        }
                    }, {
                        $sort: {
                            index: 1
                        }
                    }, {
                        $project: {
                            index: 0
                        }
                    }],
                    as: "video",
                }
            }, {
                $project: {
                    title: 1,
                    description: 1,
                    firstVideo: {
                        $first: "$video"
                    },
                    videosCount: {
                        $size: "$videos"
                    },
                    owner: 1,
                    publish: 1,
                    coverImage: 1,
                    createdAt: 1
                }
            }], {
            page: page,
            limit: limit
        })
        return res.status(200).json(playlist)
    }
    catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

const createPlaylist = async (req, res) => {
    try {
        const { title, description, video } = req.body
        if (!title) {
            return res.status(400).json('Title required')
        }
        const playlist = await Playlist.create({
            title: title,
            description: description || "",
            owner: req.user?._id,
            videos: video,
            coverImage: ""
        })
        return res.status(200).json(playlist)
    }
    catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

const saveStatusUpdate = async (req, res) => {
    try {
        const { id } = req.body
        const playlist = await Playlist.findById(id)
        if (!playlist) {
            return res.status(404).json("Not Found")
        }

        if (playlist.savedBy.includes(req.user._id)) {
            let index = playlist.savedBy.indexOf(req.user.id);
            playlist.savedBy.splice(index, 1)
        }
        else {
            playlist.savedBy.push(req.user._id)
        }
        await playlist.save({
            validateBeforeSave: false
        })
        return res.status(200).json(playlist.savedBy.includes(req.user._id))
    } catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

const deletePlaylist = async (req, res) => {
    try {
        const { id } = req.body
        const playlist = await Playlist.findByIdAndDelete(id)
        if (!playlist) {
            return res.status(404).json("Not Found")
        }
        if(playlist.coverImage.length){
        const coverImage = await playlist.coverImage.split("/")
        const coverImageName = await coverImage[coverImage.length - 1].split(".")[0]
        await deleteFileCloudinary(coverImageName, "image");
        }
        return res.status(200).json(playlist)
    } catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

const getPlaylistDetails = async (req, res) => {
    try {
        const { id } = req.params
        const playlist = await Playlist.aggregate([{
            $match: {
                _id: new mongoose.Types.ObjectId(id)
            }
        }, {
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
                }]
            }
        }, {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos",
                let: {
                    "videoIds": "$videos"
                },
                pipeline: [{
                    $addFields: {
                        index: {
                            $indexOfArray: [
                                "$$videoIds",
                                "$_id"
                            ]
                        }
                    }
                }, {
                    $sort: {
                        index: 1
                    }
                }, {
                    $project: {
                        index: 0
                    }
                }],
                as: "video",
            }
        }, {
            $project: {
                title: 1,
                description: 1,
                videos: 1,
                savedBy: 1,
                firstVideo: {
                    $first: "$video"
                },
                videosCount: {
                    $size: "$videos"
                },
                owner: 1,
                isSaved: {
                    $in: [
                        req.user._id,
                        {
                            $map: {
                                input: "$savedBy",
                                as: "by",
                                in: "$$by"
                            }
                        }
                    ]
                },
                publish: 1,
                coverImage: 1,
                videosUpdate: 1
            }
        }])
        if (!playlist[0]) {
            return res.status(404).json("Not Found")
        }
        return res.status(200).json(playlist[0]);
    } catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

const getPlaylistVideos = async (req, res) => {
    try {
        const { page, limit } = req.query
        const { id } = req.params
        const playlist = await Playlist.findById(id)
        if (!playlist) {
            return res.status(404).json("Not Found")
        }

        const getPlaylistDetails = new Array()
        for (const video of playlist.videos) {
            const findVideo = await Video.aggregate([{
                $match: {
                    _id: video
                }
            }, {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: 'owner',
                    as: "owner",
                    pipeline: [{
                        $project: {
                            username: 1
                        }
                    }]
                }
            }])
            getPlaylistDetails.push(findVideo)
        }
        // Pages Defines length of pages (its just copy not send) how many pages
        const pages = new Array(Math.ceil(getPlaylistDetails.length / limit))
        // iterate playlist item
        let k = 0;
        // Pages defines length of pages (its actual pages) how many pages
        const playlistVideos = new Array(pages.length);

        for (let i = 0; i < pages.length; i++) {
            // pages[i] defines length of page using limit how many items
            pages[i] = new Array(limit)
            // actual data initialiize
            playlistVideos[i] = new Array()
            for (let j = 0; j < limit; j++, k++) {
                // page[i][j] = item to checked undefined
                pages[i][j] = getPlaylistDetails[k]
                if (getPlaylistDetails[k]) {
                    //then videos[i] add item
                    playlistVideos[i].push(pages[i][j])
                }
            }
        }
        const data = {
            docs: playlistVideos[page - 1] || playlistVideos,
            totalDocs: getPlaylistDetails.length,
            hasNext: pages.length > page
        }
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

const addPlaylistVideo = async (req, res) => {
    try {
        const { videoId } = req.body
        const { id } = req.params
        const playlist = await Playlist.findById(id)
        if (!playlist) {
            return res.status(404).json("Not Found")
        }
        playlist.videos.push(videoId)
        await playlist.save({
            validateBeforeSave: false
        })
        return res.status(200).json(playlist)
    } catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

const updatePlaylist = async (req, res) => {
    try {
        const { id, title, description, coverImage } = req.body;
        let coverImageName;
        if (coverImage) {
            const coverImageUrl = await coverImage.split("/");
            coverImageName = await coverImageUrl[coverImageUrl.length - 1].split(".")[0];
        }
        const playlist = await Playlist.findById(id)
        if (!playlist) {
            if (coverImage) await deleteFileCloudinary(coverImageName, "image")
            return res.status(404).json('Not Found')
        }
        if (coverImage) {
            if (playlist.coverImage.length) {
                const coverImageFile = await playlist.coverImage.split("/");
                const coverImageName = await coverImageFile[coverImageFile.length - 1].split(".")[0]
                await deleteFileCloudinary(coverImageName, "image")
            }
            playlist.coverImage = coverImage;
        }
        if (title) {
            playlist.title = title
        }
        if (description) {
            playlist.description = description
        }
        await playlist.save({
            validateBeforeSave: false
        })
        res.status(200).json(playlist)
    } catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

const deleteVideo = async (req, res) => {
    try {
        const { videoId } = req.body
        const { id } = req.params
        const playlist = await Playlist.findById(id)

        if (!playlist) {
            return res.status(404).json("Not Found")
        }
        let index = playlist.videos.indexOf(videoId);
        playlist.videos.splice(index, 1)
        await playlist.save({
            validateBeforeSave: false
        })
        return res.status(200).json(playlist)
    } catch (err) {
        return res.status(500).json({
            err: err.message
        })
    }
}

export { getUserPlaylists, createPlaylist, saveStatusUpdate, deletePlaylist, getPlaylistDetails, getPlaylistVideos, addPlaylistVideo, updatePlaylist, deleteVideo }