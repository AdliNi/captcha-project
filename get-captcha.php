<?php
// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *"); // Or restrict to http://localhost
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    exit(0);
}

// Main response headers
header("Access-Control-Allow-Origin: *"); // Or use http://localhost for more security
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

session_start();
include 'db.php';

// Randomly choose CAPTCHA type
$type = rand(0, 1) ? "text" : "puzzle";
$token = bin2hex(random_bytes(16));

// Store in session
$_SESSION['captcha_token'] = $token;
$_SESSION['captcha_type'] = $type;
$_SESSION['captcha_issued_at'] = time();

// Send response
echo json_encode([
    "type" => $type,
    "token" => $token
]);

$conn->close();
?>
