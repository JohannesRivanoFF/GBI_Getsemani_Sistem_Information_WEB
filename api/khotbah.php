<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/../data/khotbah.json';

// Helper load data
function getKhotbahData($file) {
    if (!file_exists($file)) {
        file_put_contents($file, json_encode([], JSON_PRETTY_PRINT));
        return [];
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

// Helper save data
function saveKhotbahData($file, $data) {
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

// Helper extract YouTube thumbnail from URL
function getYouTubeThumbnail($url) {
    if (preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i', $url, $matches)) {
        $videoId = $matches[1];
        return "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg";
    }
    return '';
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $items = getKhotbahData($dataFile);
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
    $items = getKhotbahData($dataFile);

    switch ($action) {
        case 'create':
            $title = trim($input['title'] ?? '');
            $youtube_url = trim($input['youtube_url'] ?? '');
            if (!$title) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Judul khotbah wajib diisi.']);
                exit;
            }

            $thumbnail = trim($input['thumbnail'] ?? '');
            if (empty($thumbnail) && !empty($youtube_url)) {
                $thumbnail = getYouTubeThumbnail($youtube_url);
            }

            $newItem = [
                'id' => 'khotbah-' . time() . '-' . rand(100, 999),
                'title' => $title,
                'series' => trim($input['series'] ?? 'M|G'),
                'pastor' => trim($input['pastor'] ?? 'Pdt. Michael Gunawan'),
                'youtube_url' => $youtube_url,
                'thumbnail' => $thumbnail ?: './Resource/Screenshot 2026-07-26 233705.png',
                'duration' => trim($input['duration'] ?? '30:00'),
                'views' => trim($input['views'] ?? '100 views')
            ];

            array_unshift($items, $newItem);
            saveKhotbahData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Khotbah terbaru berhasil ditambahkan.',
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
                echo json_encode(['success' => false, 'message' => 'Data khotbah tidak ditemukan.']);
                exit;
            }

            if (!empty($input['title'])) $items[$foundIndex]['title'] = trim($input['title']);
            if (isset($input['series'])) $items[$foundIndex]['series'] = trim($input['series']);
            if (isset($input['pastor'])) $items[$foundIndex]['pastor'] = trim($input['pastor']);
            if (isset($input['youtube_url'])) {
                $items[$foundIndex]['youtube_url'] = trim($input['youtube_url']);
            }
            if (isset($input['thumbnail'])) {
                $thumb = trim($input['thumbnail']);
                if (empty($thumb) && !empty($items[$foundIndex]['youtube_url'])) {
                    $thumb = getYouTubeThumbnail($items[$foundIndex]['youtube_url']);
                }
                $items[$foundIndex]['thumbnail'] = $thumb;
            }
            if (isset($input['duration'])) $items[$foundIndex]['duration'] = trim($input['duration']);
            if (isset($input['views'])) $items[$foundIndex]['views'] = trim($input['views']);

            saveKhotbahData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Data khotbah berhasil diperbarui.',
                'data' => $items[$foundIndex]
            ]);
            break;

        case 'delete':
            $id = $input['id'] ?? '';
            $items = array_values(array_filter($items, function($item) use ($id) {
                return $item['id'] !== $id;
            }));

            saveKhotbahData($dataFile, $items);

            echo json_encode([
                'success' => true,
                'message' => 'Khotbah berhasil dihapus.'
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
