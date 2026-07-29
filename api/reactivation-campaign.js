import { timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

const DEFAULT_API_BASE_URL = 'https://subrouter.ai';
const MAX_PAGES = 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEGMENT_PREFIX = 'API-Route reactivation';
const QUOTA_PER_USD = 500000;
const CNY_PER_USD = 6.8;
const HIGH_VALUE_USAGE_QUOTA = (100 / CNY_PER_USD) * QUOTA_PER_USD;

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

export function selectDormantCustomers(customers, audience = 'zero_balance_unused') {
  const fundedUnused = audience === 'funded_unused';
  const exhaustedHighValue = audience === 'spent_over_100_exhausted';
  const dormantByEmail = new Map();
  const skipped = {
    invalid_email: 0,
    disabled: 0,
    missing_balance: 0,
    missing_usage: 0,
    non_positive_balance: 0,
    positive_balance: 0,
    non_zero_balance: 0,
    non_zero_usage: 0,
    usage_not_over_100_cny: 0,
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
    if (exhaustedHighValue && balance > 0) {
      skipped.positive_balance += 1;
      continue;
    }
    if (exhaustedHighValue && usage <= HIGH_VALUE_USAGE_QUOTA) {
      skipped.usage_not_over_100_cny += 1;
      continue;
    }
    if (fundedUnused && balance <= 0) {
      skipped.non_positive_balance += 1;
      continue;
    }
    if (!fundedUnused && !exhaustedHighValue && balance !== 0) {
      skipped.non_zero_balance += 1;
      continue;
    }
    if (!exhaustedHighValue && usage !== 0) {
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
  subject: 'API-Route 网页版聊天已上线',
  previewText: '无需配置 App，登录后即可直接与大模型对话。',
  html: `
    <div style="max-width:640px;margin:auto;padding:32px 24px;font-family:Arial,'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.75;color:#332b25">
      <a href="https://www.api-route.com" style="display:inline-block;margin-bottom:24px">
        <img src="https://img.api-route.com/3.png" width="56" alt="API-Route" style="display:block;width:56px;max-width:100%;height:auto;border:0">
      </a>
      <h1 style="margin:0 0 22px;font-size:25px;line-height:1.35">API-Route 网页版聊天已上线</h1>
      <p>你好，</p>
      <p>API-Route 最近有了一些新变化，想与你分享。</p>
      <p>网页版聊天现已上线。登录后选择模型，就可以直接开始对话，无需安装或配置 App，也不需要先了解 API 的使用方法。</p>
      <p>我们还重新整理了模型选择、密钥创建和首次调用流程，让常用功能更容易找到。如果之前的配置步骤让你暂时搁置了使用，现在可以直接从浏览器开始。</p>
      <p style="margin:28px 0">
        <a href="https://www.api-route.com/chats" style="display:inline-block;padding:12px 22px;border-radius:10px;background:#dd7958;color:#fff;text-decoration:none;font-weight:600">
          体验 API-Route 网页版聊天
        </a>
      </p>
      <p style="margin:0;color:#817469">API-Route 团队</p>
      <p style="margin:6px 0 0;font-size:13px">
        官网：<a href="https://www.api-route.com" style="color:#a6533a">https://www.api-route.com</a>
      </p>
      <hr style="margin:32px 0 18px;border:0;border-top:1px solid #ead8cf">
      <p style="font-size:12px;color:#817469">
        你收到这封邮件，是因为曾经注册过 API-Route。
        不想再收到此类邮件？
        <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#817469">点击退订</a>
      </p>
    </div>
  `,
  text: `API-Route 网页版聊天已上线

你好，

API-Route 最近有了一些新变化，想与你分享。

网页版聊天现已上线。登录后选择模型，就可以直接开始对话，无需安装或配置 App，也不需要先了解 API 的使用方法。

我们还重新整理了模型选择、密钥创建和首次调用流程，让常用功能更容易找到。如果之前的配置步骤让你暂时搁置了使用，现在可以直接从浏览器开始。

体验网页版聊天：https://www.api-route.com/chats
官网：https://www.api-route.com

API-Route 团队

你收到这封邮件，是因为曾经注册过 API-Route。
退订：{{{RESEND_UNSUBSCRIBE_URL}}}`,
};

async function findOrCreateSegment(resend, name, recycleOldest = false) {
  const listed = await resend.segments.list({ limit: 100 });
  if (listed.error) throw new Error(listed.error.message);
  const existing = listed.data?.data?.find((segment) => segment.name === name);
  if (existing) return existing;

  let created = await resend.segments.create({ name });
  if (created.error && recycleOldest && /plan includes \d+ segments/i.test(created.error.message)) {
    const broadcasts = await resend.broadcasts.list({ limit: 100 });
    if (broadcasts.error) throw new Error(broadcasts.error.message);
    const activeSegmentIds = new Set(
      broadcasts.data?.data
        ?.filter((broadcast) => broadcast.status !== 'sent')
        .map((broadcast) => broadcast.segment_id),
    );
    const oldest = listed.data?.data
      ?.filter((segment) => segment.name.startsWith(SEGMENT_PREFIX) && !activeSegmentIds.has(segment.id))
      .sort((left, right) => new Date(left.created_at) - new Date(right.created_at))[0];
    if (!oldest) throw new Error(created.error.message);

    const removed = await resend.segments.remove(oldest.id);
    if (removed.error) throw new Error(removed.error.message);
    created = await resend.segments.create({ name });
    if (!created.error) created.data.recycled_segment = oldest.name;
  }
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
    previewText: campaignCopy.previewText,
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
    if (request.method === 'POST' && request.body?.confirm === 'SEND_REACTIVATION') {
      const importId = String(request.body?.import_id || '').trim();
      const broadcastId = String(request.body?.broadcast_id || '').trim();
      if (!importId || !broadcastId) {
        return response.status(400).json({ success: false, message: 'import_id and broadcast_id are required' });
      }
      if (!process.env.RESEND_API_KEY) {
        return response.status(503).json({ success: false, message: 'RESEND_API_KEY is not configured' });
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const [imported, broadcast] = await Promise.all([
        resend.contacts.imports.get(importId),
        resend.broadcasts.get(broadcastId),
      ]);
      if (imported.error) throw new Error(imported.error.message);
      if (broadcast.error) throw new Error(broadcast.error.message);
      if (imported.data?.status !== 'completed') {
        return response.status(409).json({
          success: false,
          message: `Contact import is ${imported.data?.status || 'unknown'}`,
          data: imported.data,
        });
      }
      if (!broadcast.data?.name?.startsWith('API-Route reactivation web chat ')) {
        return response.status(400).json({ success: false, message: 'Broadcast is not a reactivation draft' });
      }
      if (broadcast.data?.status !== 'draft') {
        return response.status(409).json({
          success: false,
          message: `Broadcast is ${broadcast.data?.status || 'unknown'}`,
        });
      }

      const sent = await resend.broadcasts.send(broadcastId);
      if (sent.error) throw new Error(sent.error.message);
      return response.status(200).json({
        success: true,
        data: {
          broadcast_id: sent.data?.id || broadcastId,
          import_counts: imported.data?.counts,
          sent: true,
        },
      });
    }

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

    const requestedAudience = String(request.method === 'GET'
      ? request.query?.audience || ''
      : request.body?.audience || '').trim();
    const audience = requestedAudience || 'zero_balance_unused';
    if (!['zero_balance_unused', 'funded_unused', 'spent_over_100_exhausted'].includes(audience)) {
      return response.status(400).json({ success: false, message: 'audience is invalid' });
    }

    const customers = await fetchAll(baseUrl, '/api/distributor/customers', credentials, {}, 100);
    const selection = selectDormantCustomers(customers, audience);
    const additionalEmail = request.method === 'POST'
      ? String(request.body?.additional_email || '').trim().toLowerCase()
      : '';
    if (additionalEmail && !EMAIL_PATTERN.test(additionalEmail)) {
      return response.status(400).json({ success: false, message: 'additional_email is invalid' });
    }
    const recipients = new Map(selection.dormant.map(({ email }) => [email, { email }]));
    if (additionalEmail) recipients.set(additionalEmail, { email: additionalEmail });
    const recipientList = [...recipients.values()];
    const preview = {
      audience,
      rule: audience === 'funded_unused'
        ? 'balance > 0 and usage = 0'
        : audience === 'spent_over_100_exhausted'
          ? 'balance <= 0 and usage > CNY 100'
          : 'balance = 0 and usage = 0',
      customer_count: customers.length,
      dormant_count: selection.dormant.length,
      recipient_count: recipientList.length,
      sample: selection.dormant.slice(0, 10).map(({ email }) => maskEmail(email)),
      skipped: selection.skipped,
    };

    if (request.method === 'GET') {
      if (request.query?.format === 'csv') {
        response.setHeader('Content-Type', 'text/csv; charset=utf-8');
        response.setHeader('Content-Disposition', `attachment; filename="${audience}-users.csv"`);
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
    if (!recipientList.length) {
      return response.status(200).json({ success: true, data: { ...preview, prepared: false } });
    }
    if (!process.env.RESEND_API_KEY) {
      return response.status(503).json({ success: false, message: 'RESEND_API_KEY is not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const date = new Date().toISOString().slice(0, 10);
    const segmentName = `${SEGMENT_PREFIX} ${audience} ${date}`;
    const draftName = `API-Route reactivation web chat ${audience} ${date}`;
    const segment = await findOrCreateSegment(
      resend,
      segmentName,
      request.body?.recycle_oldest_segment === true,
    );
    const csv = `email\n${recipientList.map(({ email }) => csvCell(email)).join('\n')}`;
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
        recycled_segment: segment.recycled_segment || null,
        segment_id: segment.id,
        import_id: imported.data?.id,
        broadcast_id: draft.id,
        next_step: 'Wait for the contact import to complete, then confirm SEND_REACTIVATION with the returned IDs.',
      },
    });
  } catch (error) {
    return response.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Reactivation preparation failed',
    });
  }
}
