import fs from 'fs';
import { execSync } from 'child_process';

const html = fs.readFileSync('index.html', 'utf-8');
const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);

if (!scriptMatch) {
    console.error('❌ Tidak ditemukan tag <script type="module">');
    process.exit(1);
}

// Tulis ke file JS sementara berformat ESM
fs.writeFileSync('temp_esm.js', scriptMatch[1], 'utf-8');

try {
    // Jalankan node --check (dry syntax check untuk ES module)
    execSync('node --check temp_esm.js', { stdio: 'pipe' });
    console.log('✅ Sintaksis JavaScript ES Module di dalam index.html 100% VALID dan bebas error!');
} catch (err) {
    console.error('❌ Syntax error dalam script:', err.stderr ? err.stderr.toString() : err.message);
    process.exit(1);
} finally {
    if (fs.existsSync('temp_esm.js')) {
        fs.unlinkSync('temp_esm.js');
    }
}
