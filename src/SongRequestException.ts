export default class SongRequestException extends Error {

    public constructor(message: string) {
        super(message);
        this.name = "SongRequestException";
    }
}