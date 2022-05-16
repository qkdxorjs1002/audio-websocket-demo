<template>
    <div>
        <div id="wavesurfer"></div>
        <img v-bind:src="toggleImage" @click="onMicClick" style="width:5em;"/>
        <div>
            <span>uniqueId : {{ uniqueId }}</span>
        </div>
    </div>
</template>

<script>
import RecorderService from "../mixins/RecorderService/RecorderService.js";
import WaveSurfer from "wavesurfer.js";
import { WSMessage, WSMessageAudioData } from "../models/ws_model.js";

let recorderService;
let wavesurfer;
let webSocketClient;
let uniqueId;

function data() {
    return { 
        toggleImage: "mic-off.svg" ,
        uniqueId: "null"
    }
};

function mounted() {
    wavesurfer = WaveSurfer.create({
        width: 360,
        height: 200,
        container: "#wavesurfer",
        backgroundColor: "#c3c3ff",
        opacity: 0.8,
        waveColor: "#ffffff",
        progressColor: "#F8EA06",
        cursorColor: "#FF6060",
        cursorWidth: 1,
        barRadius: 0,
        barWidth: 2,
        barHeight: 1,
        barGap: 1,
        barMinHeight: 0,
        mediaControls: true,
        fillParent: true,
        ignoreSilenceMode: true,
    });
    wavesurfer.stop();
    
    recorderService = RecorderService.createPreConfigured();

    recorderService.em.addEventListener("onaudioprocess", (event) => {
        wavesurfer.loadDecodedBuffer(event.detail.buffer);
        // send audio message
        let message = (new WSMessage(
            "audio", 
            new WSMessageAudioData(0, 0, event.detail.buffer.getChannelData(0).buffer)
        )).toJson();
        webSocketClient.send(message);
    });
}

function onMicOn() {
    webSocketClient = new WebSocket("ws://192.168.50.177:3001/");
    webSocketClient.onopen = onWSConnected;
    webSocketClient.onclose = onWSClosed;
    webSocketClient.onmessage = onWSMessage;
}

function onMicOff() {
    recorderService.stop();
    webSocketClient.close();
    setMicButtonIcon("off");
}

function onWSConnected(event) {
    // send init message
    webSocketClient.send((new WSMessage("init")).toJson());
}

function onWSClosed(event) {
    webSocketClient = null;
}

function onWSMessage(event) {
    let message = WSMessage.fromJson(event.data);

    switch (message.event) {
        case "ok":
            uniqueId = message.data.id;
            recorderService.record();
            setMicButtonIcon("on");
            break;
        case "error":
            onMicOff();
            alert(message.data);
            console.log(message.data);
            break;
    }
}

function setMicButtonIcon(state) {
    return state === "on" ? "mic-on.svg" : "mic-off.svg";
}

export default {
    name: "RecordingComponent",
    data: data,
    methods: {
        onMicClick() {
            if (recorderService.state !== "recording") {
                onMicOn();
            } else {
                onMicOff();
            }
        },
    },
    mounted: mounted,
};
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
