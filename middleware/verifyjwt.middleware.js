import jwt from "jsonwebtoken"
import User from "../models/user.model.js";
const verifyJwt = async (req, res,next) => {
    try{
    const token = req.cookies?.accesstoken ||  req.header("Cookies")?.replace("accesstoken=","")?.split("; refreshtoken=")?.[0]
    if (!token) {
        return res.status(400).json({
            err: "Unauthorized request"
        })
    }
    const verifyUser = await jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(verifyUser.id).select("-password -refreshToken");
    if (!user) {
        return res.status(400).json({
            err: "Invalid Token"
        })
    }
    req.user = user;
    next(); }
    catch(err){
        res.status(401).json({
            err : err.message 
        })
    }
}

export default verifyJwt