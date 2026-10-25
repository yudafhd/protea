import test from 'node:test';
import assert from 'node:assert/strict';
import { readJson } from '../src/server/request';

function request(origin: string, host = 'localhost:3000') {
  return new Request('http://0.0.0.0:3000/api/rsvp', {
    method: 'POST', headers: { origin, host, 'content-type': 'application/json' }, body: '{"name":"Tamu"}',
  });
}

test('JSON accepts the contacted host when Next binds to all interfaces', async () => {
  assert.deepEqual(await readJson(request('http://localhost:3000'), 100), { name: 'Tamu' });
  assert.deepEqual(await readJson(request('http://192.168.1.2:3000', '192.168.1.2:3000'), 100), { name: 'Tamu' });
});

test('JSON rejects cross-site, wrong-port and bound-address origins and ignores forwarded hosts', async () => {
  for (const origin of ['https://other.example', 'http://localhost:3001', 'http://0.0.0.0:3000', 'null']) {
    const value = request(origin);
    value.headers.set('x-forwarded-host', new URL(origin === 'null' ? 'http://other.example' : origin).host);
    await assert.rejects(readJson(value, 100), /origin is not allowed/);
  }
});
