import AuthManager from "./AuthManager";
import type ConfigInitializer from "./ConfigInitializer";
import HttpServer from "./HttpServer";
import SocketServer from "./SocketServer";
import SongRequestManager from "./SongRequestManager";
import TokenStorageFactory from "./TokenStorageFactory";
import TokenUtil from "./TokenUtil";
import TwitchChat, { type CommandContainer } from "./TwitchChat";
import TwitchClient from "./TwitchClient";
import TwitchEventListener from "./TwitchEventListener";
import YouTubeClient from "./YouTubeClient";

export interface Initializable {
	init(): Promise<void>;
}

export default class ObjectManager {
	constructor(private readonly configInitializer: ConfigInitializer) {}

	public async initializeClasses(): Promise<void> {
		const config = this.configInitializer.getConfig();
		const manageableClasses: Initializable[] = [];
		const commandContainers: CommandContainer[] = [];

		const tokenUtil = new TokenUtil(config.encryptionPassphrase);
		manageableClasses.push(tokenUtil);

		const tokenStorageFactory = new TokenStorageFactory(
			config.tokenStorageType,
			tokenUtil,
		);
		manageableClasses.push(tokenStorageFactory);

		const authManager = new AuthManager(
			config.twitchAppClientId,
			config.twitchAppClientSecret,
			tokenStorageFactory,
		);
		manageableClasses.push(authManager);

		const youTubeClient = new YouTubeClient(config.youTubeApiKey);
		manageableClasses.push(youTubeClient);

		const twitchClient = new TwitchClient(
			authManager.getAuthProvider(),
			config.twitchAppClientId,
			config.twitchAppClientSecret,
			config.oauth2RedirectUri,
		);
		manageableClasses.push(twitchClient);

		const httpServer = new HttpServer(
			config.httpServerPort,
			twitchClient,
			config.frontendOrigin,
			tokenStorageFactory,
		);
		manageableClasses.push(httpServer);

		const socketServer = new SocketServer(httpServer.getHttpServer());
		manageableClasses.push(socketServer);

		const songRequestManager = new SongRequestManager(
			youTubeClient,
			socketServer.getSocketIO(),
		);
		manageableClasses.push(songRequestManager);
		commandContainers.push(songRequestManager);

		const twitchEventListener = new TwitchEventListener(
			socketServer.getSocketIO(),
			twitchClient,
		);
		manageableClasses.push(twitchEventListener);

		const twitchChat = new TwitchChat(
			authManager.getAuthProvider(),
			twitchClient,
			commandContainers,
		);
		manageableClasses.push(twitchChat);

		try {
			for (const manageableClass of manageableClasses) {
				await manageableClass.init();
			}
		} catch (e: unknown) {
			if (e instanceof Error) {
				throw e;
			}
		}
	}
}
