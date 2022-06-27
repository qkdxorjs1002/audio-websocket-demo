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
            bufferSize: 13,
            makeBlob: true,
            audioProcessor: "./RecorderService.js/AudioProcessor.js",
            debug: true,
        });

        this.recorderService.em.addEventListener("onaudioprocess", this.onAudioProcess);
        this.recorderService.em.addEventListener("recorded", this.onRecorded);
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
                this.webSocketClient = new WebSocket("wss://192.168.50.177:3000/");
                //@NOTE WebSocket EventListener에 오래 실행되는 코드 실행하지 말 것 -> 실행에 지연 생김
                this.webSocketClient.addEventListener("open", this.onWSConnected);
                this.webSocketClient.addEventListener("close", this.onWSClosed);
                this.webSocketClient.addEventListener("message", this.onWSMessage);
                this.recorderService.record();
            } else {
                this.isMicStreamStopped = true;
            }
        },
        setMicButtonIcon(state) {
            this.toggleImage = (state === "on") ? "mic-on.svg" : "mic-off.svg";
        },
        setBlobUrl(blobUrl) {
            this.blobUrl = blobUrl;
        },
        onAudioProcess(event) {
            let audioBuffer = event.detail.audioBuffer;
            let arrayBuffer = event.detail.arrayBuffer;

            this.wavesurfer.loadDecodedBuffer(audioBuffer);

            if (!this.isMicStreamStopped) {
                // send audio message
                let message = (new WSMessage(
                    "audio", 
                    new WSMessageAudioData(0, arrayBuffer.buffer)
                )).toJson();
                this.webSocketClient.send(message);
            }
            
            // check user stop mic streaming
            if (this.isMicStreamStopped) {    
                this.recorderService.stop();
                this.webSocketClient.send(new WSMessage("close").toJson());
                this.setMicButtonIcon("off");
            }
        },
        onRecorded(event) {
            this.setBlobUrl(event.detail.recorded.blobUrl);

            this.wavesurfer.on('ready', () => {
                this.wavesurfer.play();
            });
            this.wavesurfer.load(event.detail.recorded.blobUrl);
        },
        onWSConnected(event) {
            // Send init message
            this.webSocketClient.send((new WSMessage("init")).toJson());
        },
        onWSClosed(event) {
            this.webSocketClient = null;
            this.isMicStreamStopped = true;
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
                    this._onWSCloseMessage(message.data);
                    break;
            }
        },
        _onWSOkMessage(data) {
            this.isMicStreamStopped = false;
            this.wavesurfer.un('ready');
            this.uniqueId = data.id;
            this.setMicButtonIcon("on");
        },
        _onWSErrorMessage(data) {
            this.isMicStreamStopped = true;
            alert(data.error);
            console.log(data.error);
        },
        _onWSCloseMessage(data) {
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
