import multer from "multer"
import fs from "node:fs"
import { ApiError } from "../utils/ApiError.js"

const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))

const errorHandler = (error, req, res, _next) => {
    const uploadedFiles = [req.file, ...Object.values(req.files || {}).flat()].filter(Boolean)
    for (const file of uploadedFiles) {
        if (file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path) } catch { /* Best-effort temporary file cleanup. */ }
        }
    }
    const statusCode = error instanceof multer.MulterError ? 400 : Number(error.statusCode) || 500
    const message = error instanceof multer.MulterError ? `Upload error: ${error.message}` : error.message || "Internal server error"
    return res.status(statusCode).json({ statusCode, data: null, message, success: false, errors: error.errors || [], ...(process.env.NODE_ENV !== "production" && { stack: error.stack }) })
}

export { errorHandler, notFound }
