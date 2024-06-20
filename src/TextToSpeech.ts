import type { Namespace, Server as SocketIO } from "socket.io";
import type { Initializable } from "./ObjectManager";
import {
	HasRole,
	type BasicCommand,
	type CommandContainer,
} from "./TwitchChat";
import type { ChatClient, ChatUser } from "@twurple/chat";
import Logger from "./Logger";

export default class TextToSpeech implements Initializable, CommandContainer {
	constructor(private readonly socketIO: SocketIO) {}

	public getCommands(): Map<string, BasicCommand> {
		const commands = new Map<string, BasicCommand>();

		commands.set("tts", this.playTextToSpeech.bind(this));

		return commands;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private getNamespace(): Namespace<any> {
		return this.socketIO.of("/text-to-speech");
	}

	public async init(): Promise<void> {
		Logger.info(`Initializing the ${this.constructor.name}...`);
		Logger.info(`Initialized the ${this.constructor.name}!`);
	}

	@HasRole(["Broadcaster", "Mod"])
	private async playTextToSpeech(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		Logger.trace("Entering playTextToSpeech() method");

		const message: string = commandParameters.join(" ");

		this.getNamespace().emit("payload", {
			text: message,
		});
		Logger.debug("User sent a TTS message", {
			userName: userInfo.displayName,
			userId: userInfo.userId,
			ttsMessage: message,
		});

		Logger.trace("Exiting playTextToSpeech() method");
	}
}
