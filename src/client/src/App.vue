<template>
<div id="wavesurfer"></div>
<img v-bind:src="toggleImage" @click="onMicClick" style="width:5em;"/>
<div>
    <span>uniqueId : {{ uniqueId }}</span>
</div>
</template>

<script>
import RecorderService from "./mixins/RecorderService/RecorderService.js";
import WaveSurfer from "wavesurfer.js";
import { WSMessage, WSMessageAudioData } from "./models/ws_model.js";

export default {
    name: "App",
    data() {
        return { 
            toggleImage: "mic-off.svg" ,
            uniqueId: "null"
        }
    },
    mounted() {
        this.wavesurfer = WaveSurfer.create({
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
        this.wavesurfer.stop();
        
        this.recorderService = RecorderService.createPreConfigured();

        this.recorderService.em.addEventListener("onaudioprocess", (event) => {
            this.wavesurfer.loadDecodedBuffer(event.detail.buffer);
            // send audio message
            let message = (new WSMessage(
                "audio", 
                new WSMessageAudioData(0, 0, event.detail.buffer.getChannelData(0).buffer)
            )).toJson();
            this.webSocketClient.send(message);
        });
    },
    methods: {
        onMicClick() {
            if (this.recorderService.state !== "recording") {
                this.onMicOn();
            } else {
                this.onMicOff();
            }
        },
        onMicOn() {
            this.webSocketClient = new WebSocket("wss://192.168.50.177:3000/");
            this.webSocketClient.onopen = this.onWSConnected;
            this.webSocketClient.onclose = this.onWSClosed;
            this.webSocketClient.onmessage = this.onWSMessage;
        },
        onMicOff() {
            this.recorderService.stop();
            this.webSocketClient.close();
            this.setMicButtonIcon("off");
        },
        setMicButtonIcon(state) {
            this.toggleImage = (state === "on") ? "mic-on.svg" : "mic-off.svg";
        },
        onWSConnected(event) {
            // send init message
            this.webSocketClient.send((new WSMessage("init")).toJson());
        },
        onWSClosed(event) {
            this.webSocketClient = null;
        },
        onWSMessage(event) {
            let message = WSMessage.fromJson(event.data);

            switch (message.event) {
                case "ok":
                    this.uniqueId = message.data.id;
                    this.recorderService.record();
                    this.setMicButtonIcon("on");
                    break;
                case "error":
                    onMicOff();
                    alert(message.data);
                    console.log(message.data);
                    break;
            }
        }
    },
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
