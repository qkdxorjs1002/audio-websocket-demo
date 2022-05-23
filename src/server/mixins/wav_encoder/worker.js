import { Worker, parentPort, workerData } from "worker_threads";
import Encoder from "./encoder.js";
import fs from "fs";

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
function onClose() {
    parentPort.close();
}

/**
 * onEncode
 * Event listener for ParentPort "encode" event.
 */
function onEncode(data) {
    // Encode data
    encoder.encode(data);

    let encodedLength = encoder.encoded.length;
    let bufferSize = encodedLength > 0 ? encoder.encoded[0].length : 0;
    
    // Check chunk size
    if (encodedLength * bufferSize >= targetChunkSize) {
        onDump();
    }
}

/**
 * onDump
 * Event listener for ParentPort "dump" event.
 */
function onDump() {
    let filePath = "./" + identifier + ".wav";
    const fd = fs.openSync(filePath, "w");
    // Make wav audio dump
    let dump = encoder.dump();

    // Write buffers on file
    // NOTE: fd insert? overwrite?
    try {
        // Write RIFF header
        fs.writeSync(fd, dump.header.riff, undefined, undefined, 0);
        // Write fmt deader
        fs.writeSync(fd, dump.header.fmt, undefined, undefined, 12);
        // Write data header
        fs.writeSync(fd, dump.header.data, undefined, undefined, 36);
        // Close file descriptor
        fs.closeSync(fd);
        // Write data chunk
        fs.appendFileSync(filePath, dump.data);
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
