import { Server as SocketIO } from "socket.io";
import ManageableClass from "./ManageableClass";
import YoutubeClient from "./YoutubeClient";

export interface Song {
  videoId: string;
  title: string;
  durationInSeconds: number;
  addedBy: string;
}

export default class SongRequestManager implements ManageableClass {
  private songQueue: Song[] = [];

  constructor(
    private readonly youTubeClient: YoutubeClient,
    private readonly socketIO: SocketIO,
  ) {}

  async init(): Promise<void> {
    console.log("Initializing the SongRequestClient...");

    this.socketIO.of("/song-request").on("connection", (socket) => {
      socket.on("request-from-frontend", (request: {
        type: string
      }) => {
        switch(request.type) {
          case "GET_NEXT_SONG":
            this.sendSongFromQueue();
            break;
          default:
            break;
        }
      });
    });

    console.log("Initialized the SongRequestClient!");
  }

  public addSongToQueue(song: Song): number {
    return this.songQueue.push(song);
  }

  public playSong(): void {
      this.socketIO.of("/song-request").emit("song-request-message", {
        type: "PLAY"
      });
  }

  public pauseSong(): void {
      this.socketIO.of("/song-request").emit("song-request-message", {
        type: "PAUSE"
      });
    }
  
  public skipSong(): void {
    this.socketIO.of("/song-request").emit("song-request-message", {
      type: "SKIP_SONG"
    });
  }

  public changeSongVolume(volumeValue: string): void {
    this.socketIO.of("/song-request").emit("song-request-message", {
      type: "CHANGE_VOLUME",
      volumeValue
    })
  }

  public getFirstNSongsFromQueue(n: number): Song[] {
    return this.songQueue.slice(0, n);
  }
  
  private async getDurationOfCurrentPlayingSong(): Promise<number> {
    try {
      const sockets = await this.socketIO.of("/song-request").fetchSockets();

      const response: {
        durationInSeconds: number
      } = await sockets[0].timeout(1400).emitWithAck("song-request-message", {
        type: "SONG_DURATION"
      });

      return response.durationInSeconds;
    } catch (e: unknown) {
      return 0;
    }
  }

  public async getDurationOfSongs(): Promise<number> {
    let queueDurationInSeconds: number = this.songQueue
    .map(s => s.durationInSeconds)
    .reduce((acc, s) => acc + s, 0);

    queueDurationInSeconds += (await this.getDurationOfCurrentPlayingSong());

    return queueDurationInSeconds;
  }

  public async sendSongFromQueue(): Promise<void> {
      const song: Song | undefined = this.removeSongFromQueue();
      if(!song) return;

      const audioData: string | undefined = await this.youTubeClient.downloadYouTubeAudio(song.videoId);
      if(!audioData) return;

      this.socketIO.of("/song-request").emit("song-request-message", {
          type: "PLAY_NEXT_SONG",
          data: {
            title: song.title,
            audio: audioData
          }
        })
  }

  public removeSongFromQueue(): Song | undefined {
    return this.songQueue.shift();
  }
}
