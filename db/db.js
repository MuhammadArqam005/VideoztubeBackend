import mongoose from "mongoose";
const mongoURI = process.env.MONGO_URI

const connectToMongo = async ()=>{
    try{
     await mongoose.connect(mongoURI);
}
    catch(err){
    console.log(err);
    }
}

export default connectToMongo;
