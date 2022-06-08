/**
 * AudioWorklet Processor Script
 */
 class AudioProcessor extends AudioWorkletProcessor {

    constructor(options) {
        super();
        this.bufferSize = options.processorOptions.bufferSize;
        this.isFifoBuffer = options.processorOptions.isFifoBuffer;
        this.inputBuffer = null;
        this.fifoBuffer = new Float32Array(this.bufferSize);
        this.maxBufferCount = this.bufferSize / 128;
        this.bufferCount = 0;
    }

    /**
     * Process / Bypass Buffer
     * @param {Array<Array<Float32Array>>} inputList
     * @param outputList
     * @returns {boolean}
     */
    process(inputList, outputList) {
        if (inputList[0].length > 0 && inputList[0][0].length > 0) {
            this._pushToBuffer(inputList[0][0]);
            this.inputBuffer = inputList;
            outputList = this.inputBuffer;

            this.bufferCount++;
            if (this.isFifoBuffer || this.bufferCount >= this.maxBufferCount) {
                this.bufferCount = 0;
                this.port.postMessage({
                    inputBuffer: this.inputBuffer[0][0],
                    outputBuffer: outputList[0][0],
                    processedBuffer: this.fifoBuffer
                });
            }
        }

        return true;
    }

    /**
     * 오디오 RAW 데이터 -> AudioBuffer
     * @param {Float32Array} inputArray
     * @private
     */
    _pushToBuffer(inputArray) {
        let mergedData = new Float32Array(this.fifoBuffer.length + inputArray.length);
        mergedData.set(this.fifoBuffer, 0);
        mergedData.set(inputArray, this.fifoBuffer.length);
        this.fifoBuffer = mergedData.slice(inputArray.length, mergedData.length);
    }

}

registerProcessor('audio-processor', AudioProcessor);