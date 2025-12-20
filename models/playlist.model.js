import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"
const playlistSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    publish: {
        type: Boolean,
        default: false
    },
    savedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    coverImage: {
        type: String,
        required: true
    },
    videosUpdate: {
        type: Date,
    }
}, {
    timestamps: true
})
playlistSchema.pre('save', function (next) {
    if (this.isModified("videos")) {
        this.videosUpdate = new Date()
    }
    next()
})
playlistSchema.plugin(aggregatePaginate)
const playlist = mongoose.model("Playlist", playlistSchema);
export default playlist;