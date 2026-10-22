/**
 * Skrip Migrasi Idempotent Multi-User: apps -> users/{uid} & usernames/{usernameLower}
 * Memetakan data aplikasi lama ke akun pemilik utama (username: "haf")
 * dengan kategori sebagai section berurutan.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://bhavanix-9dcef-default-rtdb.firebaseio.com';
const APP_ID = 'bhavanix_production';
const TARGET_USERNAME = process.env.TARGET_USERNAME || 'haf';
const TARGET_EMAIL = process.env.TARGET_EMAIL || 'haf.hafian@gmail.com';

async function runMultiUserMigration() {
    console.log(`🔄 Memulai migrasi data ke skema Multi-User Zynk untuk username: @${TARGET_USERNAME}...`);

    // 1. Ambil data aplikasi lama
    const appsRes = await fetch(`${BASE_URL}/artifacts/${APP_ID}/public/data/apps.json`);
    if (!appsRes.ok) {
        throw new Error(`Gagal membaca data apps: ${appsRes.status}`);
    }
    const appsData = await appsRes.json() || {};
    const appKeys = Object.keys(appsData);
    console.log(`📦 Ditemukan ${appKeys.length} data aplikasi lama.`);

    // 2. Simpan backup lokal
    const backupDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, `multiuser_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(appsData, null, 2), 'utf-8');
    console.log(`💾 Backup lokal tersimpan di: ${backupPath}`);

    // 3. Ambil data username & user saat ini jika ada
    const userLower = TARGET_USERNAME.toLowerCase();
    const usernameRes = await fetch(`${BASE_URL}/artifacts/${APP_ID}/usernames/${userLower}.json`);
    const existingUsername = usernameRes.ok ? await usernameRes.json() : null;

    let targetUid = existingUsername ? existingUsername.uid : `user_${userLower}`;

    console.log(`👤 Target UID pemilik: ${targetUid}`);

    // Urutkan data lama berdasarkan waktu pembuatan
    const sortedApps = appKeys.map(k => ({ id: k, ...appsData[k] }))
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    // Petakan kategori unik menjadi section
    const uniqueCategories = [...new Set(sortedApps.map(a => a.category || 'Productivity'))];
    const sectionMap = {};
    const sectionsPayload = {};

    uniqueCategories.forEach((cat, index) => {
        const secId = `sec_${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        sectionMap[cat] = secId;
        sectionsPayload[secId] = {
            ownerId: targetUid,
            title: cat,
            position: index,
            isActive: true
        };
    });

    // Petakan tautan
    const linksPayload = {};
    sortedApps.forEach((app, index) => {
        const cat = app.category || 'Productivity';
        linksPayload[app.id] = {
            ownerId: targetUid,
            sectionId: sectionMap[cat] || null,
            title: app.name || 'Untitled Link',
            url: app.url || '#',
            description: app.description || '',
            icon: app.iconUrl || '',
            position: index,
            isActive: true,
            clickCount: 0,
            createdAt: app.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    });

    const profilePayload = {
        email: TARGET_EMAIL,
        username: TARGET_USERNAME,
        usernameLower: userLower,
        displayName: "Luthafiyyan",
        bio: "Senior Full-Stack Engineer & Creator of Zynk. Building things that spark joy.",
        avatarUrl: "assets/zynk-badge.svg",
        socials: [
            { type: "github", url: "https://github.com/luthafiyyan" },
            { type: "instagram", url: "https://www.instagram.com/luthafiyyan_/" },
            { type: "linkedin", url: "https://linkedin.com/in/luthafiyyan" },
            { type: "email", url: `mailto:${TARGET_EMAIL}` }
        ],
        theme: "auto",
        accent: "blue",
        buttonStyle: "rounded",
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    console.log(`\n📋 Ringkasan Payload Migrasi Multi-User:`);
    console.log(`- Username: @${TARGET_USERNAME}`);
    console.log(`- Jumlah Sections: ${Object.keys(sectionsPayload).length}`);
    console.log(`- Jumlah Tautan: ${Object.keys(linksPayload).length}`);

    const isWrite = process.argv.includes('--write');
    const tokenArg = process.argv.find(arg => arg.startsWith('--token='));
    const token = tokenArg ? tokenArg.split('=')[1] : process.env.FIREBASE_AUTH_TOKEN;

    if (isWrite && token) {
        console.log(`\n🚀 Mengirim payload ke Firebase RTDB...`);
        const rootUpdates = {
            [`artifacts/${APP_ID}/usernames/${userLower}`]: { uid: targetUid, createdAt: new Date().toISOString() },
            [`artifacts/${APP_ID}/users/${targetUid}/profile`]: profilePayload,
            [`artifacts/${APP_ID}/users/${targetUid}/sections`]: sectionsPayload,
            [`artifacts/${APP_ID}/users/${targetUid}/links`]: linksPayload
        };

        const res = await fetch(`${BASE_URL}/.json?auth=${token}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rootUpdates)
        });

        if (!res.ok) {
            throw new Error(`Gagal menulis ke Firebase: ${res.status} ${await res.text()}`);
        }
        console.log('🎉 Migrasi Multi-User berhasil tersimpan di database!');
    } else {
        console.log(`\nℹ️ Mode PREVIEW selesai (dry-run).`);
        console.log(`Migrasi juga otomatis tersedia satu-klik di Dashboard Zynk saat login pertama kali.`);
    }
}

runMultiUserMigration().catch(err => {
    console.error('❌ Error migrasi:', err.message);
    process.exit(1);
});
