/**
 * Vercel Serverless Function: /api/visit
 * Pencatatan kunjungan halaman (views) atomik harian tanpa menyimpan data pribadi pengguna.
 */

const BASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://bhavanix-9dcef-default-rtdb.firebaseio.com';
const APP_ID = process.env.APP_ID || 'bhavanix_production';

// Rate limiting (maks 1 hit per 10 detik per client IP untuk mencegah spam reload)
const visitLimiter = new Map();

export default async function handler(req, res) {
    // Izinkan GET atau POST
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const lastVisit = visitLimiter.get(clientIp) || 0;

    if (now - lastVisit < 10000) {
        // Terlalu sering, jangan gandakan hitungan
        return res.status(200).json({ success: true, cached: true });
    }

    visitLimiter.set(clientIp, now);

    // Bersihkan memori setiap kali melebihi 1000 entri
    if (visitLimiter.size > 1000) {
        for (const [key, timestamp] of visitLimiter.entries()) {
            if (now - timestamp > 60000) visitLimiter.delete(key);
        }
    }

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        await fetch(`${BASE_URL}/artifacts/${APP_ID}/public/data/stats_daily/${todayStr}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: todayStr,
                views: { ".sv": { "increment": 1 } }
            })
        });

        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error logging page visit:', err);
        return res.status(500).json({ error: 'Failed to record visit' });
    }
}
