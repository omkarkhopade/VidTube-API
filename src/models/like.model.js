import mongoose, {Schema} from "mongoose";


const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    
}, {timestamps: true})

likeSchema.index({ likedBy: 1, video: 1 }, { unique: true, partialFilterExpression: { video: { $type: "objectId" } } })
likeSchema.index({ likedBy: 1, comment: 1 }, { unique: true, partialFilterExpression: { comment: { $type: "objectId" } } })
likeSchema.index({ likedBy: 1, tweet: 1 }, { unique: true, partialFilterExpression: { tweet: { $type: "objectId" } } })

likeSchema.pre("validate", function (next) {
    const targets = [this.video, this.comment, this.tweet].filter(Boolean)
    if (targets.length !== 1) return next(new Error("A like must target exactly one resource"))
    next()
})

export const Like = mongoose.model("Like", likeSchema)
