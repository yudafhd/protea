import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { loadWizardWishes } from '../src/server/wizard-wishes';

const deployment = 'https://script.google.com/macros/s/example-deployment/exec';

test('wishes need an Apps Script source and expose only valid names and messages', async () => {
  assert.deepEqual(await loadWizardWishes(''), { status: 'unconfigured', wishes: [] });
  for (const url of ['http://localhost/feed', 'https://script.google.com.evil.example/macros/s/a/exec', 'https://script.google.com/macros/s/a/dev']) {
    await assert.rejects(loadWizardWishes(url, async () => { throw new Error('Must not fetch'); }), /deployment URL/);
  }
  const result = await loadWizardWishes(deployment, async () => Response.json({ wishes: [
    { name: '  Tamu Satu  ', message: '  Selamat & bahagia!  ', email: 'private@example.com', guests: 2 },
    { name: 'Tamu tanpa doa', message: '   ' },
    { name: '', message: 'Tanpa nama' },
    { name: 'Ucapan HTML', message: '<img src=x onerror=alert(1)>' },
  ] }));
  assert.deepEqual(result, { status: 'ready', wishes: [
    { name: 'Tamu Satu', message: 'Selamat & bahagia!' },
    { name: 'Ucapan HTML', message: '<img src=x onerror=alert(1)>' },
  ] });
  for (const response of [new Response('Login required', { status: 403 }), new Response('<html>Login</html>'), Response.json({ error: 'Not configured' })]) {
    await assert.rejects(loadWizardWishes(deployment, async () => response));
  }
});

test('Google Apps Script reads submitted wishes newest first without exposing other answers', async () => {
  const properties = new Map<string, string>();
  const makeResponse = (name: string, message: string) => ({ getItemResponses: () => [
    ['Nama Lengkap', name], ['Ucapan & Doa', message], ['Email', 'private@example.com'], ['Kehadiran', 'Ya, saya akan hadir'],
  ].map(([title, value]) => ({ getItem: () => ({ getTitle: () => title }), getResponse: () => value })) });
  const form = {
    getId: () => 'editor-form-id',
    getItems: () => ['Nama Lengkap', 'Ucapan & Doa'].map((title) => ({ getTitle: () => title })),
    getResponses: () => [makeResponse('Pertama', 'Doa pertama'), makeResponse('Tanpa ucapan', ''), makeResponse('Terbaru', 'Doa terbaru')],
  };
  const context = vm.createContext({
    FormApp: { getActiveForm: () => form, openById: (id: string) => { assert.equal(id, 'editor-form-id'); return form; } },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key: string) => properties.get(key), setProperty: (key: string, value: string) => properties.set(key, value),
    }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (body: string) => ({ setMimeType: () => body }) },
  });
  vm.runInContext(await readFile(new URL('../scripts/wizard-wishes-google-apps-script.gs', import.meta.url), 'utf8'), context);
  assert.throws(() => vm.runInContext('doGet()', context), /setupWizardWishes/);
  vm.runInContext('setupWizardWishes()', context);
  assert.deepEqual(JSON.parse(vm.runInContext('doGet()', context)), { wishes: [
    { name: 'Terbaru', message: 'Doa terbaru' }, { name: 'Pertama', message: 'Doa pertama' },
  ] });
});
