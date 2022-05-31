"use strict";

import { parentPort, workerData } from "worker_threads";
import Encoder from "./encoder.js";
import fs from "fs";
import { exit } from "process";

// Worker data
const filePath = workerData.filePath;
const targetChunkSize = workerData.targetChunkSize;

// Init encoder
let encoder = new Encoder({
    sampleRate: workerData.sampleRate,
    bitsPerSample: workerData.bitsPerSample,
    channelCount: workerData.channelCount
});

/**
 * onClose
 * Event listener for ParentPort "close" event.
 */
async function onClose() {
    parentPort.close();
    exit(0);
}

/**
 * onEncode
 * Event listener for ParentPort "encode" event.
 * @param {Float32Array} data
 */
async function onEncode(data) {
    // Encode data
    try {
        encoder.encode(data);
    } catch (e) {
        error("Failed to encode buffer", e);
        return;
    }

    let encodedLength = encoder.encoded.length;
    let bufferSize = encodedLength > 0 ? encoder.encoded[0].length : 0;
    
    // Check chunk size
    if (encodedLength * bufferSize >= targetChunkSize) {
        onDump(encoder.accumulatedLength == 0);
    }
}

/**
 * onDump
 * Event listener for ParentPort "dump" event.
 * @param {Boolean | null} writeAll write all of audio header and data
 */
async function onDump(writeAll) {
    console.info("EncoderWorker: writting wav file")
    const fd = fs.openSync(filePath, "a");
    // Make wav audio dump
    let dump;
    try {
        dump = encoder.dump();
    } catch (e) {
        error("Failed to dump encoded data", e);
        return;
    }

    // Write buffers on file
    try {
        // Write RIFF header
        fs.writeSync(fd, dump.header.riff, 0, dump.header.riff.length, 0);
        // Write fmt header
        if (writeAll) {
            fs.writeSync(fd, dump.header.fmt, 0, dump.header.fmt.length, 12);
        }
        // Write data header
        fs.writeSync(fd, dump.header.data, 0, dump.header.data.length, 36);
        // Write data chunk
        fs.appendFileSync(fd, dump.data);
        // Close file descriptor
        fs.closeSync(fd);
    } catch (e) {
        error("Failed to write data into file", e);
        return;
    }
}

/**
 * error
 * Send error message to ParentPort
 * @param {String} message 
 * @param {Error} err 
 */
function error(message, err) {
    const _error = new WorkerError(message, err);
    console.error(_error);
    parentPort.postMessage(_error);
}

/**
 * WorkerError
 * Error class
 */
class WorkerError extends Error {
    
    /**
     * WorkerError
     * @param {String} message
     * @param {...any} args 
     */
    constructor(message,...args) {
        super(...args);
        this.code = "ERR_WORKER";
        this.name = "WorkerError";
        this.message = message;
        this.stack = `${this.message}\n${new Error().stack}`;
    }
}

// Init parentPort event listener
parentPort.on("message", (message) => {
    switch (message.event) {
        case "close":
            onClose();
            break;
        case "encode":
            onEncode(message.data);
            break;
        case "dump":
            onDump();
            break;
    }
});
