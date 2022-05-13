import { Worker } from "worker_threads";
import * as fs from "fs";
import { timeStamp } from "console";

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
     * @privatea
     * @param {ArrayBuffer} data 
     */
    _onMessage(data) {
        const fileName = this.identifier + ".wav";
        if (fs.existsSync(fileName)) {
            // if file exist
            console.log("WavRepository: file", filename, "is exist");
        }
        // create audio file
        new Promise(() => {
            console.log("WavRepository: write audio file", fileName);
            fs.writeFileSync(fileName, Buffer.from(new Uint8Array(data[0])), "binary");
        }).then(() => this.close());
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