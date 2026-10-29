
import { test, expect, type Page } from '@playwright/test';
import {
  extractVerificationCode,
  fetchVerificationCodeFromInbox,
  isSalesforceAuthenticated,
} from '../utils/salesforceLogin';

test('extracts a six-digit Salesforce verification code from an email payload', async () => {
  const emailHtml = `
    <html>
      <body>
        <p>Your Salesforce verification code is 942318.</p>
        <p>Use it to complete your sign in.</p>
      </body>
    </html>
  `;

  await expect(extractVerificationCode(emailHtml)).resolves.toBe('942318');
});

test('uses the Mailosaur Basic Auth contract instead of the wrong api-key header', async () => {
  const originalFetch = globalThis.fetch;
  let authHeader: string = '';

  globalThis.fetch = async (
    _url: string | URL | Request,
    options?: RequestInit
  ): Promise<Response> => {
    const headers = new Headers(options?.headers);
    authHeader = headers.get('Authorization') ?? '';

    return new Response(
      JSON.stringify({ messages: [] }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  };

  try {
    await expect(
      fetchVerificationCodeFromInbox({
        apiKey: 'demo-key',
        serverId: 'demo-server',
        inboxId: 'demo-server',
        timeoutMs: 10,
        pollIntervalMs: 0,
      })
    ).rejects.toThrow(
      'Timed out waiting for a Salesforce verification email'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  expect(authHeader).toBe(
    `Basic ${Buffer.from('api:demo-key').toString('base64')}`
  );
});

test('does not treat the Salesforce login URL as an authenticated session', async () => {
  const loginPageStub = {
    url: (): string =>
      'https://orgfarm-b891a9f0fa-dev-ed.develop.my.salesforce.com/?ec=302&startURL=%2Fvisualforce%2Fsession%3Furl%3Dhttps%253A%252F%252Forgfarm-b891a9f0fa-dev-ed.develop.lightning.force.com%252Flightning%252Fpage%252Fhome',

    getByRole: () => ({
      first: () => ({
        waitFor: async (): Promise<void> => {
          throw new Error('not visible');
        },
      }),
    }),
  };

  await expect(
    isSalesforceAuthenticated(
      loginPageStub as unknown as Page,
      1000
    )
  ).resolves.toBe(false);
});
