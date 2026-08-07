import "../config.js";
import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"

// console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("API Key:", process.env.CLOUDINARY_API_KEY);
// console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET,
})

const UploadOnCloudinary = async (imagePath) => {
  try {
      if(!imagePath)return null
      const result = await cloudinary.uploader.upload(imagePath,{
        resource_type:"auto"
      });
      // console.log("file has been uploaded",result);
      fs.unlinkSync(imagePath);
      return result;
    } catch (error) {
      console.log("Cloudinary Error:", error);

      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      return null;
    }
};

export {UploadOnCloudinary}