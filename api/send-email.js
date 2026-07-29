import { timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const providedSecret =
    request.headers.authorization?.replace(/^Bearer\s+/i, '') || '';

  if (
    !process.env.MAILING_API_SECRET ||
    !safeEqual(providedSecret, process.env.MAILING_API_SECRET)
  ) {
    return response.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const { to, subject, html, text } = request.body || {};

  if (
    typeof to !== 'string' ||
    !to.trim() ||
    typeof subject !== 'string' ||
    !subject.trim() ||
    (!html && !text)
  ) {
    return response.status(400).json({
      success: false,
      message: 'Invalid email parameters',
    });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'API-Route <support@api-route.com>',
      replyTo: 'support@api-route.com',
      to: [to.trim()],
      subject: subject.trim(),
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
    });

    if (error) {
      return response.status(502).json({
        success: false,
        message: error.message,
      });
    }

    return response.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Email send failed',
    });
  }
}