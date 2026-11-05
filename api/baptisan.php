<?php
/**
 * api/baptisan.php
 * API CRUD untuk Pendaftaran Baptisan.
 * POST (publik): submit pendaftaran baru.
 * GET + POST admin: baca semua data, update status, delete.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/../data/baptisan.json';

function getBaptisanData($file) {
    if (!file_exists($file)) {
        file_put_contents($file, '[]');
        return [];
    }
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function saveBaptisanData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function isAdminBaptisan() {
    return !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function requireAdminBaptisan() {
    if (!isAdminBaptisan()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Akses ditolak.']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];

// ===== GET =====
if ($method === 'GET') {
    requireAdminBaptisan();
    $items = getBaptisanData($dataFile);

    // Filter status
    if (!empty($_GET['status'])) {
        $s     = strtolower(trim($_GET['status']));
        $items = array_values(array_filter($items, fn($i) => strtolower($i['status'] ?? '') === $s));
    }

    // Sort terbaru dulu
    usort($items, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));

    echo json_encode(['success' => true, 'data' => $items, 'total' => count($items)]);
    exit;
}

// ===== POST =====
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $action = $input['action'] ?? 'daftar';
    $items  = getBaptisanData($dataFile);

    // ---- PUBLIK: submit pendaftaran ----
    if ($action === 'daftar' || $action === 'submit') {
        $nama         = trim($input['nama_lengkap'] ?? '');
        $ttl          = trim($input['tempat_tanggal_lahir'] ?? '');
        if (!$ttl && !empty($input['tempat_lahir'])) {
            $ttl = trim($input['tempat_lahir']) . ', ' . trim($input['tanggal_lahir'] ?? '');
        }
        $ortu         = trim($input['nama_orang_tua'] ?? '');
        $wa           = preg_replace('/[^0-9]/', '', trim($input['no_wa'] ?? ''));
        $tgl_baptisan = trim($input['tgl_baptisan'] ?? ($input['jadwal_baptisan'] ?? ''));
        $berkas_url   = trim($input['berkas_url'] ?? '');

        if (!$nama || !$wa || !$tgl_baptisan) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nama, No. WhatsApp, dan Tanggal Baptisan wajib diisi.']);
            exit;
        }

        $newItem = [
            'id'                   => 'bpt-' . time() . '-' . rand(100, 999),
            'nama_lengkap'         => $nama,
            'tempat_tanggal_lahir' => $ttl,
            'nama_orang_tua'       => $ortu,
            'no_wa'                => $wa,
            'tgl_baptisan'         => $tgl_baptisan,
            'catatan'              => trim($input['catatan'] ?? ''),
            'berkas_url'           => $berkas_url,
            'status'               => 'Pending',
            'created_at'           => date('Y-m-d H:i:s'),
        ];
        array_unshift($items, $newItem);
        saveBaptisanData($dataFile, $items);

        echo json_encode([
            'success' => true,
            'message' => 'Pendaftaran baptisan berhasil dikirim! Tim GBI Getsemani akan menghubungi Anda via WhatsApp untuk konfirmasi.',
            'id'      => $newItem['id'],
        ]);
        exit;
    }

    // ---- ADMIN ONLY ----
    requireAdminBaptisan();

    if ($action === 'create') {
        $nama         = trim($input['nama_lengkap'] ?? '');
        $ttl          = trim($input['tempat_tanggal_lahir'] ?? '');
        $ortu         = trim($input['nama_orang_tua'] ?? '');
        $wa           = preg_replace('/[^0-9]/', '', trim($input['no_wa'] ?? ''));
        $tgl_baptisan = trim($input['tgl_baptisan'] ?? ($input['jadwal_baptisan'] ?? ''));
        $status       = trim($input['status'] ?? 'Pending');
        $berkas_url   = trim($input['berkas_url'] ?? '');

        if (!$nama || !$wa) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nama calon baptis dan No. WhatsApp wajib diisi.']);
            exit;
        }

        $newItem = [
            'id'                   => 'bpt-' . time() . '-' . rand(100, 999),
            'nama_lengkap'         => $nama,
            'tempat_tanggal_lahir' => $ttl,
            'nama_orang_tua'       => $ortu,
            'no_wa'                => $wa,
            'tgl_baptisan'         => $tgl_baptisan ?: 'Gelombang Selanjutnya',
            'alamat'               => trim($input['alamat'] ?? ''),
            'catatan'              => trim($input['catatan'] ?? ''),
            'berkas_url'           => $berkas_url,
            'status'               => in_array($status, ['Pending', 'Disetujui', 'Selesai', 'Ditolak']) ? $status : 'Pending',
            'catatan_admin'        => trim($input['catatan_admin'] ?? ''),
            'created_at'           => date('Y-m-d H:i:s'),
        ];
        array_unshift($items, $newItem);
        saveBaptisanData($dataFile, $items);

        echo json_encode([
            'success' => true,
            'message' => 'Pendaftar baptisan berhasil ditambahkan.',
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
            echo json_encode(['success' => false, 'message' => 'Data baptisan tidak ditemukan.']);
            exit;
        }

        if (isset($input['nama_lengkap'])) $items[$foundIndex]['nama_lengkap'] = trim($input['nama_lengkap']);
        if (isset($input['tempat_tanggal_lahir'])) $items[$foundIndex]['tempat_tanggal_lahir'] = trim($input['tempat_tanggal_lahir']);
        if (isset($input['nama_orang_tua'])) $items[$foundIndex]['nama_orang_tua'] = trim($input['nama_orang_tua']);
        if (isset($input['no_wa'])) $items[$foundIndex]['no_wa'] = preg_replace('/[^0-9]/', '', trim($input['no_wa']));
        if (isset($input['tgl_baptisan'])) $items[$foundIndex]['tgl_baptisan'] = trim($input['tgl_baptisan']);
        if (isset($input['alamat'])) $items[$foundIndex]['alamat'] = trim($input['alamat']);
        if (isset($input['catatan'])) $items[$foundIndex]['catatan'] = trim($input['catatan']);
        if (isset($input['berkas_url'])) $items[$foundIndex]['berkas_url'] = trim($input['berkas_url']);
        if (!empty($input['status'])) {
            $valid = ['Pending', 'Disetujui', 'Selesai', 'Ditolak'];
            if (in_array($input['status'], $valid)) {
                $items[$foundIndex]['status'] = $input['status'];
            }
        }
        if (isset($input['catatan_admin'])) $items[$foundIndex]['catatan_admin'] = trim($input['catatan_admin']);
        $items[$foundIndex]['updated_at'] = date('Y-m-d H:i:s');

        saveBaptisanData($dataFile, $items);
        echo json_encode([
            'success' => true,
            'message' => 'Data pendaftar baptisan berhasil diperbarui.',
            'data'    => $items[$foundIndex]
        ]);
        exit;
    }

    if ($action === 'update_status') {
        $id     = $input['id'] ?? '';
        $status = $input['status'] ?? '';
        $valid  = ['Pending', 'Disetujui', 'Selesai', 'Ditolak'];
        if (!in_array($status, $valid)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Status tidak valid.']);
            exit;
        }
        $found = false;
        foreach ($items as &$item) {
            if ($item['id'] === $id) {
                $item['status']     = $status;
                $item['updated_at'] = date('Y-m-d H:i:s');
                $item['catatan_admin'] = trim($input['catatan_admin'] ?? $item['catatan_admin'] ?? '');
                $found = true;
                break;
            }
        }
        unset($item);
        if (!$found) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Data tidak ditemukan.']); exit; }
        saveBaptisanData($dataFile, $items);
        echo json_encode(['success' => true, 'message' => "Status diubah menjadi: $status."]);
        exit;
    }

    if ($action === 'delete') {
        $id    = $input['id'] ?? '';
        $items = array_values(array_filter($items, fn($i) => $i['id'] !== $id));
        saveBaptisanData($dataFile, $items);
        echo json_encode(['success' => true, 'message' => 'Data pendaftaran baptisan dihapus.']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Aksi tidak valid.']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
