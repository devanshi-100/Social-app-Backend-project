import {v2 as cloudinary} from 'cloudinary'

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_API_KEY,
    api_key:process.env.CLOUDINARY_API_SECRET,
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
})

const UploadOnCloudinary = async (imagePath) => {
    try {
      if(!imagePath)return null
      const result = await cloudinary.uploader.upload(imagePath,{
        resource_type:"auto"
      });
      console.log("file has been uploaded",result.url);
      return result;
    } catch (error) {
        fs.unlinkSync(imagePath);
      console.error(error);
    }
};

export {UploadOnCloudinary}