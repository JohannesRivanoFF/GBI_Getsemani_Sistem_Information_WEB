<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/../data/kegiatan.json';

// Helper load data
function getKegiatanData($file) {
    if (!file_exists($file)) {
        file_put_contents($file, json_encode([], JSON_PRETTY_PRINT));
        return [];
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

// Helper save data
function saveKegiatanData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

// Helper auth check
function checkAdminAuth() {
    if (empty($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Akses ditolak: Silakan login sebagai admin terlebih dahulu.']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $items = getKegiatanData($dataFile);
    echo json_encode([
        'success' => true,
        'data' => $items
    ]);
    exit;
}

if ($method === 'POST') {
    checkAdminAuth();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $action = $input['action'] ?? 'create';
    $items = getKegiatanData($dataFile);

    switch ($action) {
        case 'create':
            $title = trim($input['title'] ?? '');
            if (!$title) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Judul kegiatan wajib diisi.']);
                exit;
            }

            $newItem = [
                'id' => 'kegiatan-' . time() . '-' . rand(100, 999),
                'title' => $title,
                'image' => trim($input['image'] ?? './Resource/IBADAH MINGGU.jpeg'),
                'short_desc' => trim($input['short_desc'] ?? ''),
                'description' => trim($input['description'] ?? ''),
                'date' => trim($input['date'] ?? date('d F Y'))
            ];

            // Masukkan di urutan pertama (terbaru)
            array_unshift($items, $newItem);
            saveKegiatanData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Kegiatan baru berhasil ditambahkan.',
                'data' => $newItem
            ]);
            break;

        case 'update':
            $id = $input['id'] ?? '';
            $foundIndex = -1;
            foreach ($items as $idx => $item) {
                if ($item['id'] === $id) {
                    $foundIndex = $idx;
                    break;
                }
            }

            if ($foundIndex === -1) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Data kegiatan tidak ditemukan.']);
                exit;
            }

            if (!empty($input['title'])) $items[$foundIndex]['title'] = trim($input['title']);
            if (isset($input['image'])) $items[$foundIndex]['image'] = trim($input['image']);
            if (isset($input['short_desc'])) $items[$foundIndex]['short_desc'] = trim($input['short_desc']);
            if (isset($input['description'])) $items[$foundIndex]['description'] = trim($input['description']);
            if (isset($input['date'])) $items[$foundIndex]['date'] = trim($input['date']);

            saveKegiatanData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Data kegiatan berhasil diperbarui.',
                'data' => $items[$foundIndex]
            ]);
            break;

        case 'delete':
            $id = $input['id'] ?? '';
            $items = array_values(array_filter($items, function($item) use ($id) {
                return $item['id'] !== $id;
            }));

            saveKegiatanData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Kegiatan berhasil dihapus.'
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Aksi tidak valid.']);
            break;
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
