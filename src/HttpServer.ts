import express from "express";
import { Initializable } from "./ObjectManager";
import { createServer, Server } from "node:http";
import cors from "cors";
import TwitchClient from "./TwitchClient";

export default class HttpServer implements Initializable {
  private app = express();
  private httpServer = createServer(this.app);

  constructor(
    private readonly port: string,
    private readonly tokenUtil: TokenUtil,
    private readonly twitchClient: TwitchClient,
    private readonly frontendOrigin: string,
  ) {
    this.port = port;
  }

  public getHttpServer(): Server {
    return this.httpServer;
  }

  public async init(): Promise<void> {
    console.log("Initializing the HttpServer...");

    this.app.use(
      cors({
        origin: this.frontendOrigin,
        methods: ["GET", "POST"],
        credentials: true,
      }),
    );

    this.httpServer.listen(this.port, () => {
      console.log(`Server is running at http://localhost:${this.port}`);
    });

    console.log("Initialized the HttpServer!");
  }
}
