import express from "express";
import ManageableClass from "./ManageableClass";

export default class HttpServer implements ManageableClass {
  private express = express();

  constructor(private port: string) { }

  async init(): Promise<void> {
    console.log("Initializing the HttpServer...");
    
    this.express.listen(this.port, () => {
        console.log(`Server is running at http://localhost:${this.port}`);
    });

    console.log("Initialized the HttpServer!");
  }
}
