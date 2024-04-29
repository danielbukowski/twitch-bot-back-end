import AuthManager from "./AuthManager";
import type ConfigInitializer from "./ConfigInitializer";
import HttpServer from "./HttpServer";
import SocketServer from "./SocketServer";
import SongRequestManager from "./SongRequestManager";
import TokenStorageFactory from "./TokenStorageFactory";
import TokenUtil from "./TokenUtil";
import TwitchChat from "./TwitchChat";
import TwitchClient from "./TwitchClient";
import TwitchEventListener from "./TwitchEventListener";
import YoutubeClient from "./YoutubeClient";

export interface Initializable {
	init(): Promise<void>;
}

export default class ObjectManager {
	private manageableClasses: Map<string, Initializable> = new Map();

	public constructor(private readonly configInitializer: ConfigInitializer) {
		const config = configInitializer.getConfig();

		this.manageableClasses.set(
			TokenUtil.name,
			new TokenUtil(config.encryptionPassphrase),
		);
		this.manageableClasses.set(
			TokenStorageFactory.name,
			new TokenStorageFactory(
				config.tokenStorageType,
				this.manageableClasses.get(TokenUtil.name) as TokenUtil,
			),
		);
		this.manageableClasses.set(
			AuthManager.name,
			new AuthManager(
				config.twitchAppClientId,
				config.twitchAppClientSecret,
				this.manageableClasses.get(TokenUtil.name) as TokenUtil,
				this.manageableClasses.get(
					TokenStorageFactory.name,
				) as TokenStorageFactory,
			),
		);
		this.manageableClasses.set(
			YoutubeClient.name,
			new YoutubeClient(config.youtubeApiKey),
		);
		this.manageableClasses.set(
			TwitchClient.name,
			new TwitchClient(
				(
					this.manageableClasses.get(AuthManager.name) as AuthManager
				).getAuthProvider(),
				config.twitchAppClientId,
				config.twitchAppClientSecret,
				config.oauth2RedirectUri,
			),
		);
		this.manageableClasses.set(
			HttpServer.name,
			new HttpServer(
				config.httpServerPort,
				this.manageableClasses.get(TwitchClient.name) as TwitchClient,
				config.frontendOrigin,
				this.manageableClasses.get(
					TokenStorageFactory.name,
				) as TokenStorageFactory,
			),
		);
		this.manageableClasses.set(
			SocketServer.name,
			new SocketServer(
				(
					this.manageableClasses.get(HttpServer.name) as HttpServer
				).getHttpServer(),
			),
		);
		this.manageableClasses.set(
			SongRequestManager.name,
			new SongRequestManager(
				this.manageableClasses.get(YoutubeClient.name) as YoutubeClient,
				(
					this.manageableClasses.get(SocketServer.name) as SocketServer
				).getSocketIO(),
			),
		);
		this.manageableClasses.set(
			TwitchChat.name,
			new TwitchChat(
				(
					this.manageableClasses.get(AuthManager.name) as AuthManager
				).getAuthProvider(),
				this.manageableClasses.get(TwitchClient.name) as TwitchClient,
				[],
			),
		);
		this.manageableClasses.set(
			TwitchEventListener.name,
			new TwitchEventListener(
				(
					this.manageableClasses.get(SocketServer.name) as SocketServer
				).getSocketIO(),
				this.manageableClasses.get(TwitchClient.name) as TwitchClient,
			),
		);
	}

	public async initializeClasses(): Promise<void> {
		try {
			for (const manageableClass of this.manageableClasses.values()) {
				await manageableClass.init();
			}
		} catch (e: unknown) {
			if (e instanceof Error) {
				throw e;
			}
		}
	}
}
