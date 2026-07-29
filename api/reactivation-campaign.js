import { timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

const DEFAULT_API_BASE_URL = 'https://subrouter.ai';
const DEFAULT_INACTIVE_DAYS = 30;
const MAX_PAGES = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEGMENT_PREFIX = 'API-Route dormant';

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

const toUnixSeconds = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const number = Number(value);
  if (Number.isFinite(number)) return number > 1e12 ? Math.floor(number / 1000) : Math.floor(number);
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
};

const firstValue = (record, keys) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== '') return record[key];
  }
  return null;
};

const identityKeys = (record, includeOwnId = false) => {
  const keys = new Set();
  const id = firstValue(record, includeOwnId
    ? ['user_id', 'userId', 'uid', 'id']
    : ['user_id', 'userId', 'uid']);
  const username = firstValue(record, ['username', 'user_name', 'userName']);
  const email = String(firstValue(record, ['email', 'user_email']) || '').trim().toLowerCase();

  if (id !== null) keys.add(`id:${id}`);
  if (username !== null) keys.add(`username:${String(username).trim().toLowerCase()}`);
  if (EMAIL_PATTERN.test(email)) keys.add(`email:${email}`);
  return [...keys];
};

const isDisabled = (customer) => {
  if (customer?.enabled === false || customer?.is_active === false || customer?.isActive === false) return true;
  const status = String(customer?.status ?? '').trim().toLowerCase();
  return ['0', 'disabled', 'banned', 'deleted'].includes(status);
};

const getCreatedAt = (customer) => toUnixSeconds(firstValue(customer, [
  'created_at',
  'createdAt',
  'create_time',
  'registered_at',
  'registration_time',
]));

const getLogCreatedAt = (log) => toUnixSeconds(firstValue(log, [
  'created_at',
  'createdAt',
  'create_time',
  'timestamp',
]));

export function selectDormantCustomers(customers, logs, inactiveDays, nowSeconds = Math.floor(Date.now() / 1000)) {
  const cutoff = nowSeconds - inactiveDays * 86400;
  const activeKeys = new Set();
  let logsWithoutIdentity = 0;

  for (const log of logs) {
    const createdAt = getLogCreatedAt(log);
    if (createdAt && createdAt < cutoff) continue;
    const keys = identityKeys(log);
    if (!keys.length) {
      logsWithoutIdentity += 1;
      continue;
    }
    keys.forEach((key) => activeKeys.add(key));
  }

  const dormantByEmail = new Map();
  const skipped = {
    invalid_email: 0,
    disabled: 0,
    missing_created_at: 0,
    too_new: 0,
    missing_identity: 0,
    recently_active: 0,
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

    const createdAt = getCreatedAt(customer);
    if (!createdAt) {
      skipped.missing_created_at += 1;
      continue;
    }
    if (createdAt > cutoff) {
      skipped.too_new += 1;
      continue;
    }

    const keys = identityKeys(customer, true);
    if (!keys.length) {
      skipped.missing_identity += 1;
      continue;
    }
    if (keys.some((key) => activeKeys.has(key))) {
      skipped.recently_active += 1;
      continue;
    }

    dormantByEmail.set(email, { email });
  }

  return {
    dormant: [...dormantByEmail.values()],
    activeKeyCount: activeKeys.size,
    logsWithoutIdentity,
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
    payload?.logs,
  ];
  return candidates.find(Array.isArray) || null;
};

const extractTotal = (payload) => Number(
  payload?.total
  ?? payload?.data?.total
  ?? payload?.data?.count
  ?? 0,
);

async function fetchAll(baseUrl, path, credentials, params, pageSize) {
  const records = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(path, baseUrl);
    Object.entries({ ...params, page, p: page, page_size: pageSize }).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'New-Api-User': credentials.userId,
      },
    });
    const payload = await upstream.json();
    if (!upstream.ok || payload?.success === false) {
      throw new Error(payload?.message || `${path} returned ${upstream.status}`);
    }

    const items = extractItems(payload);
    if (!items) throw new Error(`${path} returned an unsupported response shape`);
    records.push(...items);

    const total = extractTotal(payload);
    if (!items.length || (total > 0 && records.length >= total) || (!total && items.length < pageSize)) {
      return records;
    }
  }
  throw new Error(`${path} pagination exceeded ${MAX_PAGES} pages`);
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
    userId: process.env.DISTRIBUTOR_USER_ID,
  };
  if (!credentials.accessToken || !credentials.userId) {
    return response.status(503).json({ success: false, message: 'Distributor API credentials are not configured' });
  }

  const requestedDays = Number(request.method === 'GET'
    ? request.query?.inactive_days
    : request.body?.inactive_days);
  const inactiveDays = Number.isInteger(requestedDays) && requestedDays >= 7 && requestedDays <= 365
    ? requestedDays
    : DEFAULT_INACTIVE_DAYS;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const cutoff = nowSeconds - inactiveDays * 86400;
  const baseUrl = (process.env.DISTRIBUTOR_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  try {
    const [customers, logs] = await Promise.all([
      fetchAll(baseUrl, '/api/distributor/customers', credentials, {}, 100),
      fetchAll(baseUrl, '/api/distributor/logs', credentials, {
        type: 2,
        start_timestamp: cutoff,
        end_timestamp: nowSeconds,
      }, 1000),
    ]);
    const selection = selectDormantCustomers(customers, logs, inactiveDays, nowSeconds);
    const preview = {
      inactive_days: inactiveDays,
      customer_count: customers.length,
      recent_log_count: logs.length,
      dormant_count: selection.dormant.length,
      sample: selection.dormant.slice(0, 10).map(({ email }) => maskEmail(email)),
      skipped: selection.skipped,
      logs_without_identity: selection.logsWithoutIdentity,
    };

    if (request.method === 'GET') {
      if (request.query?.format === 'csv') {
        response.setHeader('Content-Type', 'text/csv; charset=utf-8');
        response.setHeader('Content-Disposition', `attachment; filename="dormant-users-${inactiveDays}d.csv"`);
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
    if (!logs.length && request.body?.allow_empty_activity !== true) {
      return response.status(409).json({
        success: false,
        message: 'No recent logs were returned; preparation stopped to avoid targeting every customer',
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
    const date = new Date(nowSeconds * 1000).toISOString().slice(0, 10);
    const segmentName = `${SEGMENT_PREFIX} ${inactiveDays}d ${date}`;
    const draftName = `API-Route reactivation ${inactiveDays}d ${date}`;
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
