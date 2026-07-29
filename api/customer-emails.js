import { timingSafeEqual } from 'node:crypto';

const DEFAULT_API_BASE_URL = 'https://subrouter.ai';
const PAGE_SIZE = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export async function collectCustomerEmails(fetchPage) {
  const emails = new Set();
  let page = 1;
  let customerCount = 0;
  let customersWithEmail = 0;
  let reportedTotal = null;

  while (page <= 1000) {
    const { customers, total } = await fetchPage(page);
    if (!Array.isArray(customers)) throw new Error('Invalid customer list response');

    if (page === 1 && Number(total) > 0) reportedTotal = Number(total);

    for (const customer of customers) {
      customerCount += 1;
      const email = String(customer?.email || '').trim().toLowerCase();
      if (!EMAIL_PATTERN.test(email)) continue;
      customersWithEmail += 1;
      emails.add(email);
    }

    if (customers.length === 0 || (reportedTotal !== null && customerCount >= reportedTotal)) {
      return {
        emails: [...emails].sort(),
        customerCount,
        customersWithEmail,
        reportedTotal,
      };
    }

    page += 1;
  }

  throw new Error('Customer pagination exceeded 1000 pages');
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const mailingSecret = process.env.MAILING_API_SECRET;
  const providedSecret = request.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
  if (!mailingSecret || !safeEqual(providedSecret, mailingSecret)) {
    return response.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const accessToken = process.env.DISTRIBUTOR_ACCESS_TOKEN;
  const userId = process.env.DISTRIBUTOR_USER_ID;
  if (!accessToken || !userId) {
    return response.status(503).json({ success: false, message: 'Distributor API credentials are not configured' });
  }

  const baseUrl = (process.env.DISTRIBUTOR_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  try {
    const result = await collectCustomerEmails(async (page) => {
      const url = new URL('/api/distributor/customers', baseUrl);
      url.searchParams.set('page', String(page));
      url.searchParams.set('page_size', String(PAGE_SIZE));

      const upstream = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'New-Api-User': userId,
        },
      });
      const payload = await upstream.json();
      if (!upstream.ok || payload?.success === false) {
        throw new Error(payload?.message || `Distributor API returned ${upstream.status}`);
      }

      return {
        customers: Array.isArray(payload?.data) ? payload.data : payload?.data?.data,
        total: payload?.total ?? payload?.data?.total,
      };
    });

    return response.status(200).json({
      success: true,
      data: {
        emails: result.emails,
        unique_email_count: result.emails.length,
        customers_with_email: result.customersWithEmail,
        customer_count: result.reportedTotal ?? result.customerCount,
      },
    });
  } catch (error) {
    return response.status(502).json({ success: false, message: error.message });
  }
}
