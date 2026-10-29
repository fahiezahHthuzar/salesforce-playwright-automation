import fs from 'node:fs';
import path from 'node:path';

export function getSalesforceCredentials() {
  return {
    username: process.env.SALESFORCE_USERNAME,
    password: process.env.SALESFORCE_PASSWORD,
  };
}

export function getInboxSettings() {
  return {
    apiKey: process.env.MAILOSAUR_API_KEY,
    serverId: process.env.MAILOSAUR_SERVER_ID,
    inboxId: process.env.MAILOSAUR_INBOX_ID,
  };
}

export function extractVerificationCode(rawMessage = '') {
  const normalized = String(rawMessage)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const matches = normalized.match(/\b\d{6}\b/g) || [];

  const code = matches.find((value) => {
    const number = Number.parseInt(value, 10);
    return number >= 100000 && number <= 999999;
  });

  if (!code) {
    return Promise.reject(
      new Error('No six-digit Salesforce verification code was found in the inbox message body.')
    );
  }

  return Promise.resolve(code);
}

export async function fetchVerificationCodeFromInbox(options: {
  apiKey?: string;
  serverId?: string;
  inboxId?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  receivedAfter?: Date;
} = {}) {
  const {
    apiKey = process.env.MAILOSAUR_API_KEY,
    serverId = process.env.MAILOSAUR_SERVER_ID,
    inboxId = process.env.MAILOSAUR_INBOX_ID,
    timeoutMs = 120000,
    pollIntervalMs = 5000,
    receivedAfter = new Date(),
  } = options;

  if (!apiKey || !serverId) {
    throw new Error(
      'Missing Mailosaur server configuration. Set MAILOSAUR_API_KEY and MAILOSAUR_SERVER_ID in the environment before running the login flow.'
    );
  }

  const basicAuth = Buffer.from(`api:${apiKey}`).toString('base64');
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const params = new URLSearchParams({ server: serverId, itemsPerPage: '20', receivedAfter:  receivedAfter.toISOString()});
    if (inboxId) {
      params.set('sentTo', `${inboxId}@${serverId}.mailosaur.net`);
    }

    const listResponse = await fetch(`https://mailosaur.com/api/messages?${params.toString()}`, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Accept: 'application/json',
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      throw new Error(`Mailosaur request failed (${listResponse.status}): ${errorText}`);
    }

    const payload = await listResponse.json();
    const messages = Array.isArray(payload.messages) ? payload.messages : Array.isArray(payload.items) ? payload.items : [];

    for (const message of messages) {
      const messageId = message.id;
      if (!messageId) continue;

      const detailResponse = await fetch(`https://mailosaur.com/api/messages/${encodeURIComponent(messageId)}`, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: 'application/json',
        },
      });

      if (!detailResponse.ok) {
        continue;
      }

      const messageDetail = await detailResponse.json();
      const combinedText = [
        messageDetail.subject,
        messageDetail.html?.body,
        messageDetail.text?.body,
      ].filter(Boolean).join('\n');

      try {
        const code = await extractVerificationCode(combinedText);
        if (code) {
          return code;
        }
      } catch {
        // The message may not be the Salesforce verification email yet, so continue polling.
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Timed out waiting for a Salesforce verification email in the disposable inbox.');
}

export async function saveStorageState(context: any, storageStatePath = 'storage/storageState.json') {
  const resolved = path.resolve(storageStatePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });

  let state = {
    cookies: [],
    origins: [],
  };

  try {
    state = await context.storageState();
  } catch {
    try {
      const cookies = await context.cookies();
      state = { cookies, origins: [] };
    } catch {
      state = { cookies: [], origins: [] };
    }
  }

  const safeState = {
    cookies: Array.isArray(state.cookies) ? state.cookies : [],
    origins: Array.isArray(state.origins) ? state.origins : [],
  };

  fs.writeFileSync(resolved, JSON.stringify(safeState, null, 2));
  return resolved;
}

export async function completeSalesforceVerification(page: any, options: { verificationCode?: string; verifyButtonName?: RegExp; timeoutMs?: number } = {}) {
  const { verificationCode, verifyButtonName = /verify/i, timeoutMs = 30000 } = options;

  const verificationField = page
    .getByLabel(/verification code/i)
    .or(page.locator('input[name="verificationCode"], input#verificationCode, input[autocomplete="one-time-code"], input[aria-label*="Verification Code" i], [data-testid*="verification"], input[placeholder*="Verification Code" i]'))
    .first();

  const verifyButton = page.getByRole('button', { name: verifyButtonName }).first();

  await verificationField.waitFor({ state: 'visible', timeout: timeoutMs });
  await verificationField.fill(String(verificationCode));
  await verifyButton.click();
}

export async function isSalesforceAuthenticated(page: any, timeoutMs = 15000) {
  try {
    const appLauncher = page.getByRole('button', { name: /app launcher/i }).first();
    await appLauncher.waitFor({ state: 'visible', timeout: timeoutMs });
    return true;
  } catch {
    const currentUrl = page.url();
    const isAuthenticatedHome = /lightning\.force\.com\/lightning\/page\/home|lightning\.force\.com\/lightning\/r\//i.test(currentUrl);
    const isLoginPage = /my\.salesforce\.com\/?$|\/login|visualforce\/session|login-messages/i.test(currentUrl);
    return isAuthenticatedHome && !isLoginPage;
  }
}

export async function loginToSalesforce(page: any, options: {
  username?: string;
  password?: string;
  homeUrl?: string;
  loginUrl?: string;
  storageStatePath?: string;
  inboxSettings?: any;
  timeoutMs?: number;
} = {}) {
  const {
    username = process.env.SALESFORCE_USERNAME,
    password = process.env.SALESFORCE_PASSWORD,
    homeUrl = process.env.SALESFORCE_HOME_URL,
    loginUrl = process.env.SALESFORCE_LOGIN_URL,
    storageStatePath = 'storage/storageState.json',
    inboxSettings = getInboxSettings(),
    timeoutMs = 30000,
  } = options;

  await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });

  const authenticated = await isSalesforceAuthenticated(page, 5000).catch(() => false);
  if (authenticated) {
    await saveStorageState(page.context(), storageStatePath);
    return true;
  }

  if (!username || !password) {
    throw new Error('Salesforce username and password must be supplied via environment variables or the login helper arguments when the cached session is invalid or missing.');
  }

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  const usernameField = page
    .locator('input[name="username"], input#username, input[type="email"], input[autocomplete="username"]')
    .first();

  await usernameField.waitFor({ state: 'visible', timeout: timeoutMs });
  await usernameField.fill(username);
  await page.getByRole('button', { name: /log in/i }).click();

  const passwordField = page.locator('input[name="password"], input#password, input[type="password"]').first();
  await passwordField.waitFor({ state: 'visible', timeout: timeoutMs });
  await passwordField.fill(password);
  await page.getByRole('button', { name: /log in/i }).click();

  const verificationField = page
    .getByLabel(/verification code/i)
    .or(page.locator('input[name="verificationCode"], input#verificationCode, input[autocomplete="one-time-code"], input[aria-label*="Verification Code" i], input[placeholder*="Verification Code" i]'))
    .first();

  const verificationVisible = await verificationField.isVisible().catch(() => false);

  if (verificationVisible) {
    const code = await fetchVerificationCodeFromInbox(inboxSettings);
    await completeSalesforceVerification(page, { verificationCode: code });
  }

  await page.waitForURL(/lightning\.force\.com|my\.salesforce\.com\/home|salesforce\.com\/lightning/i, {
    timeout: timeoutMs,
  }).catch(async () => {
    const finalUrl = page.url();
    if (!finalUrl.includes('lightning') && !finalUrl.includes('salesforce')) {
      throw new Error(`Salesforce login did not complete successfully. Final URL: ${finalUrl}`);
    }
  });

  await saveStorageState(page.context(), storageStatePath);
  return true;
}
