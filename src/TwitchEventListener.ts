import { EventSubWsListener } from "@twurple/eventsub-ws";
import ManageableClass from "./ManageableClass";
import SocketClient from "./SocketClient";
import { ApiClient } from "@twurple/api";
import { RefreshingAuthProvider } from "@twurple/auth";

export default class TwitchEventListener implements ManageableClass {
    private eventSub!: EventSubWsListener;

    constructor(private socketClient: SocketClient, private apiClient: ApiClient, private authProvider: RefreshingAuthProvider) { }

    async init(): Promise<void> {
        console.log("Initializing the TwitchEventListener...");
        console.log("Initialized the TwitchEventListener...");
    }
}