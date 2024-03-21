import { Server as SocketIO } from "socket.io";
import ManageableClass from "./ManageableClass";
import YoutubeClient from "./YoutubeClient";

export interface Song {
  videoId: string;
  title: string;
  durationInSeconds: number;
}

export default class SongRequestManager implements ManageableClass {
  private songQueue: Song[] = [];

  constructor(
    private readonly youTubeClient: YoutubeClient,
    private readonly socketIO: SocketIO,
  ) {}

  async init(): Promise<void> {
    console.log("Initializing the SongRequestClient...");
    console.log("Initialized the SongRequestClient!");
  }

  public addSongToQueue(song: Song): void {
    this.songQueue.push(song);
  }

  public playSong(): void {
      this.socketIO.emit("song-request-message", {
        type: "PLAY"
      });
  }

  public pauseSong(): void {
      this.socketIO.emit("song-request-message", {
        type: "PAUSE"
      });
    }
  
  public async sendSongFromQueue(): Promise<void> {
      const song: Song | undefined = this.removeSongFromQueue();
      if(!song) return;

      const audioData: string | undefined = await this.youTubeClient.downloadYouTubeAudio(song.videoId);
      if(!audioData) return;

      this.socketIO.emit("song-request-message", {
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
