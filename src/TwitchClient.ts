import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat";
import ManageableClass from "./ManageableClass";
import TokenUtil from "./TokenUtil";
import YoutubeClient from "./YoutubeClient";
import { VideoDetails } from "./YoutubeClient";
import { Duration } from "luxon";
import SongRequestManager from "./SongRequestManager";
import SongRequestError from "./SongRequestError";

export default class TwitchClient implements ManageableClass{
  private readonly COMMAND_PREFIX: string = "!";
  private readonly MIN_VIDEO_VIEWS: number = 18_000;
  private readonly MAX_VIDEO_DURATION_IN_SECONDS: number = 360;
  private chatClient!: ChatClient;
  private botName: string | undefined;
  private authProvider: RefreshingAuthProvider;
  private tokenUtil: TokenUtil;
  private youtubeClient: YoutubeClient;
  private songRequestManager: SongRequestManager;

  public constructor(private twitchChannel: string, authProvider: RefreshingAuthProvider, tokenUtil: TokenUtil, youtubeClient: YoutubeClient, songRequestManager: SongRequestManager) {
    this.authProvider = authProvider;
    this.tokenUtil = tokenUtil;
    this.youtubeClient = youtubeClient;
    this.songRequestManager = songRequestManager;
    this.chatClient = new ChatClient({
      authProvider: authProvider,
      channels: [twitchChannel],
      webSocket: true,
      authIntents: ["chatbot"]
    });
  }

  public async init(): Promise<void> {
    console.log("Initializing the TwitchClient...");
    
    this.botName = await this.tokenUtil.getUsernameByAccessToken((await this.authProvider.getAccessTokenForIntent("chatbot")) as AccessToken);

    if(this.botName === undefined) throw new Error("Could not fetch a chatbot's info")

    this.setChatClientListeners();
    this.chatClient.connect();
    console.log("Initilized the TwitchClient!");
  }

  private setChatClientListeners(): void {
    this.chatClient.onDisconnect(() => {
      console.log("I have been disconnected from the chat :(");
    })

    this.chatClient.onJoin((channel: string, user: string) => {
      console.log("I have connected to the chat! :)");
      this.chatClient.say(channel, "I have connected to the chat! :)");
    })

    this.chatClient.onMessage(async (channel: string, user: string, text: string, msg: ChatMessage) => {
        text = text.trim();
        if (!text.startsWith(this.COMMAND_PREFIX) || user === this.botName) return;

        const [commandName, ...commandParameters] = text.split(" ");

        switch (commandName.toLowerCase()) {
          case `${this.COMMAND_PREFIX}hello`:
            this.chatClient.say(channel, `Hello @${user}`);
            break;
          case `${this.COMMAND_PREFIX}sr`:
            const songRequestParameters: string = commandParameters.join(" ");

            if(!songRequestParameters) {
              return;
            }

            try {
              let videoId: string | undefined;
              
              if(songRequestParameters.startsWith("https://www.youtube.com/watch")) {
                const regexpToSplitUrlParameters: RegExp = /[?=&]/;
                const splitVideoLink: string[] = songRequestParameters.split(regexpToSplitUrlParameters);
                
                videoId = splitVideoLink[(splitVideoLink.findIndex((v) => v === "v") + 1)].trim();
              } else {
                videoId = await this.youtubeClient.getVideoIdByName(songRequestParameters);
              }

              if(videoId === undefined) throw new SongRequestError("Sorry, but I Could not find your song :(")

              const songDetails: VideoDetails | undefined = await this.youtubeClient.getVideoDetailsById(videoId);

              if(songDetails === undefined) throw new SongRequestError("Sorry, but I cannot add this song :(");

              if(Number.parseInt(songDetails.statistics.viewCount) < this.MIN_VIDEO_VIEWS) throw new SongRequestError("Your song has not enough views!");

              const videoDurationInSeconds: number = Duration.fromISO(songDetails.contentDetails.duration).as('seconds');

              if(videoDurationInSeconds > this.MAX_VIDEO_DURATION_IN_SECONDS) throw new SongRequestError("Your song is too long :(");

               const queueMetadata = this.songRequestManager.addSongToQueue({
                 videoId: videoId,
                 title: songDetails.snippet.title,
                 durationInSeconds: videoDurationInSeconds,
               });

               this.chatClient.say(channel,
                 `I have successfully added your song '${songDetails.snippet.title}' to the queue at #${queueMetadata.length} position!`
               );
             } catch (e: unknown) {
              if(e instanceof SongRequestError) {
                this.chatClient.say(channel, e.message)
              }
              else if(e instanceof Error) {
                this.chatClient.say(channel, "Something is wrong with your song :|");
              } 
            }
            break;
          default:
            break;
        }
      }
    );
  }
}
