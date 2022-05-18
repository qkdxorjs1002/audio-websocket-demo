import { Worker } from "worker_threads";
import * as fs from "fs";

export default class WavRepository {

    constructor(sampleRate, bit, channels) {
        this.sampleRate = sampleRate;
        this.bit = bit;
        this.channels = channels;

        // Spawn encoder worker
        console.log("WavRepository: spawn encoder worker");
        this.encoderWorker = new Worker("./mixins/encoder-wav-worker.js");
        this.encoderWorker.on("message", (data) => this._onMessage(data));
    }

    /**
     * _onMessage
     * Event listener for Worker "*" event.
     * @private
     * @param {ArrayBuffer} data 
     */
    _onMessage(data) {
        // File path for local wav data
        const filePath = this.identifier + ".wav";

        // Check file is exist
        if (fs.existsSync(filePath)) {
            console.log("WavRepository: file", filePath, "is exist");
        }

        // Create audio file
        new Promise(() => {
            // Write down WAV data as file
            console.log("WavRepository: write audio file", filePath);
            fs.writeFileSync(filePath, Buffer.from(new Uint8Array(data[0])), "binary");

            // Close and terminate worker
            console.log("WavRepository: terminate encoder worker");
            this.close();
        });
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
    dump(identifier) {
        this.encoderWorker.postMessage({
            "event": "dump",
            "data": this.sampleRate
        });
        this.identifier = identifier;
    }

    /**
     * close
     * Post a message with "close" event to close MessagePort and termiate Worker.
     */
    close() {
        this.encoderWorker.postMessage({
            "event": "close"
        });
        this.encoderWorker.terminate();
        this.encoderWorker = null;
    }
}