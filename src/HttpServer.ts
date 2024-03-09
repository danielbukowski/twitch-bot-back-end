import express from "express";
import ManageableClass from "./ManageableClass";
import { createServer, Server } from "node:http";
import cors from "cors";

export default class HttpServer implements ManageableClass {
  private app = express();
  private httpServer = createServer(this.app);

  constructor(private readonly port: string) {
    this.port = port;
  }

  public getHttpServer(): Server {
    return this.httpServer;
  }

  async init(): Promise<void> {
    console.log("Initializing the HttpServer...");

    this.app.use(
      cors({
        //origin to dev Vue.js
        origin: "http://localhost:5173",
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
