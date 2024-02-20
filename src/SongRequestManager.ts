import ManageableClass from "./ManageableClass";

export interface Song {
    videoId: string;
    title: string;
    durationInSeconds: number;
  }

export default class SongRequestManager implements ManageableClass {
    private songQueue: Song[] = [];
    
    constructor() { }

    async init(): Promise<void> {
        console.log("Initializing the SongRequestClient...");
        console.log("Initialized the SongRequestClient!");
    }
}