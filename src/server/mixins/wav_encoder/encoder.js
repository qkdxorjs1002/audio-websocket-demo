"use strict";

export default class Encoder {

    /**
     * Encoder
     * @param {Object} config 
     * @param {Number} config.sampleRate
     * @param {Number} config.bitsPerSample
     * @param {Number} config.channelCount
     */
    constructor(config) {
        this.encoded = [];
        this.accumulatedLength = 0;
        this.config = {
            "sampleRate": 16000,
            "bitsPerSample": 16,
            "channelCount": 1,
        }
        this.BYTES_PER_SAMPLE = this.config.bitsPerSample / 8;
        Object.assign(this.config, config);
    }
    
    /**
     * encode
     * Encode buffer
     * @param {Float32Array} buffer 
     */
    encode(buffer) {
        console.log(process.memoryUsage());
        let length = buffer.length;
        let data = new Uint8Array(length * this.BYTES_PER_SAMPLE);
        for (let i = 0; i < length; i++) {
            let index = i * this.BYTES_PER_SAMPLE;
            let sample = buffer[i];
            if (sample > 1) {
                sample = 1;
            }
            else if (sample < -1) {
                sample = -1;
            }
            sample = sample * 32768;
            data[index] = sample;
            data[index + 1] = sample >> 8;
        }
        this.encoded.push(data);
        console.log(process.memoryUsage());
    }

    /**
     * dump
     * @typedef {Object} Dump
     * @property {Object} Dump.header
     * @property {Uint8Array} Dump.header.riff
     * @property {Uint8Array} Dump.header.fmt
     * @property {Uint8Array} Dump.header.data
     * @property {Uint8Array} Dump.data
     * @returns {Dump}
     */
    dump() {
        let bufferLength = this.encoded.length ? this.encoded[0].length : 0;
        let dataChunkLength = this.encoded.length * bufferLength;
        this.accumulatedLength += dataChunkLength;

        let riffHeader = new Uint8Array(12);
        let riffHeaderView = new DataView(riffHeader.buffer);
        let fmtHeader = new Uint8Array(24);
        let fmtHeaderView = new DataView(fmtHeader.buffer);
        let dataHeader = new Uint8Array(8);
        let dataHeaderView = new DataView(dataHeader.buffer);

        let dataChunk = new Uint8Array(dataChunkLength);

        // 0 RIFF identifier "RIFF"
        riffHeaderView.setUint32(0, 1380533830, false);
        // 4 file length minus RIFF identifier length and file description length
        riffHeaderView.setUint32(4, 36 + this.accumulatedLength, true);
        // 8 RIFF type "WAVE"
        riffHeaderView.setUint32(8, 1463899717, false);
        // 12 format chunk identifier "fmt "
        fmtHeaderView.setUint32(0, 1718449184, false);
        // 16 format chunk length
        fmtHeaderView.setUint32(4, 16, true);
        // 20 sample format (raw)
        fmtHeaderView.setUint16(8, 1, true);
        // 22 channel count
        fmtHeaderView.setUint16(10, this.config.channelCount, true);
        // 24 sample rate
        fmtHeaderView.setUint32(12, this.config.sampleRate, true);
        // 28 byte rate (sample rate * block align)
        fmtHeaderView.setUint32(16, this.config.sampleRate * this.BYTES_PER_SAMPLE, true);
        // 32 block align (channel count * bytes per sample)
        fmtHeaderView.setUint16(20, this.config.channelCount * this.BYTES_PER_SAMPLE, true);
        // 34 bits per sample
        fmtHeaderView.setUint16(22, this.config.bitsPerSample, true);
        // 36 data chunk identifier "data"
        dataHeaderView.setUint32(0, 1684108385, false);
        // 40 data chunk length
        dataHeaderView.setUint32(4, this.accumulatedLength, true);
        // 44 data chunk
        for (var i = 0; i < this.encoded.length; i++) {
            dataChunk.set(this.encoded[i], i * bufferLength);
        }

        this.encoded = [];

        return {
            "header": {
                "riff": riffHeader, 
                "fmt": fmtHeader,
                "data": dataHeader
            },
            "data": dataChunk
        };
    }

}