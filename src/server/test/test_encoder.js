/**
 * Unit Test
 * test_encoder.js
 */
import assert from "assert";
import Encoder from "../mixins/wav_encoder/encoder.js";

describe("Encoder", () => {
    describe("Encode", () => {
        let encoder = new Encoder();
        encoder.encode(new Float32Array(new ArrayBuffer(4096)));
        it("encoder.encoded.length == 1", () => {
            assert.equal(encoder.encoded.length, 1);
        });
        it("encoder.encoded[0].length == 4096", () => {
            assert.equal(encoder.encoded[0].length, 2048);
        });
        it("encoder.accumulatedLenght == 0", () => {
            assert.equal(encoder.accumulatedLength, 0);
        });
    });
    describe("First dump", () => {
        let encoder = new Encoder();
        encoder.encode(new Float32Array(new ArrayBuffer(4096)));
        it("encoder.dump() != null", () => {
            assert.notEqual(encoder.dump(), null);
        });
    });
    describe("Continuous dump", () => {
        let encoder = new Encoder();
        encoder.encode(new Float32Array(new ArrayBuffer(4096)));
        encoder.encode(new Float32Array(new ArrayBuffer(4096)));
        encoder.encode(new Float32Array(new ArrayBuffer(4096)));
        encoder.encode(new Float32Array(new ArrayBuffer(4096)));
        it("encoder.dump() != null", () => {
            assert.notEqual(encoder.dump(), null);
        });
    });
});