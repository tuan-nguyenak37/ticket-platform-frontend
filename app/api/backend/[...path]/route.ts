import { backendUrl, REFRESH_COOKIE } from '@/lib/auth/server-session';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const fail = (statusCode: number, message: string) => Response.json({ success: false, statusCode, message, data: null }, { status: statusCode, headers: { 'Cache-Control': 'no-store' } });
  const { path } = await context.params;
  if (!path.length || path.some(part => !part || part === '.' || part === '..' || /[\\/%\x00-\x1f]/.test(part))) return fail(400, 'Đường dẫn không hợp lệ.');
  const endpoint = path.join('/');
  if (path[0] === 'auth' && !['auth/browser/login', 'auth/browser/session', 'auth/browser/refresh', 'auth/browser/logout', 'auth/register'].includes(endpoint)) return fail(404, 'Không tìm thấy API.');
  if (endpoint.startsWith('v1/payments/vnpay/') && ['ipn', 'return'].includes(path.at(-1)!)) return fail(404, 'Không tìm thấy API.');
  const readOnly = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  const origin = request.headers.get('origin');
  if ((!readOnly && origin !== request.nextUrl.origin) || request.headers.get('sec-fetch-site') === 'cross-site') return fail(403, 'Nguồn yêu cầu không hợp lệ.');
  const headers = new Headers();
  for (const name of ['content-type', 'accept', 'idempotency-key', 'range', 'authorization']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (origin) headers.set('Origin', origin);
  const browserAuth = endpoint.startsWith('auth/browser/');
  const session = request.cookies.get(REFRESH_COOKIE)?.value;
  if (browserAuth && session && session.length <= 4096 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(session)) headers.set('Cookie', `${REFRESH_COOKIE}=${session}`);
  try {
    const limit = 51 * 1024 * 1024;
    if (Number(request.headers.get('content-length')) > limit) return fail(413, 'Dữ liệu gửi lên quá lớn.');
    let body: Uint8Array<ArrayBuffer> | undefined;
    if (!readOnly && request.body) {
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) {
          await reader.cancel();
          return fail(413, 'Dữ liệu gửi lên quá lớn.');
        }
        chunks.push(value);
      }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    }
    const target = `${backendUrl().replace(/\/$/, '')}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;
    const upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(20000) });
    if (upstream.status >= 300 && upstream.status < 400) return fail(502, 'Phản hồi máy chủ không hợp lệ.');
    const outgoing = new Headers({ 'Cache-Control': 'no-store', Vary: 'Cookie, Authorization' });
    for (const name of ['content-type', 'content-disposition', 'retry-after', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(name);
      if (value) outgoing.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      if (browserAuth && upstream.ok && (cookie.startsWith(`${REFRESH_COOKIE}=`) || cookie.startsWith('ticketverse_session=;'))) outgoing.append('Set-Cookie', cookie);
    }
    return new Response(request.method === 'HEAD' || upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: outgoing });
  } catch {
    return fail(503, 'Chưa thể kết nối hệ thống. Vui lòng thử lại.');
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD, proxy as OPTIONS };
