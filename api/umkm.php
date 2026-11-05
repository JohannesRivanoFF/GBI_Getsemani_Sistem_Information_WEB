<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/../data/umkm.json';

// Helper: load data
function getUmkmData($file) {
    if (!file_exists($file)) {
        file_put_contents($file, json_encode([], JSON_PRETTY_PRINT));
        return [];
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

// Helper: save data
function saveUmkmData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

// Helper: auth check
function checkAdminAuth() {
    if (empty($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Akses ditolak: Silakan login sebagai admin terlebih dahulu.']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

// ===== GET: publik bisa baca, filter aktif jika bukan admin =====
if ($method === 'GET') {
    $items = getUmkmData($dataFile);
    $isAdmin = !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
    $adminMode = isset($_GET['admin']) && $isAdmin;

    if (!$adminMode) {
        // Publik: hanya tampilkan yang aktif
        $items = array_values(array_filter($items, function($item) {
            return !empty($item['aktif']);
        }));
    }

    // Filter kategori (publik)
    if (!empty($_GET['kategori'])) {
        $kat = strtolower(trim($_GET['kategori']));
        $items = array_values(array_filter($items, function($item) use ($kat) {
            return strtolower($item['kategori'] ?? '') === $kat;
        }));
    }

    // Search (publik)
    if (!empty($_GET['q'])) {
        $q = strtolower(trim($_GET['q']));
        $items = array_values(array_filter($items, function($item) use ($q) {
            return strpos(strtolower($item['nama_usaha'] ?? ''), $q) !== false
                || strpos(strtolower($item['nama_pemilik'] ?? ''), $q) !== false
                || strpos(strtolower($item['deskripsi'] ?? ''), $q) !== false;
        }));
    }

    echo json_encode(['success' => true, 'data' => $items]);
    exit;
}

// ===== POST: hanya admin =====
if ($method === 'POST') {
    checkAdminAuth();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $action = $input['action'] ?? 'create';
    $items = getUmkmData($dataFile);

    switch ($action) {

        case 'create':
            $namaUsaha = trim($input['nama_usaha'] ?? '');
            if (!$namaUsaha) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nama usaha wajib diisi.']);
                exit;
            }
            $newItem = [
                'id'          => 'umkm-' . time() . '-' . rand(100, 999),
                'nama_usaha'  => $namaUsaha,
                'nama_pemilik'=> trim($input['nama_pemilik'] ?? ''),
                'no_wa'       => preg_replace('/[^0-9]/', '', trim($input['no_wa'] ?? '')),
                'deskripsi'   => trim($input['deskripsi'] ?? ''),
                'alamat'      => trim($input['alamat'] ?? ''),
                'kategori'    => trim($input['kategori'] ?? 'Lainnya'),
                'gambar'      => trim($input['gambar'] ?? ''),
                'aktif'       => (bool)($input['aktif'] ?? true),
                'created_at'  => date('Y-m-d')
            ];
            array_unshift($items, $newItem);
            saveUmkmData($dataFile, $items);
            echo json_encode(['success' => true, 'message' => 'UMKM berhasil ditambahkan.', 'data' => $newItem]);
            break;

        case 'update':
            $id = $input['id'] ?? '';
            $foundIndex = -1;
            foreach ($items as $idx => $item) {
                if ($item['id'] === $id) { $foundIndex = $idx; break; }
            }
            if ($foundIndex === -1) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Data UMKM tidak ditemukan.']);
                exit;
            }
            $fields = ['nama_usaha', 'nama_pemilik', 'deskripsi', 'alamat', 'kategori', 'gambar'];
            foreach ($fields as $f) {
                if (isset($input[$f])) $items[$foundIndex][$f] = trim($input[$f]);
            }
            if (isset($input['no_wa'])) {
                $items[$foundIndex]['no_wa'] = preg_replace('/[^0-9]/', '', trim($input['no_wa']));
            }
            if (isset($input['aktif'])) {
                $items[$foundIndex]['aktif'] = (bool)$input['aktif'];
            }
            saveUmkmData($dataFile, $items);
            echo json_encode(['success' => true, 'message' => 'Data UMKM berhasil diperbarui.', 'data' => $items[$foundIndex]]);
            break;

        case 'toggle_aktif':
            $id = $input['id'] ?? '';
            $foundIndex = -1;
            foreach ($items as $idx => $item) {
                if ($item['id'] === $id) { $foundIndex = $idx; break; }
            }
            if ($foundIndex === -1) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Data UMKM tidak ditemukan.']);
                exit;
            }
            $items[$foundIndex]['aktif'] = !$items[$foundIndex]['aktif'];
            saveUmkmData($dataFile, $items);
            $status = $items[$foundIndex]['aktif'] ? 'Aktif' : 'Disembunyikan';
            echo json_encode(['success' => true, 'message' => "Status UMKM diubah menjadi: $status.", 'aktif' => $items[$foundIndex]['aktif']]);
            break;

        case 'delete':
            $id = $input['id'] ?? '';
            $items = array_values(array_filter($items, function($item) use ($id) {
                return $item['id'] !== $id;
            }));
            saveUmkmData($dataFile, $items);
            echo json_encode(['success' => true, 'message' => 'Data UMKM berhasil dihapus.']);
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
