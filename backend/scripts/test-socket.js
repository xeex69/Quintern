// Quick Socket.IO round-trip test
const { io } = require('socket.io-client');

(async () => {
  // 1. Login to get a JWT
  const csrfRes = await fetch('http://localhost:5000/api/auth/csrf-token');
  const setCookie = csrfRes.headers.get('set-cookie') || '';
  const csrf = (await csrfRes.json()).csrfToken;

  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      Cookie: setCookie,
    },
    body: JSON.stringify({
      email: 'admin@quintern.com',
      password: 'Quintern@2026',
    }),
  });
  const tokens = await loginRes.json();
  const accessToken = tokens.accessToken;
  if (!accessToken) {
    console.error('No access token');
    process.exit(1);
  }

  // 2. Connect to Socket.IO
  const sock = io('http://localhost:5000', {
    path: '/socket.io',
    auth: { token: accessToken },
    transports: ['websocket'],
  });

  let connected = false;
  sock.on('connect', () => {
    connected = true;
    console.log('  ✓ connected  sid=' + sock.id);
    // Heartbeat round-trip
    sock.emit('ping:client', Date.now(), (resp) => {
      console.log(`  ✓ heartbeat round-trip  rtt=${Date.now() - resp.ts}ms`);
    });
  });
  sock.on('connect_error', (err) => {
    console.error('  ✗ connect_error:', err.message);
    process.exit(1);
  });
  sock.on('disconnect', (reason) => {
    console.log('  - disconnect:', reason);
  });
  sock.on('presence:update', (p) => {
    console.log('  ✓ presence:update  ' + JSON.stringify(p));
  });

  // 3. Wait 2s, then disconnect
  await new Promise((r) => setTimeout(r, 1500));
  if (connected) {
    console.log('  ✓ Socket.IO fully functional');
    sock.disconnect();
    process.exit(0);
  } else {
    console.error('  ✗ never connected');
    process.exit(1);
  }
})();
