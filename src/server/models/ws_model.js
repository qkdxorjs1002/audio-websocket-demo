class WSMessage {

    constructor(event, data) {
        this.event = event;
        this.data = data;
    }

    /**
     * fromJson
     * Parse and deserialize json data to object.
     * @param {Object} message 
     * @returns {WSMessage}
     */
    static fromJson(message) {
        let json = (typeof message === "string") 
            ? JSON.parse(message)
            : message;

        return new WSMessage(
            json.event, json.data
        );
    }

    /**
     * toJson
     * Serialize data to json string.
     * @returns {String}
     */
    toJson() {
        return JSON.stringify({
            event: this.event,
            data: (this.data instanceof WSMessageAudioData) 
                ? this.data.toJson() 
                : this.data
        });
    }
}

class WSMessageAudioData {

    /**
     * WSMessageAudioData
     * @param {Number} seq 
     * @param {Number} size 
     * @param {ArrayBuffer} buffer 
     */
    constructor(seq, size, buffer) {
        this.seq = seq;
        this.size = size;
        this.buffer = buffer;
    }

    /**
     * fromJson
     * Parse and deserialize json data to object.
     * @param {Object} message 
     * @returns {WSMessageAudioData}
     */
    static fromJson(message) {
        let json = (typeof message === "string") 
            ? JSON.parse(message)
            : message;

        return new WSMessageAudioData(
            json.seq, json.size, 
            (typeof Buffer !== "undefined")
                ? Buffer.from(json.buffer, "base64").buffer
                : Uint8Array.fromCharCode(atob(json.buffer))
        );
    }

    /**
     * toJson
     * Serialize data to json string.
     * @returns {String}
     */
    toJson() {
        return JSON.stringify({
            seq: this.seq,
            size: this.size,
            buffer: (typeof Buffer !== "undefined") 
                ? Buffer.from(this.buffer).toString("base64")
                : btoa(String.fromCharCode(...new Uint8Array(this.buffer)))
        });
    }
}

export { WSMessage, WSMessageAudioData };