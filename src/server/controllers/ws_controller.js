"use strict";

import { randomUUID } from "crypto";
import { WSMessage, WSMessageAudioData } from "../models/ws_model.js";
import WavRepository from "../repositories/wav_repository.js";

export default class WSController {

    constructor() {}

    /**
     * onConnect
     * Event listener for WSS Server "connection" event.
     * @param {WebSocket} ws 
     * @param {IncomingMessage} request 
     */
    onConnect(ws, request) {
        this.ws = ws;

        // Add WebSocket listeners
        this.ws.addEventListener("message", (message) => this._onMessage(message));
        this.ws.addEventListener("close", () => this._onClose());

        this.remoteAddress = request.socket.remoteAddress;
        console.log("WSServer:", this.remoteAddress);
    }
    
    /**
     * _onClose
     * Event listener for WebSocket "close" event.
     * @private
     */
    _onClose() { 
        console.log("WSServer: websocket closed");

        // Check conntection is inited
        if (this.uuid == undefined) {
            return;
        }

        // Release resources
        this.wavRepository.close();
        this.wavRepository = null;
        this.ws = null;
    }
    
    /**
     * _onMessage
     * Event listener for WebSocket "*" event.
     * @private
     * @param {MessageEvent} message 
     * @returns {void}
     */
    _onMessage(message) {
        console.log("WSServer: Message from", this.remoteAddress);

        let wsMessage;

        try {
            // Parse message with WSMessage model
            const json = JSON.parse(message.data);
            wsMessage = WSMessage.fromJson(json);
        } catch (e) {
            // Send error message when failed to parse income message
            this._sendMessage("error", "invalid message");
            return;
        }
        
        // Distinguish message type
        switch (wsMessage.event) {
            case "init":
                this._onInitMessage(wsMessage.data);
                break;
            case "audio":
                this._onAudioMessage(wsMessage.data);
                break;
            case "_DEV_TEST":
                this._onDevTestMessage(wsMessage.data);
                break;
        }
    }

    /** 
     * _onInitMessage
     * Event listener for WebSocket "*" event with "init" event message.
     * @private
     * @param {Object} data 
     */
    _onInitMessage(data) {
        // Generate UUID for uniqueId
        this.uuid = randomUUID();
        // Init WavRepository
        this.wavRepository = new WavRepository(this.uuid);
        // Send response message with "ok" event
        this._sendMessage("ok", { id: this.uuid });
    }

    /** 
     * _onAudioMessage
     * Event listener for WebSocket "*" event with "audio" event message.
     * @private
     * @param {Object} data 
     */
    _onAudioMessage(data) {
        // Check conntection is inited
        if (this.uuid == undefined) {
            // Send error message with "error" event
            this._sendMessage("error", "trigger init event first")
            return;
        }
        let wsMessageAudioData;

        try {
            // Parse data with WSMessageAudioData model
            wsMessageAudioData = WSMessageAudioData.fromJson(data);
        } catch(e) {
            // Send error message when failed to parse data
            this._sendMessage("error", "invalid data message");
            return;
        }

        // Encode data
        this.wavRepository.encode(new Float32Array(wsMessageAudioData.buffer));
    }

    /** 
     * _onDevTestMessage
     * Event listener for WebSocket "*" event with "_DEV_TEST" event message.
     * @private
     * @param {Object} data 
     */
    _onDevTestMessage(data) {
        // Generate random noise
        let buffer = new Float32Array(16000);
        for (let i = 0; i < 16000; i++) {
            buffer[i] = Math.random() * 2 - 1;
        }

        this._onBuffer({
            "seq": 1,
            "size": 16000,
            "buffer": Buffer.from(buffer.buffer).toString("base64")
        });
    }

    /**
     * _sendMessage
     * Send WebSocket Message with Custom Model.
     * @private
     * @param {String} event 
     * @param {Object} message 
     */
    _sendMessage(event, message) {
        this.ws.send(new WSMessage(event, message).toJson());
    }

}
