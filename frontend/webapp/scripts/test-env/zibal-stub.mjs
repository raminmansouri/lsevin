import http from 'node:http';

/**
 * A stand-in for Zibal's gateway (https://gateway.zibal.ir) in local end-to-end runs; the dev
 * server points at it through ZIBAL_API_BASE_URL (ignored in production builds).
 *
 *   POST /v1/request {merchant, amount, callbackUrl, orderId, ...} -> {result: 100, trackId}
 *        merchant "invalid-merchant" -> {result: 102}
 *   GET  /start/:trackId[?outcome=cancel]  the "bank page": redirects to the payment's callbackUrl
 *        with success=1 (or success=0 for outcome=cancel), like Zibal does
 *   POST /v1/verify {merchant, trackId} -> {result: 100, amount, refNumber, cardNumber, ...};
 *        201 when already verified; 102 when the merchant is not the one the payment was made with
 *   GET  /__zibal/payments  every payment (merchant, amount, callbackUrl, verified) for assertions
 *   DELETE /__zibal/payments  clear
 */
export function startZibalStub(port) {
  const payments = new Map();
  let nextTrackId = 3_000_000_001;

  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://stub');
    const send = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    const readJson = () =>
      new Promise((resolve) => {
        let raw = '';
        request.on('data', (chunk) => { raw += chunk; });
        request.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve(null); } });
      });

    if (url.pathname === '/__zibal/payments') {
      if (request.method === 'DELETE') { payments.clear(); return send(200, { ok: true }); }
      return send(200, [...payments.values()]);
    }

    if (request.method === 'POST' && url.pathname === '/v1/request') {
      readJson().then((body) => {
        if (!body || !body.merchant || !body.callbackUrl || !Number.isInteger(body.amount)) return send(200, { result: 104, message: 'bad request' });
        if (body.merchant === 'invalid-merchant') return send(200, { result: 102, message: 'merchant not found' });
        if (body.amount < 1000) return send(200, { result: 105, message: 'amount too small' });
        const trackId = nextTrackId++;
        payments.set(trackId, {
          trackId, merchant: body.merchant, amount: body.amount, callbackUrl: body.callbackUrl,
          orderId: body.orderId ?? null, mobile: body.mobile ?? null, description: body.description ?? null,
          verified: false, verifyCalls: 0,
        });
        return send(200, { result: 100, trackId, message: 'success' });
      });
      return;
    }

    const start = /^\/start\/(\d+)$/.exec(url.pathname);
    if (request.method === 'GET' && start) {
      const payment = payments.get(Number(start[1]));
      if (!payment) { response.writeHead(404).end('unknown trackId'); return; }
      const cancelled = url.searchParams.get('outcome') === 'cancel';
      payment.paid = !cancelled;
      const back = new URL(payment.callbackUrl);
      back.searchParams.set('success', cancelled ? '0' : '1');
      back.searchParams.set('status', cancelled ? '3' : '2');
      back.searchParams.set('trackId', String(payment.trackId));
      if (payment.orderId) back.searchParams.set('orderId', String(payment.orderId));
      response.writeHead(302, { Location: back.toString() }).end();
      return;
    }

    if (request.method === 'POST' && url.pathname === '/v1/verify') {
      readJson().then((body) => {
        const payment = payments.get(Number(body?.trackId));
        if (!payment) return send(200, { result: 203, message: 'invalid trackId' });
        payment.verifyCalls += 1;
        if (body.merchant !== payment.merchant) return send(200, { result: 102, message: 'merchant not found' });
        if (!payment.paid) return send(200, { result: 202, message: 'not paid' });
        if (payment.verified) return send(200, { result: 201, message: 'already verified', amount: payment.amount, refNumber: 900000 + (payment.trackId % 100000) });
        payment.verified = true;
        return send(200, {
          result: 100, message: 'success', status: 1,
          amount: payment.amount, orderId: payment.orderId,
          refNumber: 900000 + (payment.trackId % 100000), cardNumber: '603799******1234',
          paidAt: new Date().toISOString(),
        });
      });
      return;
    }

    send(404, { result: -1, message: 'not stubbed' });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
