import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        await fs.promises.unlink(localFilePath).catch(() => {})
        return response;

    } catch (error) {
        await fs.promises.unlink(localFilePath).catch(() => {})
        return null;
    }
}

const deleteFromCloudinary = async (assetUrl, resourceType = "image") => {
    if (!assetUrl) return
    try {
        const url = new URL(assetUrl)
        const uploadIndex = url.pathname.indexOf("/upload/")
        if (uploadIndex === -1) return
        const assetPath = url.pathname.slice(uploadIndex + 8).replace(/^v\d+\//, "")
        const publicId = assetPath.replace(/\.[^/.]+$/, "")
        if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    } catch {
        // Asset cleanup should not make the API request fail.
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}
