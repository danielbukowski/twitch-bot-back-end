import { EventSubWsListener } from "@twurple/eventsub-ws";
import ManageableClass from "./ManageableClass";
import SocketClient from "./SocketClient";
import TwitchClient from "./TwitchClient";

export default class TwitchEventListener implements ManageableClass {
    private eventSub!: EventSubWsListener;

  constructor(
    private readonly socketClient: SocketClient,
    private readonly twitchClient: TwitchClient
  ) { }

  async init(): Promise<void> {
    console.log("Initializing the TwitchEventListener...");

    this.eventSub = new EventSubWsListener({
      apiClient: this.twitchClient.getApiClient(),
    });

    const channelId: string = await this.twitchClient.getIdFromAccessTokenForIntent("events");

    this.eventSub.onChannelSubscription(channelId, (e) => {
      const userName = e.userDisplayName;

      this.socketClient.handleFirstSubscription(userName);
    });

    this.eventSub.onChannelSubscriptionMessage(channelId, (e) => {
      const userName = e.userDisplayName;
      const subStreakInMonths = e.streakMonths ?? 0;

      this.socketClient.handleResubscription(userName, subStreakInMonths)
    });

    this.eventSub.start();

    console.log("Initialized the TwitchEventListener!");
  }
}