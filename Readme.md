# VidTube API

VidTube is a REST API for a video-sharing platform. It provides JWT authentication, Cloudinary media uploads, video publishing, comments, likes, subscriptions, playlists, tweets, watch history and creator dashboard statistics.

## Features

- User registration, login, logout, token refresh, and password changes
- Access and refresh tokens through HTTP-only cookies or bearer tokens
- Avatar, cover image, thumbnail, and video uploads with Cloudinary
- Video search, sorting, pagination, publishing, editing, and deletion
- Watch history and view tracking
- Comments and likes for videos, comments, and tweets
- Channel subscriptions and subscriber lists
- User playlists with duplicate-safe video membership
- Creator statistics for videos, views, subscribers, and likes
- Consistent JSON responses, centralized error handling, upload limits, and graceful shutdown

## Technology

- Node.js and Express
- MongoDB and Mongoose
- Cloudinary
- Multer
- JSON Web Tokens
- bcrypt

## Requirements


- Node.js 20 or newer
- A MongoDB Atlas database (or another MongoDB deployment)
- A Cloudinary account


## Local setup

```bash
git clone <your-repository-url>
cd vidtube
npm install
```

Copy `.env.sample` to `.env`, then replace every placeholder with your own value.

```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/vidtube
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=replace-with-another-long-random-secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

The database name is already part of `MONGODB_URI`. Do not append another database name in the connection code.

Start development mode:

```bash
npm run dev
```

The API is available at `http://localhost:8000/api/v1`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start with Nodemon |
| `npm start` | Start in production mode |
| `npm run check` | Parse-check all JavaScript files |
| `npm test` | Run the Node.js test suite |

## Authentication

Protected routes accept either the `accessToken` HTTP-only cookie or this header:

```http
Authorization: Bearer <access-token>
```

For browser clients, make requests with credentials enabled. Configure `CORS_ORIGIN` as a comma-separated list when more than one frontend origin is allowed.

## API endpoints

### Health and users

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/healthcheck` | No | API health and uptime |
| POST | `/users/register` | No | Register with multipart form data |
| POST | `/users/login` | No | Login using email or username |
| POST | `/users/refresh-token` | No | Rotate access and refresh tokens |
| POST | `/users/logout` | Yes | Logout and invalidate refresh token |
| POST | `/users/change-password` | Yes | Change password |
| GET | `/users/current-user` | Yes | Get authenticated user |
| PATCH | `/users/update-account` | Yes | Update name and email |
| PATCH | `/users/avatar` | Yes | Replace avatar |
| PATCH | `/users/cover-image` | Yes | Replace cover image |
| GET | `/users/c/:username` | Yes | Get channel profile |
| GET | `/users/history` | Yes | Get watch history |

Registration uses `multipart/form-data` with the text fields `fullName`, `email`, `username`, and `password`; `avatar` is a required file and `coverImage` is optional.

### Videos

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/videos` | List published videos with pagination, search, and sorting |
| POST | `/videos` | Publish using `videoFile` and `thumbnail` multipart fields |
| GET | `/videos/:videoId` | Get a video and record a view/history entry |
| PATCH | `/videos/:videoId` | Update title, description, or thumbnail as owner |
| DELETE | `/videos/:videoId` | Delete video and related data as owner |
| PATCH | `/videos/toggle/publish/:videoId` | Toggle publish state as owner |

List query parameters: `page`, `limit`, `query`, `sortBy`, `sortType`, and `userId`.

### Social and creator resources

| Resource | Endpoints |
| --- | --- |
| Comments | `GET/POST /comments/:videoId`, `PATCH/DELETE /comments/c/:commentId` |
| Likes | `POST /likes/toggle/v/:videoId`, `/toggle/c/:commentId`, `/toggle/t/:tweetId`, `GET /likes/videos` |
| Tweets | `POST /tweets`, `GET /tweets/user/:userId`, `PATCH/DELETE /tweets/:tweetId` |
| Subscriptions | `GET/POST /subscriptions/c/:channelId`, `GET /subscriptions/u/:subscriberId` |
| Playlists | `POST /playlist`, `GET/PATCH/DELETE /playlist/:playlistId`, `PATCH /playlist/add/:videoId/:playlistId`, `PATCH /playlist/remove/:videoId/:playlistId`, `GET /playlist/user/:userId` |
| Dashboard | `GET /dashboard/stats`, `GET /dashboard/videos` |

All endpoints in this section require authentication.

## Response format

Successful responses follow this structure:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

Errors are returned as JSON with `success: false`. Stack traces are omitted when `NODE_ENV=production`.

## Production deployment

1. Set `NODE_ENV=production`.
2. Use long, independent random values for both token secrets.
3. Set `CORS_ORIGIN` to the deployed frontend origin; do not use `*` with credentialed requests.
4. Store all secrets in the hosting provider's environment configuration.
5. Allow the deployment host in MongoDB Atlas Network Access.
6. Run `npm run check && npm test` during CI, then start with `npm start`.
7. Put the service behind HTTPS so secure cross-site cookies work correctly.

Never commit `.env`. It is ignored by Git; only `.env.sample` should be committed.

## License

ISC
