import { timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

const DEFAULT_API_BASE_URL = 'https://subrouter.ai';
const MAX_PAGES = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEGMENT_PREFIX = 'API-Route zero balance zero usage';

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const firstValue = (record, keys) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== '') return record[key];
  }
  return null;
};

const isDisabled = (customer) => {
  if (customer?.enabled === false || customer?.is_active === false || customer?.isActive === false) return true;
  const status = String(customer?.status ?? '').trim().toLowerCase();
  return ['0', 'disabled', 'banned', 'deleted'].includes(status);
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(String(value).replaceAll(',', ''));
  return Number.isFinite(number) ? number : null;
};

export function selectDormantCustomers(customers) {
  const dormantByEmail = new Map();
  const skipped = {
    invalid_email: 0,
    disabled: 0,
    missing_balance: 0,
    missing_usage: 0,
    non_zero_balance: 0,
    non_zero_usage: 0,
  };

  for (const customer of customers) {
    const email = String(customer?.email || '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      skipped.invalid_email += 1;
      continue;
    }
    if (isDisabled(customer)) {
      skipped.disabled += 1;
      continue;
    }

    const balance = toNumber(firstValue(customer, [
      'quota',
      'balance',
      'remaining_quota',
      'remainingQuota',
    ]));
    const usage = toNumber(firstValue(customer, [
      'used_quota',
      'usedQuota',
      'consumed_quota',
      'consumedQuota',
      'usage',
    ]));
    if (balance === null) {
      skipped.missing_balance += 1;
      continue;
    }
    if (usage === null) {
      skipped.missing_usage += 1;
      continue;
    }
    if (balance !== 0) {
      skipped.non_zero_balance += 1;
      continue;
    }
    if (usage !== 0) {
      skipped.non_zero_usage += 1;
      continue;
    }

    dormantByEmail.set(email, { email });
  }

  return {
    dormant: [...dormantByEmail.values()],
    skipped,
  };
}

const extractItems = (payload) => {
  const candidates = [
    payload?.data,
    payload?.data?.items,
    payload?.data?.data,
    payload?.items,
    payload?.customers,
  ];
  return candidates.find(Array.isArray) || null;
};

const extractTotal = (payload) => Number(
  payload?.total
  ?? payload?.data?.total
  ?? payload?.data?.count
  ?? 0,
);

async function fetchPage(baseUrl, path, credentials, params, page, pageSize) {
  const url = new URL(path, baseUrl);
  Object.entries({ ...params, page, p: page, page_size: pageSize }).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const upstream = await fetch(url, {
    headers: buildDistributorHeaders(credentials),
    signal: AbortSignal.timeout(15000),
  });
  const payload = await upstream.json();
  if (!upstream.ok || payload?.success === false) {
    throw new Error(payload?.message || `${path} returned ${upstream.status}`);
  }

  const items = extractItems(payload);
  if (!items) throw new Error(`${path} returned an unsupported response shape`);
  return { items, total: extractTotal(payload) };
}

async function fetchAll(baseUrl, path, credentials, params, pageSize) {
  const records = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { items, total } = await fetchPage(baseUrl, path, credentials, params, page, pageSize);
    records.push(...items);

    if (!items.length || (total > 0 && records.length >= total) || (!total && items.length < pageSize)) {
      return records;
    }
  }
  throw new Error(`${path} pagination exceeded ${MAX_PAGES} pages`);
}

export function buildDistributorHeaders({ accessToken, sessionCookie, userId }) {
  const headers = { 'New-Api-User': String(userId) };
  if (sessionCookie) {
    headers.Cookie = String(sessionCookie).trim().startsWith('session=')
      ? String(sessionCookie).trim()
      : `session=${String(sessionCookie).trim()}`;
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
};

const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;

const campaignCopy = {
  subject: 'API-Route：欢迎回来 / Welcome back',
  html: `
    <div style="max-width:640px;margin:auto;font-family:Arial,sans-serif;line-height:1.7;color:#332b25">
      <h1 style="font-size:24px">欢迎回来 / Welcome back</h1>
      <p>你的 API-Route 账户仍可正常使用。现在可以继续通过一个 API 调用 GPT、Claude、Gemini 等主流模型。</p>
      <p>Your API-Route account is still ready to use. Access GPT, Claude, Gemini, and other leading models through one API.</p>
      <p>API-Route アカウントは引き続きご利用いただけます。1つの API から主要な AI モデルへアクセスできます。</p>
      <p>API-Route 계정은 계속 이용할 수 있습니다. 하나의 API로 주요 AI 모델을 다시 사용해 보세요.</p>
      <p style="margin:28px 0">
        <a href="https://www.api-route.com/dashboard" style="display:inline-block;padding:12px 22px;border-radius:10px;background:#dd7958;color:#fff;text-decoration:none">
          打开 API-Route / Open API-Route
        </a>
      </p>
      <p style="font-size:12px;color:#817469">
        不想再收到此类邮件？
        <a href="{{{RESEND_UNSUBSCRIBE_URL}}}">退订 / Unsubscribe / 配信停止 / 수신 거부</a>
      </p>
    </div>
  `,
  text: `欢迎回来 / Welcome back

你的 API-Route 账户仍可正常使用。现在可以继续通过一个 API 调用 GPT、Claude、Gemini 等主流模型。
Your API-Route account is still ready to use. Access leading AI models through one API.

https://www.api-route.com/dashboard

退订 / Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`,
};

async function findOrCreateSegment(resend, name) {
  const listed = await resend.segments.list({ limit: 100 });
  if (listed.error) throw new Error(listed.error.message);
  const existing = listed.data?.data?.find((segment) => segment.name === name);
  if (existing) return existing;

  const created = await resend.segments.create({ name });
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

async function findOrCreateDraft(resend, name, segmentId) {
  const listed = await resend.broadcasts.list({ limit: 100 });
  if (listed.error) throw new Error(listed.error.message);
  const existing = listed.data?.data?.find((broadcast) => broadcast.name === name && broadcast.status === 'draft');
  if (existing) return existing;

  const created = await resend.broadcasts.create({
    name,
    segmentId,
    from: process.env.REACTIVATION_FROM || 'API-Route <support@api-route.com>',
    replyTo: process.env.REACTIVATION_REPLY_TO || 'support@api-route.com',
    subject: campaignCopy.subject,
    html: campaignCopy.html,
    text: campaignCopy.text,
    send: false,
  });
  if (created.error) throw new Error(created.error.message);
  return created.data;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store');
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const providedSecret = request.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  if (!process.env.MAILING_API_SECRET || !safeEqual(providedSecret, process.env.MAILING_API_SECRET)) {
    return response.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const credentials = {
    accessToken: process.env.DISTRIBUTOR_ACCESS_TOKEN,
    sessionCookie: process.env.DISTRIBUTOR_SESSION_COOKIE,
    userId: process.env.DISTRIBUTOR_USER_ID,
  };
  if ((!credentials.accessToken && !credentials.sessionCookie) || !credentials.userId) {
    return response.status(503).json({ success: false, message: 'Distributor API credentials are not configured' });
  }

  const baseUrl = (process.env.DISTRIBUTOR_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  try {
    if (request.method === 'GET' && request.query?.inspect === '1') {
      const customerPage = await fetchPage(baseUrl, '/api/distributor/customers', credentials, {}, 1, 1);
      return response.status(200).json({
        success: true,
        data: {
          customers: {
            page_count: customerPage.items.length,
            total: customerPage.total,
            fields: Object.keys(customerPage.items[0] || {}).sort(),
          },
        },
      });
    }

    const customers = await fetchAll(baseUrl, '/api/distributor/customers', credentials, {}, 100);
    const selection = selectDormantCustomers(customers);
    const preview = {
      rule: 'balance = 0 and usage = 0',
      customer_count: customers.length,
      dormant_count: selection.dormant.length,
      sample: selection.dormant.slice(0, 10).map(({ email }) => maskEmail(email)),
      skipped: selection.skipped,
    };

    if (request.method === 'GET') {
      if (request.query?.format === 'csv') {
        response.setHeader('Content-Type', 'text/csv; charset=utf-8');
        response.setHeader('Content-Disposition', 'attachment; filename="zero-balance-zero-usage-users.csv"');
        return response.status(200).send(`email\n${selection.dormant.map(({ email }) => csvCell(email)).join('\n')}`);
      }
      return response.status(200).json({ success: true, data: preview });
    }
    if (request.body?.confirm !== 'PREPARE_REACTIVATION') {
      return response.status(400).json({
        success: false,
        message: 'Set confirm to PREPARE_REACTIVATION after reviewing the GET preview',
        data: preview,
      });
    }
    if (!selection.dormant.length) {
      return response.status(200).json({ success: true, data: { ...preview, prepared: false } });
    }
    if (!process.env.RESEND_API_KEY) {
      return response.status(503).json({ success: false, message: 'RESEND_API_KEY is not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const date = new Date().toISOString().slice(0, 10);
    const segmentName = `${SEGMENT_PREFIX} ${date}`;
    const draftName = `API-Route reactivation zero usage ${date}`;
    const segment = await findOrCreateSegment(resend, segmentName);
    const csv = `email\n${selection.dormant.map(({ email }) => csvCell(email)).join('\n')}`;
    const imported = await resend.contacts.imports.create({
      file: new Blob([csv], { type: 'text/csv' }),
      columnMap: { email: 'email' },
      onConflict: 'upsert',
      segments: [{ id: segment.id }],
    });
    if (imported.error) throw new Error(imported.error.message);

    const draft = await findOrCreateDraft(resend, draftName, segment.id);
    return response.status(200).json({
      success: true,
      data: {
        ...preview,
        prepared: true,
        segment_id: segment.id,
        import_id: imported.data?.id,
        broadcast_id: draft.id,
        next_step: 'Wait for the contact import to complete, review the draft in Resend, then send it manually.',
      },
    });
  } catch (error) {
    return response.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Reactivation preparation failed',
    });
  }
}
