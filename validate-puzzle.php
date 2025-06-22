<?php
session_start();
header('Content-Type: application/json');

// Get POSTed data
$data = json_decode(file_get_contents(filename: "php://input"), true);
$submitted = $data['order'] ?? [];
$token = $data['token'] ?? '';

if (!isset($_SESSION['captcha_token'], $_SESSION['captcha_answer'])) {
    echo json_encode(["success" => false, "message" => "No CAPTCHA session found"]);
    exit;
}

if ($token !== $_SESSION['captcha_token']) {
    echo json_encode(["success" => false, "message" => "Invalid CAPTCHA token"]);
    exit;
}

// Get correct order from session
$correctOrder = $_SESSION['captcha_answer'];

// Check if order matches exactly
$valid = $submitted === $correctOrder;

if ($valid) {
    unset($_SESSION['captcha_token'], $_SESSION['captcha_answer']);
    echo json_encode(["success" => true, "message" => "Human verified!"]);
} else {
    echo json_encode(["success" => false, "message" => "Incorrect puzzle order"]);
}
?>
