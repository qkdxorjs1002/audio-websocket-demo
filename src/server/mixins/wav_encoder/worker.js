import { Worker, parentPort, workerData } from "worker_threads";
import Encoder from "./encoder.js";
import fs from "fs";

const identifier = workerData.identifier;
const targetChunkSize = workerData.targetChunkSize;

let encoder = new Encoder({
    sampleRate: workerData.sampleRate,
    bitsPerSample: workerData.bitsPerSample,
    channelCount: workerData.channelCount
});

function onClose() {
    parentPort.close();
    recorded = null;
}

function onEncode(data) {
    encoder.encode(data);

    let encodedLength = encoder.encoded.length;
    let bufferSize = encodedLength > 0 ? encoder.encoded[0].length : 0;
    
    if (encodedLength * bufferSize >= targetChunkSize) {
        onDump(encoder.accumulatedLength == 0);
    }
}

function onDump(all) {
    let filePath = "./" + identifier + ".wav";
    const fd = fs.openSync(filePath, "w");
    // Make wav audio dump
    let dump = encoder.dump();

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
        console.log("Worker: failed to write data into file");
    }
}

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
