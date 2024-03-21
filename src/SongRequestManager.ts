import ManageableClass from "./ManageableClass";
import SocketServer from "./SocketServer";
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
    private readonly socketServer: SocketServer,
  ) {}

  async init(): Promise<void> {
    console.log("Initializing the SongRequestClient...");
    console.log("Initialized the SongRequestClient!");
  }

  public addSongToQueue(song: Song): void {
    this.songQueue.push(song);
  }

  public playSong(): void {
    this.socketServer.requestToPlaySong();
  }

  public pauseSong(): void {
    this.socketServer.requestToPauseSong();
  }

  public async sendSongFromQueue(): Promise<void> {
      const song: Song | undefined = this.removeSongFromQueue();
      if(!song) return;

      const audioData: string | undefined = await this.youTubeClient.downloadYouTubeAudio(song.videoId);
      if(!audioData) return;

      this.socketServer.sendSong(audioData, song.title);
  }

  public removeSongFromQueue(): Song | undefined {
    return this.songQueue.shift();
  }
}
