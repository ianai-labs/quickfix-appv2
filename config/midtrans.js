const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-dummy',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dummy',
});

const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-dummy',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dummy',
});

module.exports = { snap, coreApi };
