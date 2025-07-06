<?php
session_start();
include 'db.php';

header("Content-Type: application/json"); // ✅ REQUIRED for JSON responses

// Randomly choose CAPTCHA type each time
$type = rand(0, 1) ? "text" : "puzzle";
$token = bin2hex(random_bytes(16));

// Store token and type in session
$_SESSION['captcha_token'] = $token;
$_SESSION['captcha_type'] = $type;
$_SESSION['captcha_issued_at'] = time();

// Return JSON to frontend
echo json_encode([
    "type" => $type,
    "token" => $token
]);

$conn->close();
?>
