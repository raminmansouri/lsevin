import { expect, test, type BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';

const base = process.env.E2E_BASE_URL || 'http://localhost:3100';
const apiBase = process.env.E2E_API_BASE_URL || 'http://localhost:5003';
const secret = process.env.E2E_AUTH_SECRET || '';
const tokens = {
  owner: process.env.E2E_API_TOKEN_A || '',
  other: process.env.E2E_API_TOKEN_B || '',
  admin: process.env.E2E_API_TOKEN_ADMIN || '',
};
const users = {
  owner: '11111111-1111-1111-1111-111111111111',
  other: '22222222-2222-2222-2222-222222222222',
  admin: process.env.E2E_ADMIN_USER_ID || '33333333-3333-3333-3333-333333333333',
};
const local = ['localhost', '127.0.0.1'].includes(new URL(base).hostname);
test.skip(!local || !secret || Object.values(tokens).some((token) => !token),
  'Local full-stack test requires E2E_AUTH_SECRET and three test API tokens.');

async function signIn(context: BrowserContext, kind: keyof typeof users) {
  const now = Date.now();
  const value = await encode({
    secret, salt: 'authjs.session-token',
    token: {
      sub: users[kind], roles: [kind === 'admin' ? 'superadmin' : 'user'],
      user: { id: users[kind], roles: [kind === 'admin' ? 'superadmin' : 'user'],
        accessToken: tokens[kind], accessTokenExpires: now + 3_600_000,
        refreshTokenExpires: now + 7_200_000 },
    } as never,
  });
  await context.addCookies([{ name: 'authjs.session-token', value,
    domain: new URL(base).hostname, path: '/', httpOnly: true, sameSite: 'Lax' }]);
}

test('customer upload is private, owner scoped, and visible to admins', async ({ browser }) => {
  const owner = await browser.newContext();
  const other = await browser.newContext();
  const admin = await browser.newContext();
  let mediaId = '';
  try {
    await Promise.all([signIn(owner, 'owner'), signIn(other, 'other'), signIn(admin, 'admin')]);
    const upload = await owner.request.post(`${base}/api/admin/media/storage`, {
      multipart: { file: { name: 'e2e-medical-document.pdf', mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 e2e medical document') } },
    });
    const uploadBody = await upload.text();
    expect(upload.status(), uploadBody.slice(0, 300)).toBe(200);
    const created = JSON.parse(uploadBody) as { id: string; fileUrl: string };
    mediaId = created.id;
    expect(created.fileUrl).toBe(`/api/media/private/${mediaId}`);

    const ownerList = await (await owner.request.get(`${base}/api/admin/media?search=e2e-medical-document`)).json();
    expect(ownerList.items.some((item: { id: string }) => item.id === mediaId)).toBe(true);
    const otherList = await (await other.request.get(`${base}/api/admin/media?search=e2e-medical-document`)).json();
    expect(otherList.items.some((item: { id: string }) => item.id === mediaId)).toBe(false);
    expect((await other.request.get(`${base}/api/admin/media/${mediaId}`)).status()).toBe(404);
    expect((await other.request.get(`${base}${created.fileUrl}`)).status()).toBe(404);
    expect((await owner.request.get(`${base}${created.fileUrl}`)).status()).toBe(200);
    expect((await admin.request.get(`${base}${created.fileUrl}`)).status()).toBe(200);
    const record = await (await admin.request.get(`${base}/api/admin/media/${mediaId}`)).json() as { storageKey: string };
    const deletion = await admin.request.delete(`${base}/api/admin/media/${mediaId}`);
    expect(deletion.status()).toBe(200);
    expect((await deletion.json()).objectDeleted).toBe(true);
    mediaId = '';
    expect((await owner.request.get(`${apiBase}/files/${record.storageKey}`, {
      headers: { Authorization: `Bearer ${tokens.owner}` },
    })).status()).toBe(404);
  } finally {
    if (mediaId) expect((await admin.request.delete(`${base}/api/admin/media/${mediaId}`)).status()).toBe(200);
    await Promise.all([owner.close(), other.close(), admin.close()]);
  }
});

test('admin document picker stores documents in a private admin folder', async ({ browser }) => {
  const admin = await browser.newContext();
  let mediaId = '';
  try {
    await signIn(admin, 'admin');
    const upload = await admin.request.post(`${base}/api/admin/media/storage?scope=customer-documents`, {
      multipart: { file: { name: 'e2e-admin-document.pdf', mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 admin e2e document') } },
    });
    const body = await upload.text();
    expect(upload.status(), body.slice(0, 200)).toBe(200);
    const created = JSON.parse(body) as { id: string; fileUrl: string };
    mediaId = created.id;
    expect(created.fileUrl).toBe(`/api/media/private/${mediaId}`);
    expect((await admin.request.get(`${base}${created.fileUrl}`)).status()).toBe(200);
  } finally {
    if (mediaId) expect((await admin.request.delete(`${base}/api/admin/media/${mediaId}`)).status()).toBe(200);
    await admin.close();
  }
});

test('admin document form uses the media picker and keeps the selected file', async ({ browser }) => {
  const admin = await browser.newContext();
  let mediaId = '';
  try {
    await signIn(admin, 'admin');
    const page = await admin.newPage();
    await page.goto(`${base}/fa/admin/platform-data/customer/customer_documents/new`, { waitUntil: 'domcontentloaded' });
    const field = page.locator('input[name="document_url"]');
    await expect(field).toHaveCount(1);
    await page.locator('input[name="document_url"] + div button').first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'e2e-admin-picker.pdf', mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 admin picker e2e'),
    });
    await expect(field).toHaveValue(/\/api\/media\/private\/[0-9a-f-]{36}/);
    mediaId = (await field.inputValue()).split('/').at(-1) || '';
  } finally {
    if (mediaId) expect((await admin.request.delete(`${base}/api/admin/media/${mediaId}`)).status()).toBe(200);
    await admin.close();
  }
});
