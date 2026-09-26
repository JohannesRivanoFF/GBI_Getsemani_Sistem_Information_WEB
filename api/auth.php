<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Config credentials (Bisa disesuaikan pengurus gereja)
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'admin123');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$action = $input['action'] ?? ($_GET['action'] ?? '');

switch ($action) {
    case 'login':
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if ($username === ADMIN_USER && $password === ADMIN_PASS) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_user'] = $username;
            echo json_encode([
                'success' => true,
                'message' => 'Login berhasil!',
                'username' => $username
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Username atau password salah.'
            ]);
        }
        break;

    case 'logout':
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        echo json_encode([
            'success' => true,
            'message' => 'Berhasil keluar.'
        ]);
        break;

    case 'check':
    default:
        $isLoggedIn = !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
        echo json_encode([
            'authenticated' => $isLoggedIn,
            'username' => $isLoggedIn ? ($_SESSION['admin_user'] ?? 'admin') : null
        ]);
        break;
}
