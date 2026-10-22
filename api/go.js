/**
 * Vercel Serverless Function: /api/go?id=[linkId]
 * Endpoint redirect aman dengan anti open-redirect, rate-limiting, dan atomic click tracking.
 */

const BASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://bhavanix-9dcef-default-rtdb.firebaseio.com';
const APP_ID = process.env.APP_ID || 'bhavanix_production';

// In-memory rate limiting (30 klik per IP per menit)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function isRateLimited(ip) {
    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

    if (now > clientData.resetAt) {
        clientData.count = 0;
        clientData.resetAt = now + RATE_LIMIT_WINDOW_MS;
    }

    clientData.count++;
    rateLimitMap.set(ip, clientData);

    // Bersihkan entri lama setiap 50 entri
    if (rateLimitMap.size > 500) {
        for (const [key, val] of rateLimitMap.entries()) {
            if (now > val.resetAt) rateLimitMap.delete(key);
        }
    }

    return clientData.count > MAX_REQUESTS_PER_WINDOW;
}

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.writeHead(302, { Location: '/' }).end();
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Cek rate limiting
    if (isRateLimited(clientIp)) {
        res.setHeader('Retry-After', '60');
        return res.status(429).send('Terlalu banyak permintaan klik. Silakan coba sebentar lagi.');
    }

    try {
        // Ambil data link dari Firebase RTDB
        const linkRes = await fetch(`${BASE_URL}/artifacts/${APP_ID}/public/data/links/${encodeURIComponent(id)}.json`);
        if (!linkRes.ok) {
            return res.writeHead(302, { Location: '/' }).end();
        }

        const link = await linkRes.json();
        if (!link || !link.url) {
            return res.writeHead(302, { Location: '/' }).end();
        }

        // Validasi URL: hanya izinkan http:// dan https:// untuk mencegah skema berbahaya (javascript:, data:, dll.)
        let targetUrl;
        try {
            targetUrl = new URL(link.url);
            if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
                throw new Error('Protokol tidak valid');
            }
        } catch {
            return res.status(400).send('URL tujuan tidak valid atau tidak aman.');
        }

        // Catat klik secara atomik ke Firebase RTDB
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Naikkan total clickCount pada link
        const incrementLinkPromise = fetch(`${BASE_URL}/artifacts/${APP_ID}/public/data/links/${encodeURIComponent(id)}/clickCount.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ".sv": { "increment": 1 } })
        }).catch(() => {});

        // 2. Naikkan stats_daily clicks dan per-link clicks
        const updateStatsPromise = fetch(`${BASE_URL}/artifacts/${APP_ID}/public/data/stats_daily/${todayStr}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: todayStr,
                clicks: { ".sv": { "increment": 1 } },
                [`linkClicks/${id}`]: { ".sv": { "increment": 1 } }
            })
        }).catch(() => {});

        // Tunggu maksimal 300ms agar redirect tetap super cepat tanpa terhambat
        await Promise.race([
            Promise.all([incrementLinkPromise, updateStatsPromise]),
            new Promise(resolve => setTimeout(resolve, 300))
        ]);

        // 302 Found redirect ke URL tujuan
        res.writeHead(302, {
            Location: targetUrl.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        });
        return res.end();
    } catch (err) {
        console.error('Error redirecting link:', err);
        return res.writeHead(302, { Location: '/' }).end();
    }
}
