import mongoose, { Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    fullName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
    },
    refreshToken: {
        type: String,
    }
}, {
    timestamps: true
});
userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
    next();
});
userSchema.methods.isPasswordCorrect = async function (password){
 return await bcrypt.compare(password,this.password);
}
userSchema.methods.generateRefreshToken = async  function (){
  return await jwt.sign({
    id : this._id,
    email : this.email,
    fullName : this.fullName,
    password : this.password
  },
  process.env.JWT_REFRESH_SECRET,
  {
    expiresIn : process.env.JWT_REFRESH_EXPIRY
  }
)
}
userSchema.methods.generateAccessToken = async function (){
  return await jwt.sign({
    id : this._id,
  },
  process.env.JWT_ACCESS_SECRET,
  {
    expiresIn : process.env.JWT_ACCESS_EXPIRY
  }
)
}

userSchema.plugin(aggregatePaginate)
const User = mongoose.model("User", userSchema);
export default User;