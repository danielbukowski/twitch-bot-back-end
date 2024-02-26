import AuthManager from "./AuthManager";
import ConfigInitializer from "./ConfigInitializer";
import HttpServer from "./HttpServer";
import ManageableClass from "./ManageableClass";
import SocketClient from "./SocketClient";
import SongRequestManager from "./SongRequestManager";
import TokenUtil from "./TokenUtil";
import TwitchChat from "./TwitchChat";
import TwitchClient from "./TwitchClient";
import TwitchEventListener from "./TwitchEventListener";
import YoutubeClient from "./YoutubeClient";

export default class ObjectManager {
    private manageableClasses: Map<string, ManageableClass> = new Map();

    public constructor(private configInitializer: ConfigInitializer) {
        const config = configInitializer.getConfig();
        this.manageableClasses.set(TokenUtil.name, new TokenUtil(config.twitchAppClientId));
        this.manageableClasses.set(AuthManager.name, new AuthManager(
            config.twitchAppClientId, 
            config.twitchAppClientSecret,
            this.manageableClasses.get(TokenUtil.name) as TokenUtil
            ));
        this.manageableClasses.set(YoutubeClient.name, new YoutubeClient(config.youtubeApiKey));
        this.manageableClasses.set(TwitchClient.name, new TwitchClient(
            (this.manageableClasses.get(AuthManager.name) as AuthManager).getAuthProvider()
            )
        );
        this.manageableClasses.set(TwitchChat.name, new TwitchChat(
            config.twitchChannel,
            (this.manageableClasses.get(AuthManager.name) as AuthManager).getAuthProvider(),
            this.manageableClasses.get(YoutubeClient.name) as YoutubeClient,
            this.manageableClasses.get(SongRequestManager.name) as SongRequestManager,
            this.manageableClasses.get(TwitchClient.name) as TwitchClient
            )
        );
        this.manageableClasses.set(HttpServer.name, new HttpServer(config.httpServerPort));
        this.manageableClasses.set(SocketClient.name, new SocketClient(
            (this.manageableClasses.get(HttpServer.name) as HttpServer).getHttpServer()
            )
        );
        this.manageableClasses.set(TwitchEventListener.name, new TwitchEventListener(
            this.manageableClasses.get(SocketClient.name) as SocketClient,
            this.manageableClasses.get(TwitchClient.name) as TwitchClient,
        ))
    } 

    public async initManageableClasses() {
        try {
            for (const manageableClass of this.manageableClasses.values()) {
                await manageableClass.init();
            }
        } catch (e: unknown) {
            if(e instanceof Error) {
                throw e;
            }
        }
    }
}