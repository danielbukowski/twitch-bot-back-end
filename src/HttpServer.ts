import express, { NextFunction, Request, Response } from "express";
import { Initializable } from "./ObjectManager";
import { createServer, Server } from "node:http";
import cors from "cors";
import TokenUtil, { TokenIntent } from "./TokenUtil";
import { AccessToken } from "@twurple/auth";
import TwitchClient from "./TwitchClient";
import { TokenStorage } from "./AuthManager";
import TokenStorageFactory from "./TokenStorageFactory";

export default class HttpServer implements Initializable {
  private app = express();
  private httpServer = createServer(this.app);

  constructor(
    private readonly port: string,
    private readonly tokenUtil: TokenUtil,
    private readonly twitchClient: TwitchClient,
    private readonly frontendOrigin: string,
    private readonly tokenStorageFactory: TokenStorageFactory
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
        maxAge: 86400
      }),
    );

    this.app.get("/api/v1/oauth2/callback", async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {code} = req.query;

        if(!code || typeof code !== "string") {
          res.status(400).json({
            status: 400,
            message: "The code in query parameters must not be empty"
          })
          return;
        }
      
        const accessToken: AccessToken = await this.twitchClient.exchangeCodeToAccessToken(code);
        const tokenIntent: TokenIntent | undefined = this.tokenUtil.checkUseOfScopes(accessToken.scope);

        if(!tokenIntent) {
          res.status(400).json({
            status: 400,
            message: "The provided scopes do not match to any use"
          })
          return;
        }
      
        this.tokenStorageFactory.getTokenStorage().saveAccessToken(tokenIntent, accessToken);

        res.sendStatus(200);
      } catch (e: unknown) {
        next(e);
    }
  });
  
    this.app.use(this.errorHandler);

    this.httpServer.listen(this.port, () => {
      console.log(`Server is running at http://localhost:${this.port}`);
    });

    console.log("Initialized the HttpServer!");
  }

  private errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
      res.status(500).json({
        status: 500,
        message: "Internal Server Error"
      });
  }
}
