import os from "os";

/**
 * Returns the machine's first non-internal IPv4 LAN address.
 * Used by MockPaymentGateway to build a QR URL that phones can actually reach.
 */
export function GET() {
  const nets = os.networkInterfaces();
  let lanIp = null;

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        lanIp = net.address;
        break;
      }
    }
    if (lanIp) break;
  }

  return Response.json({ ip: lanIp });
}
