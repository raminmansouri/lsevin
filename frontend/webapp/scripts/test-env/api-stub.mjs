import http from 'node:http';

/**
 * A stand-in for the .NET API (INTERNAL_API_URL) in local end-to-end runs. The API does not run in
 * the local test environment, so tests register the responses they need:
 *
 *   POST   /__stub/routes  { method?: "GET", path: "/category-module/admin/categories", status?: 200, body: {...} }
 *   DELETE /__stub/routes  (clear all)
 *
 * A request matches a route when its pathname ends with the registered path (the API base path and
 * query string are ignored). Anything unregistered answers 404, so a page that needs more of the API
 * fails loudly instead of rendering made-up data. Every request is recorded at GET /__stub/requests.
 */
export function startApiStub(port) {
  const routes = new Map();
  const requests = [];
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://stub');
    const send = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    if (url.pathname === '/__stub/routes') {
      if (request.method === 'DELETE') { routes.clear(); requests.length = 0; return send(200, { ok: true }); }
      let raw = '';
      request.on('data', (chunk) => { raw += chunk; });
      request.on('end', () => {
        try {
          const route = JSON.parse(raw);
          routes.set(`${(route.method ?? 'GET').toUpperCase()} ${route.path}`, { status: route.status ?? 200, body: route.body ?? {} });
          send(200, { ok: true });
        } catch {
          send(400, { error: 'invalid route json' });
        }
      });
      return;
    }
    if (url.pathname === '/__stub/requests') return send(200, requests);
    requests.push(`${request.method} ${url.pathname}`);
    for (const [key, route] of routes) {
      const [method, path] = key.split(' ');
      if (method === request.method && url.pathname.endsWith(path)) return send(route.status, route.body);
    }
    send(404, { title: 'Not stubbed', detail: `${request.method} ${url.pathname} is not registered with the API stub`, status: 404 });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
