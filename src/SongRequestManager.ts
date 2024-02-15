import ManageableClass from "./ManageableClass";

export default class SongRequestManager implements ManageableClass {

    constructor() { }

    async init(): Promise<void> {
        console.log("Initializing the SongRequestClient...");
        console.log("Initialized the SongRequestClient!");
    }
}