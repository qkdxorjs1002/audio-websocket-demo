"use strict";

import EventEmitter from "events";
import { Worker } from "worker_threads";

export default class WavRepository extends EventEmitter {

    /**
     * WavRepository
     * @param {String} identifier
     */
    constructor(identifier) {
        super();

        this.identifier = identifier;
        this.filePath = `./${this.identifier}.wav`;

        // Spawn encoder worker
        this.encoderWorker = new Worker("./mixins/wav_encoder/worker.js", {
            workerData: {
                sampleRate: 16000,
                bitsPerSample: 16,
                channelCount: 1,
                targetChunkSize: 16384 * 20,
                filePath: this.filePath
            }
        });
        this.encoderWorker.on("message", (message) => this._onMessage(message));
        this.encoderWorker.on("exit", () => this._onExit());
        console.info("WavRepository: spawn encoder worker");
    }

    /**
     * encode
     * Post a message with "encode" event to encode buffer data.
     * @param {Float32Array} buffer 
     */
    encode(buffer) {
        if (this.encoderWorker) {
            this.encoderWorker.postMessage({
                "event": "encode", 
                "data": buffer
            });
        }
    }
    
    /**
     * dump
     * Post a message with "dump" event.
     */
    dump() {
        if (this.encoderWorker) {
            this.encoderWorker.postMessage({
                "event": "dump"
            });
        }
    }

    /**
     * close
     * Post a message with "close" event to close MessagePort and exit Worker.
     */
    close() {
        this.dump();
        if (this.encoderWorker) {
            this.encoderWorker.postMessage({
                "event": "close"
            });
            this.encoderWorker = null;
        }
    }

    /**
     * _onMessage
     * Event listener for WorkerPort "message" event
     * @param {*} message 
     */
    _onMessage(message) {
        if (message instanceof Error) {
            this._onError(message);
        }
    }

    /**
     * _onExit
     * Event listener for WorkerPort "exit" event
     */
     _onExit() {
        this.emit("close");
    }
    
    /**
     * _onError
     * Event listener for WorkerPort "message" event contain error
     * @param {Error} error 
     */
    _onError(error) {
        this.close();
        this.emit("error", error);
    }
}