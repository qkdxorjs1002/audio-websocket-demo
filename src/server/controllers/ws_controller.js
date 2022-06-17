"use strict";

import { randomUUID } from "crypto";
import { WSMessage, WSMessageAudioData } from "../models/ws_model.js";
import WavRepository from "../repositories/wav_repository.js";

export default class WSController {

    /**
     * WSController
     * @param {WebSocket} ws 
     * @param {IncomingMessage} request 
     */
    constructor(ws, request) {
        this.ws = ws;
        this.request = request;
        this._onConnect();
    }
    
    /**
     * _onConnect
     * Event listener for WSS Server "connection" event.
     * @private
     */
    _onConnect() {
        // Add WebSocket listeners
        this.ws.addEventListener("message", (message) => this._onMessage(message));
        this.ws.addEventListener("close", () => this._onClose());
        this.remoteAddress = this.request.socket.remoteAddress;
        console.info("WSServer:", this.remoteAddress);
    }
    
    /**
     * _onClose
     * Event listener for WebSocket "close" event.
     * @private
     */
    _onClose() { 
        // on unexpected close
        if (this.wavRepository != null) {
            this.wavRepository.close();
        }
        console.info("WSServer: websocket closed");
    }
    
    /**
     * _onMessage
     * Event listener for WebSocket "*" event.
     * @private
     * @param {MessageEvent} message 
     * @returns {void}
     */
    _onMessage(message) {
        console.info("WSServer: Message from", this.remoteAddress);
        const eventList = ["init", "audio", "close"];
        
        let wsMessage;
        try {
            // Parse message with WSMessage model
            wsMessage = WSMessage.fromJson(message.data);
            if (eventList.find((value) => value === wsMessage.event).length == 0) {
                throw new WSControllerError("Invalid event");
            }
        } catch (e) {
            // Send error message with "error" event
            this._sendErrorMessage(e);

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
            case "close":
                this._onCloseMessage(wsMessage.data);
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
        this.wavRepository.on("error", (error) => this._onWRError(error));
        this.wavRepository.on("close", (exitCode) => this._onWRClose(exitCode));
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
            const _error = new WSControllerError("Connection is established but not inited");
            this._sendErrorMessage(_error);
            return;
        }

        let wsMessageAudioData;
        try {
            // Parse data with WSMessageAudioData model
            wsMessageAudioData = WSMessageAudioData.fromJson(data);
            // Encode data
            this.wavRepository.encode(new Float32Array(wsMessageAudioData.buffer));
        } catch(e) {
            // Send error message with "error" event
            this._sendErrorMessage(e);
        }
    }

    /**
     * _onCloseMessage
     * Event listener for WebSocket "*" event with "close" event message.
     */
    _onCloseMessage(data) {
        console.info("WSServer: close request from client");

        // Check conntection is inited
        if (this.uuid == undefined) {
            return;
        }

        this.wavRepository.close();
    }

    /**
     * _onWRError
     * Event listener for WavRepository "error" event
     * @param {Error} error 
     */
     _onWRError(error) {
        this._sendErrorMessage(error);
    }

    /**
     * _onWRClose
     * Event listener for WavRepository "close" event
     */
     _onWRClose() {
        this._sendMessage("close");

        // Release resources
        this.wavRepository = null;
        this.ws = null;
    }

    /**
     * _sendMessage
     * Send WebSocket Message with Custom Model.
     * @private
     * @param {String} event 
     * @param {String | ArrayBufferLike | Blob | ArrayBufferView} message 
     */
    _sendMessage(event, message) {
        this.ws.send(new WSMessage(event, message).toJson());
    }

    /**
     * _sendErrorMessage
     * Send WebSocket Error Message with Custom Model.
     * @private
     * @param {String | ArrayBufferLike | Blob | ArrayBufferView} message 
     */
    _sendErrorMessage(message) {
        this._sendMessage("error", message);
    }

}

/**
 * WSControllerError
 * Error class
 */
 class WSControllerError extends Error {
    
    /**
     * WSControllerError
     * @param {String} message
     * @param {...any} args 
     */
    constructor(message,...args) {
        super(...args);
        this.code = "ERR_WSCONTROLLER";
        this.name = "WSControllerError";
        this.message = message;
        this.stack = `${this.message}\n${new Error().stack}`;
    }
}