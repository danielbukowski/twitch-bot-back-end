import express from "express";
import dotenv from "dotenv";
dotenv.config();

export default class HttpServer {
  private express = express();
  private port = process.env.HTTP_SERVER_PORT;

  private constructor() {
    this.express.listen(this.port, () => {
      console.log(`Server is running at http://localhost:${this.port}`);
    });
  }

}
