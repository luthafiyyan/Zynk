/**
 * Vercel Serverless Function: /api/visit?u=[ownerId]
 * Pencatatan kunjungan (page views) harian per pengguna secara anonim.
 */

const BASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://bhavanix-9dcef-default-rtdb.firebaseio.com';
const APP_ID = process.env.APP_ID || 'bhavanix_production';

const visitLimiter = new Map();

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { u } = req.query;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const rateKey = `${clientIp}_${u || 'global'}`;
    const now = Date.now();
    const lastVisit = visitLimiter.get(rateKey) || 0;

    // Maksimal 1 hit per 10 detik per IP per halaman profil
    if (now - lastVisit < 10000) {
        return res.status(200).json({ success: true, cached: true });
    }

    visitLimiter.set(rateKey, now);

    if (visitLimiter.size > 1000) {
        for (const [key, timestamp] of visitLimiter.entries()) {
            if (now - timestamp > 60000) visitLimiter.delete(key);
        }
    }

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (u && typeof u === 'string') {
            await fetch(`${BASE_URL}/artifacts/${APP_ID}/users/${encodeURIComponent(u)}/stats_daily/${todayStr}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: todayStr,
                    views: { ".sv": { "increment": 1 } }
                })
            });
        } else {
            // Legacy global stats
            await fetch(`${BASE_URL}/artifacts/${APP_ID}/public/data/stats_daily/${todayStr}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: todayStr,
                    views: { ".sv": { "increment": 1 } }
                })
            });
        }

        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error recording page visit:', err);
        return res.status(500).json({ error: 'Failed to record visit' });
    }
}
