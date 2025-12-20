import mongoose,{Schema} from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"
import { type } from "os";

const commentSchema = new Schema({
   content : {
    type : String,
    required : true
   },
   onVideo : {
    type : Schema.Types.ObjectId,
    ref : "Video"
   },
   onComment : {
    type : Schema.Types.ObjectId,
    ref : "Comment"
   },
   commentBy : {
    type : Schema.Types.ObjectId,
    ref : "User"
   },
   delete : {
    type : Boolean,
    default : false
   }
},
{
    timestamps : true
})
commentSchema.plugin(aggregatePaginate)
const Comment = mongoose.model("Comment",commentSchema);
export default Comment;