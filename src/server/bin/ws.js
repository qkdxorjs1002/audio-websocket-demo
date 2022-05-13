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
