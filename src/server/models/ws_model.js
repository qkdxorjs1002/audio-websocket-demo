export class WSMessage {

    /**
     * WSMessage
     * @param {String} event 
     * @param {*} data 
     */
    constructor(event, data) {
        this.event = event;
        this.data = data;
    }

    /**
     * fromJson
     * Parse and deserialize json data to object.
     * @param {Object} message 
     * @throws {WSMessageError} 
     * @returns {WSMessage}
     */
    static fromJson(message) {
        try {
            let json = (typeof message === "string") 
                ? JSON.parse(message)
                : message;

            if (json.event == null) {
                throw SyntaxError();
            }

            return new WSMessage(
                json.event, json.data
            );
        } catch (e) {
            let _message;
            if (e instanceof SyntaxError) {
                // Error message when failed to parse income message
                _message = "Invalid syntax of message";
            } else {
                // Unhandled error message
                _message = `Unhandled error - ${e.message}`;
            }
            // Send error message
            throw new WSMessageError(_message, e);
        }
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

export class WSMessageAudioData {

    /**
     * WSMessageAudioData
     * @param {Number} size 
     * @param {ArrayBuffer} buffer 
     */
    constructor(size, buffer) {
        this.size = size;
        this.buffer = buffer;
    }

    /**
     * fromJson
     * Parse and deserialize json data to object.
     * @param {Object} message 
     * @throws {WSMessageError}
     * @returns {WSMessageAudioData}
     */
    static fromJson(message) {
        try {
            let json = (typeof message === "string") 
                ? JSON.parse(message)
                : message;

            return new WSMessageAudioData(
                json.size, 
                (typeof Buffer !== "undefined")
                    ? Buffer.from(json.buffer, "base64").buffer
                    : Uint8Array.fromCharCode(atob(json.buffer))
            );
        } catch (e) {
            let _message;
            if (e instanceof SyntaxError) {
                // Error message when failed to parse income message
                _message = "Invalid syntax of message";
            } else {
                // Unhandled error message
                _message = `Unhandled error - ${e.message}`;
            }
            // Send error message
            throw new WSMessageError(_message, e);
        }
    }

    /**
     * toJson
     * Serialize data to json string.
     * @returns {String}
     */
    toJson() {
        return JSON.stringify({
            size: this.size,
            buffer: (typeof Buffer !== "undefined") 
                ? Buffer.from(this.buffer).toString("base64")
                : btoa(String.fromCharCode(...new Uint8Array(this.buffer)))
        });
    }
}

/**
 * WSMessageError
 * Error class
 */
class WSMessageError extends Error {
    
    /**
     * WSMessageError
     * @param {String} message
     * @param {...any} args 
     */
    constructor(message,...args) {
        super(...args);
        this.code = "ERR_WSMESSAGE";
        this.name = "WSMessageError";
        this.message = message;
        this.stack = `${this.message}\n${new Error().stack}`;
    }
}