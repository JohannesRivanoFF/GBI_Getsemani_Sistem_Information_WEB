<?php
/**
 * api/persembahan.php
 * API CRUD untuk Konfirmasi Persembahan.
 * GET (publik): tidak expose data sensitif.
 * POST: submit oleh publik (create) | admin (update status, delete).
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/../data/persembahan.json';

function getPersembahanData($file) {
    if (!file_exists($file)) {
        file_put_contents($file, '[]');
        return [];
    }
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function savePersembahanData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function isAdmin() {
    return !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function requireAdmin() {
    if (!isAdmin()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Akses ditolak.']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

// ===== GET =====
if ($method === 'GET') {
    requireAdmin(); // Data konfirmasi hanya untuk admin
    $items = getPersembahanData($dataFile);

    // Filter status
    if (!empty($_GET['status'])) {
        $s = strtolower(trim($_GET['status']));
        $items = array_values(array_filter($items, fn($i) => strtolower($i['status'] ?? '') === $s));
    }

    // Sort terbaru dulu
    usort($items, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));

    echo json_encode(['success' => true, 'data' => $items, 'total' => count($items)]);
    exit;
}

// ===== POST =====
if ($method === 'POST') {
    // Baca payload
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $action = $input['action'] ?? 'submit';
    $items  = getPersembahanData($dataFile);

    // ---- PUBLIK: submit konfirmasi persembahan ----
    if ($action === 'submit') {
        $nama = trim($input['nama'] ?? '');
        $jenis = trim($input['jenis'] ?? '');
        $rawNominal = isset($input['nominal']) ? (string)$input['nominal'] : '0';
        $nominal = (int) preg_replace('/[^0-9]/', '', $rawNominal);
        $bukti = trim($input['bukti_url'] ?? '');

        if (!$nama || !$jenis || $nominal <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nama, jenis, dan nominal wajib diisi.']);
            exit;
        }

        $jenis_valid = ['Kolekte', 'Persepuluhan', 'Pembangunan', 'Ucapan Syukur', 'Misi', 'Lainnya'];
        if (!in_array($jenis, $jenis_valid)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Jenis persembahan tidak valid.']);
            exit;
        }

        $newItem = [
            'id'         => 'psb-' . time() . '-' . rand(100, 999),
            'nama'       => $nama,
            'jenis'      => $jenis,
            'nominal'    => $nominal,
            'catatan'    => trim($input['catatan'] ?? ''),
            'bukti_url'  => $bukti,
            'status'     => 'Pending',
            'created_at' => date('Y-m-d H:i:s'),
        ];
        array_unshift($items, $newItem);
        savePersembahanData($dataFile, $items);

        echo json_encode([
            'success' => true,
            'message' => 'Konfirmasi persembahan berhasil dikirim. Tim kami akan memverifikasi dalam 1×24 jam. Tuhan memberkati!',
            'id'      => $newItem['id'],
        ]);
        exit;
    }

    // ---- ADMIN ONLY: create, update, update_status & delete ----
    requireAdmin();

    if ($action === 'create') {
        $nama = trim($input['nama'] ?? '');
        $jenis = trim($input['jenis'] ?? 'Kolekte');
        $rawNominal = isset($input['nominal']) ? (string)$input['nominal'] : '0';
        $nominal = (int) preg_replace('/[^0-9]/', '', $rawNominal);
        $status = trim($input['status'] ?? 'Terverifikasi');
        $bukti = trim($input['bukti_url'] ?? '');

        if (!$nama || $nominal <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nama jemaat dan nominal wajib diisi.']);
            exit;
        }

        $newItem = [
            'id'          => 'psb-' . time() . '-' . rand(100, 999),
            'nama'        => $nama,
            'jenis'       => $jenis,
            'nominal'     => $nominal,
            'catatan'     => trim($input['catatan'] ?? ''),
            'bukti_url'   => $bukti,
            'status'      => in_array($status, ['Pending', 'Terverifikasi', 'Ditolak']) ? $status : 'Terverifikasi',
            'created_at'  => date('Y-m-d H:i:s'),
            'verified_at' => ($status === 'Terverifikasi') ? date('Y-m-d H:i:s') : null
        ];

        array_unshift($items, $newItem);
        savePersembahanData($dataFile, $items);

        echo json_encode([
            'success' => true,
            'message' => 'Catatan persembahan berhasil ditambahkan.',
            'data'    => $newItem
        ]);
        exit;
    }

    if ($action === 'update') {
        $id = $input['id'] ?? '';
        $foundIndex = -1;
        foreach ($items as $idx => $it) {
            if ($it['id'] === $id) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex === -1) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Data persembahan tidak ditemukan.']);
            exit;
        }

        if (isset($input['nama'])) $items[$foundIndex]['nama'] = trim($input['nama']);
        if (isset($input['jenis'])) $items[$foundIndex]['jenis'] = trim($input['jenis']);
        if (isset($input['nominal'])) {
            $rawNominal = (string)$input['nominal'];
            $items[$foundIndex]['nominal'] = (int) preg_replace('/[^0-9]/', '', $rawNominal);
        }
        if (isset($input['catatan'])) $items[$foundIndex]['catatan'] = trim($input['catatan']);
        if (isset($input['bukti_url'])) $items[$foundIndex]['bukti_url'] = trim($input['bukti_url']);
        if (!empty($input['status'])) {
            $valid = ['Pending', 'Terverifikasi', 'Ditolak'];
            if (in_array($input['status'], $valid)) {
                $items[$foundIndex]['status'] = $input['status'];
                if ($input['status'] === 'Terverifikasi' && empty($items[$foundIndex]['verified_at'])) {
                    $items[$foundIndex]['verified_at'] = date('Y-m-d H:i:s');
                }
            }
        }
        $items[$foundIndex]['updated_at'] = date('Y-m-d H:i:s');

        savePersembahanData($dataFile, $items);
        echo json_encode([
            'success' => true,
            'message' => 'Data persembahan berhasil diperbarui.',
            'data'    => $items[$foundIndex]
        ]);
        exit;
    }

    if ($action === 'update_status') {
        $id     = $input['id'] ?? '';
        $status = $input['status'] ?? '';
        $valid  = ['Pending', 'Terverifikasi', 'Ditolak'];
        if (!in_array($status, $valid)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Status tidak valid.']);
            exit;
        }
        $found = false;
        foreach ($items as &$item) {
            if ($item['id'] === $id) {
                $item['status'] = $status;
                $item['verified_at'] = ($status === 'Terverifikasi') ? date('Y-m-d H:i:s') : null;
                $found = true;
                break;
            }
        }
        unset($item);
        if (!$found) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Data tidak ditemukan.']); exit; }
        savePersembahanData($dataFile, $items);
        echo json_encode(['success' => true, 'message' => "Status diubah menjadi: $status."]);
        exit;
    }

    if ($action === 'delete') {
        $id    = $input['id'] ?? '';
        $items = array_values(array_filter($items, fn($i) => $i['id'] !== $id));
        savePersembahanData($dataFile, $items);
        echo json_encode(['success' => true, 'message' => 'Data persembahan berhasil dihapus.']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Aksi tidak valid.']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
