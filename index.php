<?php
/**
 * DERMAGA GIZI - Production Server Dispatcher for Hostinger
 * Puskesmas Kepulauan Seribu Selatan
 */

// 1. Tangani permintaan aset statis (/assets/...)
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (strpos($requestUri, '/assets/') !== false) {
    // Ambil nama file aset
    $assetName = substr($requestUri, strpos($requestUri, '/assets/') + 8);
    $assetFile = __DIR__ . '/dist/assets/' . $assetName;
    
    if (file_exists($assetFile)) {
        $ext = pathinfo($assetFile, PATHINFO_EXTENSION);
        if ($ext === 'css') {
            header('Content-Type: text/css; charset=utf-8');
        } else if ($ext === 'js') {
            header('Content-Type: application/javascript; charset=utf-8');
        } else if ($ext === 'svg') {
            header('Content-Type: image/svg+xml');
        } else if (in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'])) {
            header('Content-Type: image/' . ($ext === 'svg' ? 'svg+xml' : $ext));
        } else if (in_array($ext, ['woff', 'woff2', 'ttf', 'eot'])) {
            header('Content-Type: font/' . $ext);
        }
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($assetFile);
        exit;
    }
}

// 2. Jika ada build produksi di folder dist, sajikan dist/index.html
if (file_exists(__DIR__ . '/dist/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile(__DIR__ . '/dist/index.html');
    exit;
}

// 3. Fallback jika dist belum ada
if (file_exists(__DIR__ . '/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
    exit;
}

echo "Aplikasi DERMAGA GIZI sedang memuat...";
?>
