# Youtube Backend

This project is a complex backend project that is built with nodejs, expressjs, mongodb, mongoose, jwt, bcrypt, and many more. This project is a complete backend project that has all the features that a backend project should have. I tried to build a complete video hosting website similar to youtube with all the features like login, signup, upload video, like, unlike, comment, subscribe, unsubscribe, and many more.

Project uses all standard practices like JWT, bcrypt, access tokens, refresh Tokens and many more.

Services used for storing the data- mongoDB and cloudinary

## Data Model

[Model](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

## Acknowledgements

- [Chai aur Code](https://www.youtube.com/@chaiaurcode)

## Lessons Learned

While working on this project, I practiced various backend logics, including data modelling, error handling, middlewares, RESTFul API , Authentication, dealing with database queries, etc.

One of the key learning points was understanding and applying MongoDB aggregate pipelines, which were new concepts to me.

I also learned how to maintain industry standard code which is readable and also got to know the importance of reusable code.

## API Routes

### For Users

- `/api/v1/users`

  -`/register`- POST - Registers an user

  -`/login`- POST - Logs in an user

  -`/logout`- POST - Logs out an user

  -`/change-password`- POST - Changes the password for the user

  -`/refresh-token`- POST - Generates new refresh token for the user

  -`/current-user`- GET - Gets the current user

  -`/watch-history`- GET - Gets the watch history of current user

  -`/channel/:username`- GET - Returns user channel profile

  -`/avatar`- PATCH - Updates the avatar of the user

  -`/cover-image`- PATCH - Updates the cover image of the user

  -`/update-account-details`- PATCH - Updates the account details of the user

### For Videos

- `/api/v1/videos`

  -`/publish-video`- POST - To upload the video

  -`/update-video/:videoId`- POST - Update video details(title, description and thumbnail)

  -`/toggle-publish-status/:videoId`- POST - Toggle the publish status of a video

  -`/get-all-videos`- GET - To fetch all videos of the user

  -`/:videoId`- GET - To fetch the video by video ID

  -`/delete-video/:videoId`- DELETE - To delete the video

### For Tweets

- `/api/v1/tweets`

  -`/`- POST - To create a tweet

  -`/user/:userId`- GET - To get user tweets

  -`/:tweetId`- GET - To update the tweet

  -`/:tweetId`- DELETE - To delete the tweet

### For Playlist

- `/api/v1/playlist`

  -`/:playlistId` - GET - To fetch the playlist
  -PATCH - To update the playlist
  -DELETE - To delete the playlist

  -`/add/:videoId/:playlistId`- PATCH - To add video to the playlist

  -`/remove/:videoId/:playlistId`- PATCH - To remove video from the playlist

  -`/user/:userId`- GET - To get user playlists

### For Comments

- `/api/v1/comments`

  -`/:videoId` - GET - To get video comments
  -POST - To comment onto a video

  -`/c/:commentId`- PATCH - To update the comment - DELETE- To delete the comment

### For Likes

- `/api/v1/likes`

  -`/toggle/v/:videoId`- POST - To toggle video like

  -`/toggle/c/:commentId`- POST - To toggle comment like

  -`/toggle/t/:tweetId`- POST - To toggle tweet like

  -`/videos`- GET - To get the liked videos of the logged in user

### For Subscription

- `/api/v1/subscriptions`

  -`/c/:channelId` - GET - To get Channel Subscribers
  -POST - To toggle subscription on the channel

  -`/u/:subscriberId`- GET - To get Subscribed channels

### For Dashboard

- `/api/v1/dashboard`

  -`/stats`- GET - To get channel stats(logged in)

  -`/videos`- GET - TTo get channel videos(logged in)

### For Health Check

- `/api/v1/healthcheck`

  -`/`- GET - Return OK Status

## Run Locally

Clone the project

```bash
  git clone https://github.com/AyanGairola/yt-backend.git
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```

## Documentation

[mongoose](https://mongoosejs.com/docs/guide.html)

[multer](https://www.npmjs.com/package/multer)

[jason web tokens](https://www.npmjs.com/package/jsonwebtoken)

[cloudinary](https://cloudinary.com/documentation/node_integration)

## Feedback

If you have any feedback, please reach out to me at ayangairola41@gmail.com
