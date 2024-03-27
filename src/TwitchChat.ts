import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat";
import ManageableClass from "./ManageableClass";
import YoutubeClient from "./YoutubeClient";
import { VideoDetail } from "./YoutubeClient";
import { Duration } from "luxon";
import SongRequestManager from "./SongRequestManager";
import SongRequestError from "./SongRequestError";
import TwitchClient from "./TwitchClient";

export default class TwitchChat implements ManageableClass {
  private readonly COMMAND_PREFIX: string = "!";
  private readonly MIN_VIDEO_VIEWS: number = 18_000;
  private readonly MAX_VIDEO_DURATION_IN_SECONDS: number = 360;
  private chatClient!: ChatClient;
  private botName: string | undefined;

  public constructor(
    private readonly twitchChannel: string,
    private readonly authProvider: RefreshingAuthProvider,
    private readonly youtubeClient: YoutubeClient,
    private readonly songRequestManager: SongRequestManager,
    private readonly twitchClient: TwitchClient,
  ) {
    this.authProvider = authProvider;
    this.youtubeClient = youtubeClient;
    this.songRequestManager = songRequestManager;
  }

  public async init(): Promise<void> {
    console.log("Initializing the TwitchChat...");

    this.chatClient = new ChatClient({
      authProvider: this.authProvider,
      channels: [this.twitchChannel],
      webSocket: true,
      authIntents: ["chat"],
    });

    this.botName = await this.twitchClient.getChatbotUsername();

    this.setChatClientListeners();
    this.chatClient.connect();

    console.log("Initialized the TwitchChat!");
  }

  private setChatClientListeners(): void {
    this.chatClient.onDisconnect(() => {
      console.log("I have been disconnected from the chat :(");
    });

    this.chatClient.onJoin((channel: string, user: string) => {
      console.log("I have connected to the chat! :)");
      this.chatClient.say(channel, "I have connected to the chat! :)");
    });

    this.chatClient.onMessage(
      async (channel: string, user: string, text: string, msg: ChatMessage) => {
        text = text.trim();

        if (!text.startsWith(this.COMMAND_PREFIX) || user === this.botName)
          return;

        const [commandName, ...commandParameters] = text.split(" ");

        switch (commandName.toLowerCase()) {
          case `${this.COMMAND_PREFIX}hello`:
            this.chatClient.say(channel, `Hello @${user}`);
            break;
          case `${this.COMMAND_PREFIX}sr`:
            this.handleSrCommand(channel, user, commandParameters);
            break;
          case `${this.COMMAND_PREFIX}srskipsong`:
            this.songRequestManager.skipSong();
            break;
          case `${this.COMMAND_PREFIX}srpause`:
            this.songRequestManager.pauseSong();
            break;
          case `${this.COMMAND_PREFIX}srplay`:
            this.songRequestManager.playSong();
            break;
          default:
            break;
        }
      },
    );
  }

  private async handleSrCommand(
    channel: string,
    user: string,
    commandParameters: string[],
  ): Promise<void> {
    const songRequestParameters: string = commandParameters.join(" ");

    if (!songRequestParameters) {
      return;
    }

    try {
      let videoId: string | undefined;

      if (songRequestParameters.startsWith("https://www.youtube.com/watch")) {
        const regexpToSplitUrlParameters: RegExp = /[?=&]/;
        const splitVideoLink: string[] = songRequestParameters.split(
          regexpToSplitUrlParameters,
        );

        videoId =
          splitVideoLink[splitVideoLink.findIndex((v) => v === "v") + 1];
      } else {
        // TODO: sometimes even if a video exists it returns undefined
        videoId = await this.youtubeClient.getVideoIdByName(
          songRequestParameters,
        );
      }

      if (videoId === undefined)
        throw new SongRequestError("Sorry, but I Could not find your song :(");

      const songDetails: VideoDetail | undefined =
        await this.youtubeClient.getVideoDetailsById(videoId);

      if (songDetails === undefined)
        throw new SongRequestError("Sorry, but I cannot add this song :(");

      if (
        Number.parseInt(songDetails.statistics.viewCount) < this.MIN_VIDEO_VIEWS
      )
        throw new SongRequestError("Your song has not enough views!");

      const videoDurationInSeconds: number = Duration.fromISO(
        songDetails.contentDetails.duration,
      ).as("seconds");

      if (videoDurationInSeconds > this.MAX_VIDEO_DURATION_IN_SECONDS)
        throw new SongRequestError("Your song is too long :(");

       const positionInQueue: number = this.songRequestManager.addSongToQueue({
        videoId: videoId,
        title: songDetails.snippet.title,
        durationInSeconds: videoDurationInSeconds,
        addedBy: user
      });

      const songsDurationInSeconds: number = await this.songRequestManager.getDurationOfSongs();

      this.chatClient.say(
        channel,
        this.getMessageDetailsOfSuccessfullyAddedSong(songsDurationInSeconds, positionInQueue, songDetails.snippet.title)
      );

    } catch (e: unknown) {
      if (e instanceof SongRequestError) {
        this.chatClient.say(channel, e.message);
      } else if (e instanceof Error) {
        this.chatClient.say(channel, "Something is wrong with your song :|");
      }
    }
  }

  private getMessageDetailsOfSuccessfullyAddedSong(queueDuration: number, queuePosition: number, songTitle: string) {
    const hours = Math.floor(queueDuration / 3600);
    if(hours >= 1) {
      queueDuration %= 3600;
    }

    const minutes = Math.floor(queueDuration / 60);
    if(minutes >= 1) {
      queueDuration %= 60;
    }

    const seconds = queueDuration;

    let timeString: string[] = [];

    if(hours > 0) {
      if(hours === 1) {
        timeString.push("1 hour");
      } else {
        timeString.push(`${hours} hours`);
      }
    }
    
    if(minutes > 0) {
      if(minutes === 1) {
        timeString.push("1 minute");
      } else {
        timeString.push(`${minutes} minutes`)
      }
    }

    if(seconds > 0) {
      if(seconds === 1) {
        timeString.push("1 second")
      } else {
        timeString.push(`${seconds} seconds`)
      }
    }

    return `'${songTitle}' added to the queue at #${queuePosition} position! (playing in ~ ${timeString.join(" and ")})`;
  }
}
