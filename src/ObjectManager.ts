import AuthManager from "./AuthManager";
import ConfigInitializer from "./ConfigInitializer";
import HttpServer from "./HttpServer";
import ManageableClass from "./ManageableClass";
import TokenUtil from "./TokenUtil";
import TwitchClient from "./TwitchClient";

export default class ObjectManager {
    private manageableClasses: Map<string, ManageableClass> = new Map();

    public constructor(configInitializer: ConfigInitializer) {
        const config = configInitializer.getConfig();

        this.manageableClasses.set(AuthManager.name, new AuthManager(config.twitchAppClientId, config.twitchAppClientSecret));
        this.manageableClasses.set(HttpServer.name, new HttpServer(config.httpServerPort));
        this.manageableClasses.set(TokenUtil.name, new TokenUtil(config.twitchAppClientId));
        this.manageableClasses.set(TwitchClient.name, new TwitchClient((this.manageableClasses.get(AuthManager.name) as AuthManager).getAuthProvider(), this.manageableClasses.get(TokenUtil.name) as TokenUtil));
    }

    public async initManageableClasses() {
        for (const manageableClass of this.manageableClasses.values()) {
            await manageableClass.init();
        }
    }

    public getInstance(name: string): ManageableClass | undefined {
        return this.manageableClasses.get(name);
    }

}