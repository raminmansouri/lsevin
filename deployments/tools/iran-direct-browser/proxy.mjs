// proxy.mjs - tiny local HTTP/HTTPS proxy that sends every connection out over ONE chosen network adapter,
// bypassing VPN/TUN tools (v2rayN, sing-box). Lets a browser on this PC reach Iranian-hosted sites such as
// lsevin.ir the way a normal Iranian visitor would, without touching routes or needing administrator rights.
//
//   node proxy.mjs                 auto-picks the Ethernet adapter address (192.168.x, not a tunnel)
//   LOCAL_IP=192.168.20.100 node proxy.mjs
//   PORT=8899 (default)   listens on 127.0.0.1 only
import http from "node:http";
import net from "node:net";
import os from "node:os";

const PORT = Number(process.env.PORT || 8899);

function pickLocalIp() {
  if (process.env.LOCAL_IP) return process.env.LOCAL_IP;
  const bad = /sing|tun|tap|vpn|wsl|hyper-v|vethernet|virtual|loopback|wireguard|hotspot|vmware|docker|bluetooth/i;
  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    if (bad.test(name)) continue;
    for (const a of addrs || []) {
      if (a.family === "IPv4" && !a.internal && !a.address.startsWith("169.254.") && !a.address.startsWith("172.18.")) {
        candidates.push({ name, address: a.address });
      }
    }
  }
  // prefer an adapter literally called Ethernet, otherwise the first one
  return (candidates.find((c) => /^ethernet/i.test(c.name)) || candidates[0] || {}).address;
}

const localAddress = pickLocalIp();
if (!localAddress) { console.error("no suitable network adapter found; set LOCAL_IP"); process.exit(1); }

const dial = (host, port) => net.connect({ host, port, localAddress });

const server = http.createServer((req, res) => {          // plain http:// requests
  let url;
  try { url = new URL(req.url); } catch { res.writeHead(400).end("bad request"); return; }
  const upstream = http.request({ host: url.hostname, port: url.port || 80, method: req.method, path: url.pathname + url.search,
    headers: req.headers, localAddress }, (up) => { res.writeHead(up.statusCode, up.headers); up.pipe(res); });
  upstream.on("error", (e) => { res.writeHead(502).end("proxy error: " + e.code); });
  req.pipe(upstream);
});

server.on("connect", (req, clientSocket, head) => {        // https:// tunnels
  const [host, port] = req.url.split(":");
  const upstream = dial(host, Number(port) || 443);
  upstream.on("connect", () => { clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n"); if (head.length) upstream.write(head); upstream.pipe(clientSocket); clientSocket.pipe(upstream); });
  const close = () => { upstream.destroy(); clientSocket.destroy(); };
  upstream.on("error", close); clientSocket.on("error", close);
  upstream.setTimeout(60000, close);
});

server.listen(PORT, "127.0.0.1", () => console.log(`direct proxy on 127.0.0.1:${PORT}, outgoing via ${localAddress}`));
