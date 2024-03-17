import ManageableClass from "./ManageableClass";
import SocketClient from "./SocketClient";
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
    private readonly socketClient: SocketClient,
  ) {}

  async init(): Promise<void> {
    console.log("Initializing the SongRequestClient...");
    console.log("Initialized the SongRequestClient!");
  }

  public addSongToQueue(song: Song): void {
    this.songQueue.push(song);
  }

  public removeSongFromQueue(): void {
    this.songQueue.shift();
  }
}
