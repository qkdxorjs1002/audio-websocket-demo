class WSMessage {

    constructor(event, data) {
        this.event = event;
        this.data = data;
    }

    /**
     * fromJson
     * @param {Object} message 
     * @returns {WSMessage}
     */
    static fromJson(message) {
        return new WSMessage(
            message.event, message.data
        );
    }

    /**
     * toJson
     * @returns {Object}
     */
    toJson() {
        return {
            "event": this.type,
            "data": this.data
        };
    }
}

class WSMessageAudioData {

    /**
     * 
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
     * @param {Object} message 
     * @returns {WSMessageAudioData}
     */
    static fromJson(message) {
        return new WSMessageAudioData(
            message.seq, message.size, 
            Buffer.from(message.buffer, "base64").buffer
        );
    }

    /**
     * toJson
     * @returns {Object}
     */
    toJson() {
        return {
            "seq": this.seq,
            "size": this.size,
            "buffer": this.buffer
        };
    }
}

export { WSMessage, WSMessageAudioData };