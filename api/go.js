/**
 * Vercel Serverless Function: /api/go?id=[linkId]&u=[ownerId]
 * Endpoint redirect aman untuk multi-user dengan validasi URL, anti open-redirect,
 * rate-limiting per IP, dan atomic click tracking.
 */

const BASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://bhavanix-9dcef-default-rtdb.firebaseio.com';
const APP_ID = process.env.APP_ID || 'bhavanix_production';

// In-memory rate limiting (maks 40 request per menit per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 40;

function isRateLimited(ip) {
    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

    if (now > clientData.resetAt) {
        clientData.count = 0;
        clientData.resetAt = now + RATE_LIMIT_WINDOW_MS;
    }

    clientData.count++;
    rateLimitMap.set(ip, clientData);

    if (rateLimitMap.size > 500) {
        for (const [key, val] of rateLimitMap.entries()) {
            if (now > val.resetAt) rateLimitMap.delete(key);
        }
    }

    return clientData.count > MAX_REQUESTS_PER_WINDOW;
}

export default async function handler(req, res) {
    const { id, u } = req.query;

    if (!id || typeof id !== 'string') {
        return res.writeHead(302, { Location: '/' }).end();
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    if (isRateLimited(clientIp)) {
        res.setHeader('Retry-After', '60');
        return res.status(429).send('Terlalu banyak permintaan klik. Silakan tunggu sebentar.');
    }

    try {
        let linkData = null;
        let ownerId = typeof u === 'string' ? u : null;

        // 1. Cek pada skema multi-user jika ownerId (u) disertakan
        if (ownerId) {
            const linkRes = await fetch(`${BASE_URL}/artifacts/${APP_ID}/users/${encodeURIComponent(ownerId)}/links/${encodeURIComponent(id)}.json`);
            if (linkRes.ok) {
                linkData = await linkRes.json();
            }
        }

        // 2. Fallback jika tidak ditemukan dengan u, cek legacy path
        if (!linkData || !linkData.url) {
            const legacyRes = await fetch(`${BASE_URL}/artifacts/${APP_ID}/public/data/links/${encodeURIComponent(id)}.json`);
            if (legacyRes.ok) {
                linkData = await legacyRes.json();
                if (linkData && linkData.ownerId) ownerId = linkData.ownerId;
            }
        }

        // 3. Fallback jika masih tidak ditemukan, redirect ke home
        if (!linkData || !linkData.url) {
            return res.writeHead(302, { Location: '/' }).end();
        }

        // Validasi protokol URL
        let targetUrl;
        try {
            targetUrl = new URL(linkData.url);
            if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
                throw new Error('Protokol tidak diizinkan');
            }
        } catch {
            return res.status(400).send('URL tujuan tidak aman atau tidak valid.');
        }

        // Atomic Click Tracking
        const todayStr = new Date().toISOString().split('T')[0];
        const updatePromises = [];

        if (ownerId) {
            // Naikkan clickCount pada link multi-user
            updatePromises.push(
                fetch(`${BASE_URL}/artifacts/${APP_ID}/users/${encodeURIComponent(ownerId)}/links/${encodeURIComponent(id)}/clickCount.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ".sv": { "increment": 1 } })
                }).catch(() => {})
            );

            // Naikkan stats_daily owner
            updatePromises.push(
                fetch(`${BASE_URL}/artifacts/${APP_ID}/users/${encodeURIComponent(ownerId)}/stats_daily/${todayStr}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: todayStr,
                        clicks: { ".sv": { "increment": 1 } },
                        [`linkClicks/${id}`]: { ".sv": { "increment": 1 } }
                    })
                }).catch(() => {})
            );
        } else {
            // Legacy link update
            updatePromises.push(
                fetch(`${BASE_URL}/artifacts/${APP_ID}/public/data/links/${encodeURIComponent(id)}/clickCount.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ".sv": { "increment": 1 } })
                }).catch(() => {})
            );
        }

        // Non-blocking wait maksimal 250ms agar redirect super cepat
        await Promise.race([
            Promise.all(updatePromises),
            new Promise(resolve => setTimeout(resolve, 250))
        ]);

        res.writeHead(302, {
            Location: targetUrl.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate'
        });
        return res.end();
    } catch (err) {
        console.error('Error redirecting link:', err);
        return res.writeHead(302, { Location: '/' }).end();
    }
}
