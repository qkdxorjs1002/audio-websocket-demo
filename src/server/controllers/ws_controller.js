import { randomUUID } from "crypto";
import { WSMessage, WSMessageAudioData } from "../models/ws_model.js";
import WavRepository from "../repositories/wav_repository.js";

export default class WSController {

    constructor() {}

    /**
     * onConnect
     * @param {WebSocket} ws 
     * @param {IncomingMessage} request 
     */
    onConnect(ws, request) {
        this.ws = ws;
        this.ws.addListener("message", (message) => this._onMessage(message));
        this.ws.addListener("close", () => this._onClose());
    }
    
    /**
     * _onClose
     * @private
     */
    _onClose() { 
        if (this.uuid) {
            // dump wav
            this.wavRepository.dump(this.uuid);
        }

        console.log("WSServer: websocket closed");
    }
    
    /**
     * _onMessage
     * @private
     * @param {Buffer} message 
     * @returns {void}
     */
    _onMessage(message) {
        let wsMessage;
        
        try {
            const json = JSON.parse(message.toString());
            wsMessage = WSMessage.fromJson(json);
        } catch (e) {
            // send error message
            this._sendMessage("error", "invalid message");
            return;
        }
        
        switch (wsMessage.event) {
            case "init":
                this.uuid = randomUUID();
                this.wavRepository = new WavRepository(16000, 16, 1);
                this._sendMessage("ok", { id: this.uuid });
                break;
            case "audio":
                if (this.uuid == undefined) {
                    this._sendMessage("error", "trigger init event first")
                    break;
                }
                this._onBuffer(wsMessage.data);
                break;
            case "_DEV_TEST":
                let buffer = new Float32Array(16000);
                for (let i = 0; i < 16000; i++) {
                    buffer[i] = Math.random() * 2 - 1;
                }

                this._onBuffer({
                    "seq": 1,
                    "size": 16000,
                    "buffer": Buffer.from(buffer.buffer).toString("base64")
                });

                break;
        }
    }

    /** _onBuffer
     * @private
     * @param {Object} data 
     */
    _onBuffer(data) {
        const wsMessageAudioData = WSMessageAudioData.fromJson(data);
        this.wavRepository.encode(new Float32Array(wsMessageAudioData.buffer));
    }

    /**
     * _sendMessage
     * @private
     * @param {String} event 
     * @param {Object} message 
     */
    _sendMessage(event, message) {
        this.ws.send(new WSMessage(event, message).toJson());
    }

}
