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

  public addSongToQueue(song: Song) {
    const length: number = this.songQueue.push(song);
    const duration: number = [...this.songQueue]
      .map((s) => s.durationInSeconds)
      .reduce((acc: number, currDuration: number) => acc + currDuration, 0);

    return {
      length,
      duration,
    };
  }

  public removeSongFromQueue(): Song | undefined {
    return this.songQueue.shift();
  }
}
