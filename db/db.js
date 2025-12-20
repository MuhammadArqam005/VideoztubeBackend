import mongoose from "mongoose";
const mongoURI = "mongodb+srv://arqamahmed005_db_user:mongo005@cluster0.lugyapm.mongodb.net/Videotube"

const connectToMongo = async ()=>{
    try{
     await mongoose.connect(mongoURI);
}
    catch(err){
    console.log(err);
    }
}

export default connectToMongo;