# Twitch bot

This repository contains only the back-end code of my chatbot to Twitch.tv(<3). The code of the chatbot can seriously change, because I'm still (sometimes :/) working on it ;)

I wrote this chatbot for alerts, but eventually I ended up mainly implementing a song request. This chatbot has commands like:

```
!srplay
!srpause
!skipsong
!volume
!song
!mysong
!srq
!sr
!wrongsong
```
You can easily change the prefix and the command names.
The prefix in the [TwitchChat](https://github.com/danielbukowski/twitch-bot-back-end/blob/main/src/TwitchChat.ts) class and the names in the [SongRequestManager](https://github.com/danielbukowski/twitch-bot-back-end/blob/main/src/SongRequestManager.ts) class.


## Environment Variables

The project requires the following environment variables in your .env file!

`TWITCH_APP_CLIENT_ID`

`TWITCH_APP_CLIENT_SECRET`

`HTTP_SERVER_PORT`

`YOUTUBE_API_KEY`

`ENCRYPTION_PASSPHRASE`

`OAUTH2_REDIRECT_URI`

`FRONTEND_ORIGIN`

## License

[MIT](https://github.com/danielbukowski/twitch-bot-back-end/blob/main/LICENSE)

