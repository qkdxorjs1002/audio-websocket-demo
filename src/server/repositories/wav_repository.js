"use strict";

import { Worker } from "worker_threads";

export default class WavRepository {

    /**
     * WavRepository
     * @param {String} identifier
     */
    constructor(identifier) {
        this.identifier = identifier;

        // Spawn encoder worker
        this.encoderWorker = new Worker("./mixins/wav_encoder/worker.js", {
            workerData: {
                sampleRate: 16000,
                bitsPerSample: 16,
                channelCount: 1,
                targetChunkSize: 16384 * 20,
                identifier: identifier
            }
        });
        console.log("WavRepository: spawn encoder worker");
    }

    /**
     * encode
     * Post a message with "encode" event to encode buffer data.
     * @param {Float32Array} buffer 
     */
    encode(buffer) {
        this.encoderWorker.postMessage({
            "event": "encode", 
            "data": buffer
        });
    }
    
    /**
     * dump
     * Post a message with "dump" event.
     * @param {String} identifier
     */
    dump() {
        this.encoderWorker.postMessage({
            "event": "dump"
        });
    }

    /**
     * close
     * Post a message with "close" event to close MessagePort and termiate Worker.
     */
    close() {
        this.encoderWorker.postMessage({
            "event": "close"
        });
        this.encoderWorker = null;
    }
}