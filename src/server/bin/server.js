"use strict";

/**
 * Module dependencies.
 */
import app from "../http.js";
import wsEntry from "../ws.js";
import debug from "debug";
import { createServer } from "https";
import { WebSocketServer } from "ws";
import * as fs from "fs";

/**
 * Get port from environment and store in Express.
 */
let port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Set SSL certificate information
 */
const options = {
    key: fs.readFileSync("../cert/pr.pem"),
    cert: fs.readFileSync("../cert/cert.pem"),
    rejectUnauthorized: false
};

/**
 * Create HTTPS server.
 */
let httpsServer = createServer(options, app);

/**
 * Create WSS server.
 */
let webSocketServer = new WebSocketServer({
    server: httpsServer
});

/**
 * Listen on provided port, on all network interfaces.
 */
httpsServer.listen(port);
httpsServer.on("error", onHTTPSError);
httpsServer.on("listening", onHTTPSListening);

webSocketServer.on("connection", onWSConnect);
webSocketServer.on("close", onWSClose);
webSocketServer.on("error", onWSError);

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
 * Event listener for HTTP server "error" event.
 */
function onHTTPSError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string"
    ? "Pipe " + port
    : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTPS server "listening" event.
 */
function onHTTPSListening() {
  var addr = httpsServer.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
  debug("Listening on " + bind);
}

/**
 * onWSConnect
 * Event listener for WSS Server "connection" event.
 * @param {WebSocket} ws 
 * @param {IncomingMessage} request 
 */
 function onWSConnect(ws, request) {
    console.log("WSServer: websocket connected")
    new wsEntry().onConnect(ws, request);
}

/**
 * onWSClose
 * Event listener for WSS Server "close" event.
 */
function onWSClose() {
    console.log("WSServer: server closed")
}

/**
 * onWSError
 * Event listener for WSS Server "error" event.
 * @param {Error} error 
 */
function onWSError(error) {
    console.log("WSServer: websocket error occured")
}

console.log("Server is running.")