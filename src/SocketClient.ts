import { Server as SocketServer } from "socket.io";
import ManageableClass from "./ManageableClass";
import { Server } from "node:http";

export default class SocketClient implements ManageableClass {
  private io!: SocketServer;

  constructor(private readonly httpServer: Server) {}

  async init(): Promise<void> {
    console.log("Initializing the SocketClient...");

    this.io = new SocketServer(this.httpServer);

    this.io.on("connection", (socket) => {
      console.log(
        `A user has connected to the websocket with ID: ${socket.id}`
      );
    });

    console.log("Initialized the SocketClient!");
  }

  public handleFirstSubscription(username: string): void {
    this.io.emit("twitch-alert-message", {
      type: "FIRST_SUB",
      username,
    });
  }

  public handleResubscription(username: string, subStreakInMonths: number): void {
    this.io.emit("twitch-alert-message", {
      type: "RE_SUB",
      username,
      subStreakInMonths,
    });
  }
  
  public sendSong(base64AudioData: string, songTitle: string): Promise<void> {
    this.io.emit("song-request-message", {
      type: "PLAY_NEXT_SONG",
      data: {
        title: songTitle,
        audio: base64AudioData
      }
    })
  }

  public requestToPauseSong(): void {
    this.io.emit("song-request-message", {
      type: "PAUSE"
    })
  }

  public requestToPlaySong(): void {
    this.io.emit("song-request-message", {
      type: "PLAY"
    })
  }
}
