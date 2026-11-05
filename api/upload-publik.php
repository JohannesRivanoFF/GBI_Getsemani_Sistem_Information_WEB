<?php
/**
 * api/upload-publik.php
 * Upload endpoint untuk publik (bukti transfer persembahan & berkas baptisan).
 * Tidak memerlukan login admin — akses terbuka namun dibatasi tipe & ukuran file.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$fieldName = 'file'; // field name dari FormData publik
if (!isset($_FILES[$fieldName]) || $_FILES[$fieldName]['error'] !== UPLOAD_ERR_OK) {
    $errCode = $_FILES[$fieldName]['error'] ?? 'No file';
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Gagal mengunggah file. Kode error: ' . $errCode]);
    exit;
}

$file    = $_FILES[$fieldName];
$maxSize = 8 * 1024 * 1024; // 8MB

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ukuran file terlalu besar (maks. 8MB).']);
    exit;
}

$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
    'application/pdf' => 'pdf',
];

if (!array_key_exists($mimeType, $allowed)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.']);
    exit;
}

$ext       = $allowed[$mimeType];
$prefix    = $_POST['prefix'] ?? 'publik';
$prefix    = preg_replace('/[^a-z0-9_]/', '', strtolower($prefix));
$targetDir = __DIR__ . '/../uploads/';

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

$filename    = $prefix . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$destination = $targetDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan file ke server.']);
    exit;
}

echo json_encode([
    'success'  => true,
    'message'  => 'File berhasil diunggah.',
    'url'      => './uploads/' . $filename,
    'filename' => $filename,
    'mime'     => $mimeType,
]);
