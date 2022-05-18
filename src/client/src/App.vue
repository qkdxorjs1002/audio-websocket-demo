<template>
<div>
    <span>uniqueId : {{ uniqueId }}</span>
</div>
<div id="wavesurfer"></div>
<img v-bind:src="toggleImage" @click="onMicClick" style="width:5em;"/>
</template>

<script>
import RecorderService from "./mixins/RecorderService.js/src/RecorderService.js";
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
        this.isMicStreamStopped = true;
        this.wavesurfer = WaveSurfer.create({
            width: 360,
            height: 200,
            container: "#wavesurfer",
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
            fillParent: true,
            ignoreSilenceMode: true,
        });
        this.wavesurfer.stop();
        
        this.recorderService = new RecorderService({
            broadcastAudioProcessEvents: true,
            enableDynamicsCompressor: true,
            noAudioWorklet: false,
            micGain: 1.0,
            outputGain: 1.0,
            bufferSize: 4096,
            stopTracksAndCloseCtxWhenFinished: true,
            usingMediaRecorder: false,
            latencyHint: 'interactive',
            sampleRate: 16000,
            debugging: true,
            audioConstraints: {
                channelCount: 1,
                sampleRate: 16000,
                autoGainControl: false,
                echoCancellation: false,
                noiseSuppression: false
            }
        });

        this.recorderService.em.addEventListener("onaudioprocess", (event) => {
            this.wavesurfer.loadDecodedBuffer(event.detail.buffer);
            // send audio message
            let message = (new WSMessage(
                "audio", 
                new WSMessageAudioData(0, 0, event.detail.buffer.getChannelData(0).buffer)
            )).toJson();
            this.webSocketClient.send(message);
            
            // check user stop mic streaming
            if (this.isMicStreamStopped) {    
                this.recorderService.stop();
                this.webSocketClient.close();
                this.setMicButtonIcon("off");
            }
        });
    },
    methods: {
        onMicClick() {
            if (this.isMicStreamStopped) {
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
            this.isMicStreamStopped = true;
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
                    this._onWSOkMessage(message);
                    break;
                case "error":
                    this._onWSErrorMessage(message);
                    break;
            }
        },
        _onWSOkMessage(message) {
            this.uniqueId = message.data.id;
            this.recorderService.record();
            this.setMicButtonIcon("on");
            this.isMicStreamStopped = false;
        },
        _onWSErrorMessage(message) {
            onMicOff();
            alert(message.data);
            console.log(message.data);
        },
        setMicButtonIcon(state) {
            this.toggleImage = (state === "on") ? "mic-on.svg" : "mic-off.svg";
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
