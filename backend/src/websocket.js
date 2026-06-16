const config = require('./config');
const realtime = require('./modules/realtime/io');

// NOTE: We no longer create a legacy Socket.IO server here — that caused a
// conflict because both `new Server(server, ...)` instances raced on the same
// HTTP upgrade. The realtime module owns the single Server instance now.
// This file remains as a thin shim so the existing import sites
// (`require('../../websocket')`) keep working.
function initializeWebSocket(server) {
  try {
    realtime.attach(server);
  } catch (e) {
    console.warn('realtime.attach failed', e.message);
  }
  return realtime.getIo();
}

function getIO() {
  return realtime.getIo();
}

async function notifyUser(userId, event, data) {
  try {
    realtime.emitToUser(userId, event, data);
  } catch {}
}

function broadcast(event, payload) {
  try {
    realtime.broadcast(event, payload);
  } catch {}
}

module.exports = { initializeWebSocket, getIO, notifyUser, broadcast };
