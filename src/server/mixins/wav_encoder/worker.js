"use strict";

import { Worker, parentPort, workerData } from "worker_threads";
import Encoder from "./encoder.js";
import fs from "fs";
import { exit } from "process";

// Worker data
const identifier = workerData.identifier;
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
    console.log("EncoderWorker: dump wav before terminate worker")
    await onDump();
    parentPort.close();
    console.log("EncoderWorker: exited")
    exit(0);
}

/**
 * onEncode
 * Event listener for ParentPort "encode" event.
 */
async function onEncode(data) {
    // Encode data
    encoder.encode(data);

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
 * @param {Boolean} writeAll write all of audio header and data
 */
async function onDump(writeAll) {
    console.log("EncoderWorker: writting wav file")
    let filePath = "./" + identifier + ".wav";
    const fd = fs.openSync(filePath, "a");
    // Make wav audio dump
    let dump = encoder.dump();

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
        console.log("EncoderWorker: failed to write data into file");
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
