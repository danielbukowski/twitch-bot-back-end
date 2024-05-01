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
		const environmentVariables =
			this.configInitializer.getEnvironmentVariables();
		const manageableClasses: Initializable[] = [];
		const commandContainers: CommandContainer[] = [];

		const tokenUtil = new TokenUtil(environmentVariables.ENCRYPTION_PASSPHRASE);
		manageableClasses.push(tokenUtil);

		const tokenStorageFactory = new TokenStorageFactory("IN_MEMORY", tokenUtil);
		manageableClasses.push(tokenStorageFactory);

		const authManager = new AuthManager(
			environmentVariables.TWITCH_APP_CLIENT_ID,
			environmentVariables.TWITCH_APP_CLIENT_SECRET,
			tokenStorageFactory,
		);
		manageableClasses.push(authManager);

		const youTubeClient = new YouTubeClient(
			environmentVariables.YOUTUBE_API_KEY,
		);
		manageableClasses.push(youTubeClient);

		const twitchClient = new TwitchClient(
			authManager.getAuthProvider(),
			environmentVariables.TWITCH_APP_CLIENT_ID,
			environmentVariables.TWITCH_APP_CLIENT_SECRET,
			environmentVariables.OAUTH2_REDIRECT_URI,
		);
		manageableClasses.push(twitchClient);

		const httpServer = new HttpServer(
			environmentVariables.HTTP_SERVER_PORT,
			twitchClient,
			environmentVariables.FRONTEND_ORIGIN,
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
