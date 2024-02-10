import dotenv from "dotenv";
dotenv.config();

interface Config {
    readonly twitchAppClientId: string;
    readonly twitchAppClientSecret: string;
    readonly httpServerPort: string;
}

export default class ConfigInitializer {
    private config: Config;

    constructor() {
        this.config = {
            twitchAppClientId: process.env.TWITCH_CLIENT_ID || "",
            twitchAppClientSecret: process.env.TWITCH_CLIENT_SECRET || "",
            httpServerPort: process.env.HTTP_SERVER_PORT || "",
        }
    }

    getConfig(): Config {
        return this.config;
    }

    checkConfigurationVariables(): void {
        console.log("Checking configuration variables...");
        
        for (const key in this.config) {
           const value = this.config[key as keyof Config];
           if(!value) throw Error(`The ${key as keyof Config} enviroment variable is not set :C`);
        }
        console.log("The configuration variable are checked!");
    }
}