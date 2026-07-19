import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      const extension = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`)
    }
  })
  
export const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024, files: 2 },
    fileFilter: (_req, file, cb) => {
      const expectedPrefix = file.fieldname === "videoFile" ? "video/" : "image/"
      if (!file.mimetype.startsWith(expectedPrefix)) return cb(new ApiError(400, `${file.fieldname} has an unsupported file type`))
      cb(null, true)
    }
})
