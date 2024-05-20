import { type Server, createServer } from "node:http";
import type { AccessToken } from "@twurple/auth";
import cors from "cors";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import type { Initializable } from "./ObjectManager";
import type TokenStorageFactory from "./TokenStorageFactory";
import TokenUtil from "./TokenUtil";
import type { TokenIntent } from "./TokenUtil";
import type TwitchClient from "./TwitchClient";
import helmet from "helmet";
import Logger from "./Logger";

export default class HttpServer implements Initializable {
	private app = express();
	private httpServer = createServer(this.app);

	constructor(
		private readonly port: string,
		private readonly twitchClient: TwitchClient,
		private readonly frontendOrigin: string,
		private readonly tokenStorageFactory: TokenStorageFactory,
	) {}

	public getHttpServer(): Server {
		return this.httpServer;
	}

	public async init(): Promise<void> {
		Logger.info("Initializing the HttpServer...");

		this.app.use(helmet());

		this.app.use(
			cors({
				origin: this.frontendOrigin,
				methods: ["GET", "POST"],
				credentials: true,
				maxAge: 86400,
			}),
		);

		this.app.get(
			"/api/v1/oauth2/callback",
			async (req: Request, res: Response, next: NextFunction) => {
				try {
					const { code } = req.query;

					if (!code || typeof code !== "string") {
						res.status(400).json({
							status: 400,
							message: "The code in query parameters must not be empty",
						});
						return;
					}

					const accessToken: AccessToken =
						await this.twitchClient.exchangeCodeToAccessToken(code);
					const tokenIntent: TokenIntent | undefined =
						TokenUtil.checkUseOfScopes(accessToken.scope);

					if (!tokenIntent) {
						res.status(400).json({
							status: 400,
							message: "The provided scopes do not match to any use",
						});
						return;
					}

					this.tokenStorageFactory
						.getTokenStorage()
						.saveAccessToken(tokenIntent, accessToken);

					res.redirect(
						301,
						`${this.frontendOrigin}/oauth2-flow?result=success`,
					);
				} catch (e: unknown) {
					res.redirect(301, `${this.frontendOrigin}/oauth2-flow?result=error`);
				}
			},
		);

		this.app.use(this.errorHandler);

		this.httpServer.listen(this.port, () => {
			Logger.info(
				`The HTTP Server is running at http://localhost:${this.port}`,
			);
		});

		Logger.info("Initialized the HttpServer!");
	}

	private errorHandler(
		err: unknown,
		req: Request,
		res: Response,
		next: NextFunction,
	): void {
		res.status(500).json({
			status: 500,
			message: "Internal Server Error",
		});
	}
}
