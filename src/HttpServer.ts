import express from "express";
import ManageableClass from "./ManageableClass";
import { createServer, Server } from "node:http"

export default class HttpServer implements ManageableClass {
  private app = express();
  private httpServer = createServer(this.app);

  constructor(private readonly port: string) { 
    this.port = port;
  }

  async init(): Promise<void> {
    console.log("Initializing the HttpServer...");
    
    this.httpServer.listen(this.port, () => {
        console.log(`Server is running at http://localhost:${this.port}`);
    });

    console.log("Initialized the HttpServer!");
  }

  public getHttpServer(): Server {
    return this.httpServer;
  }
}
