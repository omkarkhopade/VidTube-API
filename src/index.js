import "dotenv/config"
import connectDB from "./db/index.js"
import { app } from "./app.js"

const requiredEnvironmentVariables = [
    "MONGODB_URI",
    "ACCESS_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
]

const missingVariables = requiredEnvironmentVariables.filter((name) => !process.env[name])
if (missingVariables.length) throw new Error(`Missing environment variables: ${missingVariables.join(", ")}`)

const port = Number(process.env.PORT) || 8000
await connectDB()
const server = app.listen(port, () => console.log(`Server is running at port: ${port}`))

const shutdown = (signal) => {
    console.log(`${signal} received; shutting down`)
    server.close(() => process.exit(0))
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
