<template>
<div>
    <span>userAgent : {{ userAgent }}</span><br/>
    <span>uniqueId : {{ uniqueId }}</span><br/>
    <span>blobUrl : {{ blobUrl }}</span>
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
            userAgent: navigator.userAgent.toLowerCase(),
            toggleImage: "mic-off.svg" ,
            uniqueId: "null",
            blobUrl: "",
        }
    },
    created() {
        this.isMicStreamStopped = true;
        
        this.recorderService = RecorderService.createPreConfigured({
            bufferSize: 4096,
            makeBlob: true,
            audioProcessor: "./RecorderService.js/AudioProcessor.js"
        });

        this.recorderService.em.addEventListener("onaudioprocess", (event) => {
            let buffer = event.detail.buffer;

            this.wavesurfer.loadDecodedBuffer(buffer);
            // send audio message
            let message = (new WSMessage(
                "audio", 
                new WSMessageAudioData(0, buffer.getChannelData(0).buffer)
            )).toJson();
            this.webSocketClient.send(message);
            
            // check user stop mic streaming
            if (this.isMicStreamStopped) {    
                this.recorderService.stop();
                this.webSocketClient.send(new WSMessage("close").toJson());
                this.setMicButtonIcon("off");
            }
        });

        this.recorderService.em.addEventListener("recorded", (event) => {
            this.setBlobUrl(event.detail.recorded.blobUrl);

            this.wavesurfer.on('ready', () => {
                this.wavesurfer.play();
            });
            this.wavesurfer.load(event.detail.recorded.blobUrl);
        });
    },
    mounted() {
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
            fillParent: true
        });

        this.wavesurfer.stop();

        this.wavesurfer.on('seek', (where) => {
            this.wavesurfer.play();
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
            this.wavesurfer.un('ready');
            // send init message
            this.webSocketClient = new WebSocket("wss://192.168.50.177:3000/");
            this.webSocketClient.onopen = (event) => this.onWSConnected(event);
            this.webSocketClient.onclose = (event) => this.onWSClosed(event);
            this.webSocketClient.onmessage = (event) => this.onWSMessage(event);
        },
        onMicOff() {
            this.isMicStreamStopped = true;
        },
        setMicButtonIcon(state) {
            this.toggleImage = (state === "on") ? "mic-on.svg" : "mic-off.svg";
        },
        setBlobUrl(blobUrl) {
            this.blobUrl = blobUrl;
        },
        onWSConnected(event) {
            this.webSocketClient.send((new WSMessage("init")).toJson());
        },
        onWSClosed(event) {
            this.webSocketClient = null;
            this.onMicOff();
        },
        onWSMessage(event) {
            let message = WSMessage.fromJson(event.data);

            switch (message.event) {
                case "ok":
                    this._onWSOkMessage(message.data);
                    break;
                case "error":
                    this._onWSErrorMessage(message.data);
                    break;
                case "close":
                    this._onWSCloseMEssage(message.data);
                    break;
            }
        },
        _onWSOkMessage(data) {
            this.uniqueId = data.id;
            this.recorderService.record();
            this.setMicButtonIcon("on");
            this.isMicStreamStopped = false;
        },
        _onWSErrorMessage(data) {
            this.onMicOff();
            alert(data.error);
            console.log(data.error);
        },
        _onWSCloseMEssage(data) {
            this.webSocketClient.close();
        }
    }
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
