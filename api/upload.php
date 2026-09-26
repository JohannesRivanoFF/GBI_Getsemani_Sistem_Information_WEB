<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Helper auth check
if (empty($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak: Silakan login sebagai admin terlebih dahulu.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $errCode = $_FILES['image']['error'] ?? 'No file';
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Gagal mengunggah file. Error code: ' . $errCode]);
    exit;
}

$file = $_FILES['image'];
$maxSize = 8 * 1024 * 1024; // 8MB

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ukuran file terlalu besar (maksimal 8MB).']);
    exit;
}

// Validasi tipe mime
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif'
];

if (!array_key_exists($mimeType, $allowedMimes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format file tidak didukung. Harap unggah gambar JPG, PNG, WEBP, atau GIF.']);
    exit;
}

$extension = $allowedMimes[$mimeType];
$targetDir = __DIR__ . '/../uploads/';

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

$filename = 'img_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
$destination = $targetDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal memindahkan file ke server.']);
    exit;
}

$fileUrl = './uploads/' . $filename;

echo json_encode([
    'success' => true,
    'message' => 'Gambar berhasil diunggah.',
    'url' => $fileUrl,
    'filename' => $filename
]);
