'use strict';
//@TODO 경로 정해라
import RecorderService from '../RecorderService.js/RecorderService.js'

let wavesurfer, recorderService;
let recording = false;
let webSocketClient;

recorderService = RecorderService.createPreConfigured({
    debug: true,
    micGain: 2.0,
    audioProcessor: "../src/AudioProcessor.js"
});

recorderService.em.addEventListener("onaudioprocess", (event) => {
    let audioBuffer = event.detail.audioBuffer;
    let arrayBuffer = event.detail.arrayBuffer;

    wavesurfer.loadDecodedBuffer(audioBuffer);

    if (recording) {
        // send audio message
        let message = {
            event: "audio", 
            data: {
                size: 0,
                buffer: btoa(String.fromCharCode(...new Uint8Array(arrayBuffer.buffer)))
            }
        };
        webSocketClient.send(JSON.stringify(message));
    }
});

recorderService.em.addEventListener("recorded", (event) => {
    document.querySelector('#blobUrl').innerHTML = event.detail.recorded.blobUrl;

    wavesurfer.on('ready', () => {
        wavesurfer.play();
    });
    wavesurfer.load(event.detail.recorded.blobUrl);
});

// Init & load
document.addEventListener('DOMContentLoaded', () => {
    let micBtn = document.querySelector('#micBtn');
    
    // Init wavesurfer
    wavesurfer = WaveSurfer.create({
        width: 360,
        height: 200,
        container: "#waveform",
        backgroundColor: "#c3c3ff",
        opacity: 0.8,
        waveColor: "black",
        progressColor: "grey",
        cursorColor: "#FF6060",
        cursorWidth: 1,
        barRadius: 0,
        barWidth: 2,
        barHeight: 1,
        barGap: 1,
        barMinHeight: 0,
        mediaControls: false,
        fillParent: true
    });
    wavesurfer.stop();

    wavesurfer.on('error', (e) => {
        console.warn(e);
    });

    wavesurfer.on('seek', (where) => {
        wavesurfer.play();
    });

    micBtn.onclick = () => {
        if (!recording) {
            webSocketClient = new WebSocket("wss://192.168.50.177:3000/");
            webSocketClient.onopen = onWSConnected;
            webSocketClient.onclose = onWSClosed;
            webSocketClient.onmessage = onWSMessage;
            recorderService.record();
        } else {
            recorderService.stop();
            recording = false;
        }
    };
});

function onWSConnected(event) {
    // send init message
    webSocketClient.send(JSON.stringify({ event: "init" }));
}

function onWSClosed(event) {
    webSocketClient = null;
}

function onWSMessage(event) {
    let message = JSON.parse(event.data);

    switch (message.event) {
        case "ok":
            onWSOkMessage(message.data);
            break;
        case "error":
            onWSErrorMessage(message.data);
            break;
        case "close":
            onWSCloseMessage(message.data);
            break;
    }
}

function onWSOkMessage(data) {
    wavesurfer.un('ready');
    recording = true;
}

function onWSErrorMessage(data) {
    // alert(data.error);
    console.log(data.error);
}

function onWSCloseMessage(data) {
    webSocketClient.close();
}