/**
 * Skrip Migrasi Idempotent: apps -> links
 * 
 * Skrip ini membaca data aplikasi lama dari Firebase RTDB (path /artifacts/bhavanix_production/public/data/apps),
 * membuat backup lokal, dan menyusun payload skema baru untuk /links.
 * 
 * Penggunaan:
 *   node scripts/migrate.js
 *   node scripts/migrate.js --write --token="FIREBASE_ID_TOKEN_OR_SECRET"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://bhavanix-9dcef-default-rtdb.firebaseio.com';
const APP_ID = 'bhavanix_production';
const APPS_ENDPOINT = `${BASE_URL}/artifacts/${APP_ID}/public/data/apps.json`;
const LINKS_ENDPOINT = `${BASE_URL}/artifacts/${APP_ID}/public/data/links.json`;

async function runMigration() {
    console.log('🔄 Memulai proses pengecekan migrasi data Zynk...');
    
    // 1. Ambil data lama
    console.log(`📡 Mengambil data apps dari: ${APPS_ENDPOINT}`);
    const appsRes = await fetch(APPS_ENDPOINT);
    if (!appsRes.ok) {
        throw new Error(`Gagal membaca apps: ${appsRes.status} ${appsRes.statusText}`);
    }
    const appsData = await appsRes.json() || {};
    const appKeys = Object.keys(appsData);
    console.log(`📦 Ditemukan ${appKeys.length} data aplikasi lama.`);

    // 2. Simpan backup lokal
    const backupDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, `apps_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(appsData, null, 2), 'utf-8');
    console.log(`💾 Backup lokal tersimpan aman di: ${backupPath}`);

    // 3. Ambil data links saat ini
    const linksRes = await fetch(LINKS_ENDPOINT);
    const existingLinks = (linksRes.ok ? await linksRes.json() : null) || {};
    const existingLinksArray = Object.entries(existingLinks).map(([k, v]) => ({ id: k, ...v }));

    console.log(`📊 Data links yang sudah ada di database: ${existingLinksArray.length}`);

    // Urutkan apps berdasarkan createdAt ASC untuk memberi posisi awal berurutan
    const sortedApps = appKeys.map(k => ({ id: k, ...appsData[k] }))
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    const migrationPayload = {};
    let newItemsCount = 0;
    let skippedCount = 0;

    sortedApps.forEach((app, index) => {
        // Cek apakah sudah pernah dimigrasikan (idempotensi berdasarkan id asli atau kombinasi title & url)
        const alreadyExists = existingLinks[app.id] || 
            existingLinksArray.some(link => link.title === app.name && link.url === app.url);

        if (alreadyExists) {
            skippedCount++;
        } else {
            migrationPayload[app.id] = {
                title: app.name || 'Untitled Link',
                url: app.url || '#',
                description: app.description || '',
                icon: app.iconUrl || '',
                category: app.category || 'Productivity',
                position: index,
                isActive: true,
                clickCount: 0,
                createdAt: app.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ownerId: null
            };
            newItemsCount++;
        }
    });

    console.log(`\n📋 Ringkasan Migrasi:`);
    console.log(`- Total data lama: ${appKeys.length}`);
    console.log(`- Data yang sudah ada (dilewati): ${skippedCount}`);
    console.log(`- Data baru yang akan dimigrasikan: ${newItemsCount}`);

    if (newItemsCount === 0) {
        console.log('✅ Semua data sudah termigrasi sebelumnya (Idempotent). Tidak ada perubahan baru yang diperlukan.');
        return;
    }

    console.log('\nPreview Payload yang akan ditulis ke /links:');
    Object.entries(migrationPayload).forEach(([id, item]) => {
        console.log(`  [pos: ${item.position}] ${item.title} (${item.category}) -> ${item.url}`);
    });

    const isWrite = process.argv.includes('--write');
    const tokenArg = process.argv.find(arg => arg.startsWith('--token='));
    const token = tokenArg ? tokenArg.split('=')[1] : process.env.FIREBASE_AUTH_TOKEN;

    if (isWrite && token) {
        console.log(`\n🚀 Mengirim payload ke Firebase RTDB dengan autentikasi...`);
        const urlWithAuth = `${BASE_URL}/artifacts/${APP_ID}/public/data/links.json?auth=${token}`;
        const patchRes = await fetch(urlWithAuth, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(migrationPayload)
        });

        if (!patchRes.ok) {
            const errBody = await patchRes.text();
            throw new Error(`Gagal menulis ke Firebase: ${patchRes.status} ${errBody}`);
        }

        console.log('🎉 Migrasi data berhasil diselesaikan ke database Firebase!');
    } else {
        console.log(`\nℹ️ Catatan: Skrip ini dijalankan dalam mode PREVIEW (dry-run).`);
        console.log(`Untuk melakukan migrasi, Anda dapat:`);
        console.log(`1. Login ke Dashboard Admin di browser (otomatis tersedia tombol 'Migrasikan Data Lama' dengan sesi admin aktif).`);
        console.log(`2. Atau jalankan CLI dengan token: node scripts/migrate.js --write --token="YOUR_ID_TOKEN"`);
    }
}

runMigration().catch(err => {
    console.error('❌ Error migrasi:', err.message);
    process.exit(1);
});
