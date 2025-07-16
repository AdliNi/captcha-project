<?php
// get-captcha.php
session_start();
include 'db.php';

// Allow all origins (you can change '*' to a specific domain if needed)
header("Access-Control-Allow-Origin: *");  // Allow cross-origin requests
header("Access-Control-Allow-Methods: GET, POST");  // Allow specific HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Authorization");  // Allow specific headers
header("Content-Type: application/json"); // REQUIRED for JSON responses

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
