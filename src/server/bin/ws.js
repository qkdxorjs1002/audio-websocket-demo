#!/usr/bin/env node

/**
 * Module dependencies.
 */
import { WebSocketServer } from "ws";
import wsEntry from "../ws.js";

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || "3001");
var server = new WebSocketServer({
    port: port
});

console.log("WSServer: started");
/**
 * Listen on provided port,a on all network interfaces.
 */
server.on("connection", onConnect);
server.on("close", onClose);
server.on("error", onError);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * onConnect
 * @param {WebSocket} ws 
 * @param {IncomingMessage} request 
 */
function onConnect(ws, request) {
    console.log("WSServer: websocket connected")
    new wsEntry().onConnect(ws, request);
}

/**
 * onClose
 */
function onClose() {
    console.log("WSServer: server closed")
}

/**
 * onError
 * @param {Error} error 
 */
function onError(error) {
    console.log("WSServer: websocket error occured")
}
