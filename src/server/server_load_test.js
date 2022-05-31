import { WSMessage, WSMessageAudioData } from "./models/ws_model.js";
import { WebSocket } from "ws";
import * as fs from "fs";

const NUMBER_OF_CLIENT = 100;
const WEBSOCKET_SERVER = "wss://192.168.50.177:3000/";

class TestClient {
    
    constructor() {
        this.uniqueId = null;
        this.webSocketClient = new WebSocket(WEBSOCKET_SERVER, {
            key: fs.readFileSync("../cert/pr.pem"),
            cert: fs.readFileSync("../cert/cert.pem"),
            rejectUnauthorized: false
        });
        this.webSocketClient.onopen = (event) => this.onWSConnected(event);
        this.webSocketClient.onclose = (event) => this.onWSClosed(event);
        this.webSocketClient.onmessage = (event) => this.onWSMessage(event);
    }

    onWSConnected(event) {
        this.webSocketClient.send((new WSMessage("init")).toJson());
    }

    onWSClosed(event) {
        this.webSocketClient = null;
    }

    onWSMessage(event) {
        let message = WSMessage.fromJson(event.data);

        switch (message.event) {
            case "ok":
                this.onWSOkMessage(message.data);
                break;
            case "error":
                this.onWSErrorMessage(message.data);
                break;
            case "close":
                this.onWSCloseMEssage(message.data);
                break;
        }
    }

    onWSOkMessage(data) {
        this.uniqueId = data.id;
        this.sendAudioData();
    }

    onWSErrorMessage(data) {
        console.log(data.error);
    }

    onWSCloseMEssage(data) {
        this.webSocketClient.close();
    }

    async sendAudioData() {
        setInterval(() => {
            let buffer = new Float32Array(2048);
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.random() * 2 - 1;
            }
            this.webSocketClient.send((new WSMessage(
                "audio", 
                new WSMessageAudioData(0, 0, buffer.buffer)
            )).toJson());
        }, 250);
    }

}

for (let idx = 0; idx < NUMBER_OF_CLIENT; idx++) {
    new TestClient();
}