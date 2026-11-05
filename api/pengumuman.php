<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/../data/pengumuman.json';

// Helper load data
function getPengumumanData($file) {
    if (!file_exists($file)) {
        file_put_contents($file, json_encode([], JSON_PRETTY_PRINT));
        return [];
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

// Helper save data
function savePengumumanData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

// Helper auth check
function checkAdminAuth() {
    if (empty($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Akses ditolak: Silakan login sebagai admin terlebih dahulu.']);
        exit;
    }
}

// Helper sort announcements: pinned first, then date descending
function sortPengumuman(&$items) {
    usort($items, function($a, $b) {
        $aPinned = !empty($a['is_pinned']) ? 1 : 0;
        $bPinned = !empty($b['is_pinned']) ? 1 : 0;

        if ($aPinned !== $bPinned) {
            return $bPinned - $aPinned; // Pinned first
        }

        // Secondary sort: date or created_at descending
        $dateA = $a['date'] ?? ($a['created_at'] ?? '');
        $dateB = $b['date'] ?? ($b['created_at'] ?? '');
        return strcmp($dateB, $dateA);
    });
}

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// 1. GET (Publik & Admin)
// ==========================================
if ($method === 'GET') {
    $items = getPengumumanData($dataFile);

    // Filter by ID
    if (!empty($_GET['id'])) {
        $targetId = trim($_GET['id']);
        foreach ($items as $item) {
            if ($item['id'] === $targetId) {
                echo json_encode(['success' => true, 'data' => $item]);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Pengumuman tidak ditemukan.']);
        exit;
    }

    // Filter by Kategori
    if (!empty($_GET['kategori'])) {
        $kat = strtolower(trim($_GET['kategori']));
        if ($kat !== 'semua' && $kat !== '') {
            $items = array_values(array_filter($items, function($item) use ($kat) {
                return strtolower($item['category'] ?? '') === $kat;
            }));
        }
    }

    // Filter by Pinned only
    if (isset($_GET['pinned']) && $_GET['pinned'] === '1') {
        $items = array_values(array_filter($items, function($item) {
            return !empty($item['is_pinned']);
        }));
    }

    // Search query
    if (!empty($_GET['q'])) {
        $q = strtolower(trim($_GET['q']));
        $items = array_values(array_filter($items, function($item) use ($q) {
            return strpos(strtolower($item['title'] ?? ''), $q) !== false
                || strpos(strtolower($item['category'] ?? ''), $q) !== false
                || strpos(strtolower($item['summary'] ?? ''), $q) !== false
                || strpos(strtolower($item['content'] ?? ''), $q) !== false;
        }));
    }

    sortPengumuman($items);

    echo json_encode([
        'success' => true,
        'data' => $items,
        'total' => count($items)
    ]);
    exit;
}

// ==========================================
// 2. POST (Admin Only)
// ==========================================
if ($method === 'POST') {
    checkAdminAuth();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $action = $input['action'] ?? 'create';
    $items = getPengumumanData($dataFile);

    switch ($action) {
        case 'create':
            $title = trim($input['title'] ?? '');
            if (!$title) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Judul pengumuman wajib diisi.']);
                exit;
            }

            $date = trim($input['date'] ?? date('Y-m-d'));
            $category = trim($input['category'] ?? 'Umum');
            $summary = trim($input['summary'] ?? '');
            $content = trim($input['content'] ?? '');
            if (!$summary && $content) {
                $summary = mb_substr(strip_tags($content), 0, 120) . '...';
            }
            $isPinned = !empty($input['is_pinned']) && ($input['is_pinned'] === true || $input['is_pinned'] === '1' || $input['is_pinned'] === 1);

            $newItem = [
                'id' => 'ann-' . time() . '-' . rand(100, 999),
                'title' => $title,
                'date' => $date,
                'category' => $category,
                'summary' => $summary,
                'content' => $content,
                'is_pinned' => $isPinned,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            array_unshift($items, $newItem);
            sortPengumuman($items);
            savePengumumanData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Pengumuman baru berhasil ditambahkan.',
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
                echo json_encode(['success' => false, 'message' => 'Pengumuman tidak ditemukan.']);
                exit;
            }

            if (!empty($input['title'])) {
                $items[$foundIndex]['title'] = trim($input['title']);
            }
            if (isset($input['date'])) {
                $items[$foundIndex]['date'] = trim($input['date']);
            }
            if (isset($input['category'])) {
                $items[$foundIndex]['category'] = trim($input['category']);
            }
            if (isset($input['summary'])) {
                $items[$foundIndex]['summary'] = trim($input['summary']);
            }
            if (isset($input['content'])) {
                $items[$foundIndex]['content'] = trim($input['content']);
            }
            if (isset($input['is_pinned'])) {
                $items[$foundIndex]['is_pinned'] = !empty($input['is_pinned']) && ($input['is_pinned'] === true || $input['is_pinned'] === '1' || $input['is_pinned'] === 1);
            }
            $items[$foundIndex]['updated_at'] = date('Y-m-d H:i:s');

            sortPengumuman($items);
            savePengumumanData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Pengumuman berhasil diperbarui.',
                'data' => $items[$foundIndex]
            ]);
            break;

        case 'delete':
            $id = $input['id'] ?? '';
            $initialCount = count($items);
            $items = array_values(array_filter($items, function($item) use ($id) {
                return $item['id'] !== $id;
            }));

            if (count($items) === $initialCount) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Pengumuman tidak ditemukan untuk dihapus.']);
                exit;
            }

            savePengumumanData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Pengumuman berhasil dihapus.'
            ]);
            break;

        case 'toggle_pin':
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
                echo json_encode(['success' => false, 'message' => 'Pengumuman tidak ditemukan.']);
                exit;
            }

            $currentPinned = !empty($items[$foundIndex]['is_pinned']);
            $items[$foundIndex]['is_pinned'] = !$currentPinned;
            $items[$foundIndex]['updated_at'] = date('Y-m-d H:i:s');

            sortPengumuman($items);
            savePengumumanData($dataFile, $items);

            $statusText = $items[$foundIndex]['is_pinned'] ? 'disematkan (pinned)' : 'dilepas pin-nya';
            echo json_encode([
                'success' => true,
                'message' => "Pengumuman berhasil {$statusText}.",
                'data' => $items[$foundIndex]
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
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
