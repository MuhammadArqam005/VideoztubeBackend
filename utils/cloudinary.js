import { v2 as cloudinary } from "cloudinary"
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
})
 const getSign = async (req,res)=>{
  const timestamp = Math.floor(Date.now()/1000)
   const signature = cloudinary.utils.api_sign_request({timestamp},process.env.API_SECRET)
  return res.json({
    timestamp,
    signature,
    cloudName : process.env.CLOUD_NAME,
    apiKey : process.env.API_KEY
  })
 }

const deleteFileCloudinary = async (name, type) => {
  try {
    let response = await cloudinary.uploader.destroy(name, {
      resource_type: type
    });
    return response
  }
  catch (err) {
    return null
  }
}
export { getSign, deleteFileCloudinary };