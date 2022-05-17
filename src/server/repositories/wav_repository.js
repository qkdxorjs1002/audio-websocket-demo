import { Worker } from "worker_threads";
import * as fs from "fs";

export default class WavRepository {

    constructor(sampleRate, bit, channels) {
        this.sampleRate = sampleRate;
        this.bit = bit;
        this.channels = channels;

        // Spawn encoding worker
        console.log("WavRepository: spawn encoder worker");
        this.encoderWorker = new Worker("./mixins/encoder-wav-worker.js");
        this.encoderWorker.on("message", (data) => this._onMessage(data));
    }

    /**
     * _onMessage
     * @private
     * @param {ArrayBuffer} data 
     */
    _onMessage(data) {
        const filePath = this.identifier + ".wav";
        if (fs.existsSync(filePath)) {
            // if file exist
            console.log("WavRepository: file", filePath, "is exist");
        }
        // create audio file
        new Promise(() => {
            console.log("WavRepository: write audio file", filePath);
            fs.writeFileSync(filePath, Buffer.from(new Uint8Array(data[0])), "binary");
            console.log("WavRepository: terminate encoder worker");
            this.close();
        });
    }

    /**
     * encode
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
     */
    close() {
        this.encoderWorker.postMessage({
            "event": "close"
        });
    }
}