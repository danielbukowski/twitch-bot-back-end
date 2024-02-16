export default class SongRequestError extends Error {

    public constructor(message: string) {
        super(message);
        this.name = "SongRequestError";
    }
}