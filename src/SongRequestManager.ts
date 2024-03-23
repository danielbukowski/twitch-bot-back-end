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
      this.socketIO.of("/song-request").emit("song-request-message", {
        type: "PLAY"
      });
  }

  public pauseSong(): void {
      this.socketIO.of("/song-request").emit("song-request-message", {
        type: "PAUSE"
      });
    }
  
  public getDurationOfCurrentPlayedSong(): Promise<string> {
      return new Promise((resolve, reject) => {
        this.socketIO.of("/song-request").fetchSockets()
        .then(sockets => {
          sockets[0].timeout(1400).emit("song-request-message", {
            type: "SONG_DURATION"
          },
          (e: Error, response: {
            durationInSeconds: string
          }) => {
            if (!e) {
              resolve(response.durationInSeconds);
            } 
            
            // the request timed out and just return 0 for now
            resolve("0");
          })
        }).catch((e) => {
          reject(e);
        })
      })
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
