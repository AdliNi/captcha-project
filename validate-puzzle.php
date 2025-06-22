<?php
session_start();
header('Content-Type: application/json');

include 'db.php'; // Connect to your DB

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);
$submitted = $data['order'] ?? [];
$token = $data['token'] ?? '';
$timeTaken = isset($data['time_taken']) ? intval($data['time_taken']) : 0;
$mousePath = isset($data['mouse_path']) ? json_encode($data['mouse_path']) : '[]';

// Validate session
if (!isset($_SESSION['captcha_token'], $_SESSION['captcha_answer'])) {
    echo json_encode(["success" => false, "message" => "No CAPTCHA session found"]);
    exit;
}

if ($token !== $_SESSION['captcha_token']) {
    echo json_encode(["success" => false, "message" => "Invalid CAPTCHA token"]);
    exit;
}

// Get correct order
$correctOrder = $_SESSION['captcha_answer'];
$isCorrect = $submitted === $correctOrder;
$result = $isCorrect ? 'pass' : 'fail';

// Convert arrays to JSON
$submittedJson = json_encode($submitted);
$correctJson = json_encode($correctOrder);

// Log attempt
$stmt = $conn->prepare("INSERT INTO puzzle_logs (token, submitted_order, correct_order, time_taken_ms, result, mouse_path)
                        VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssiss", $token, $submittedJson, $correctJson, $timeTaken, $result, $mousePath);
$stmt->execute();
$stmt->close();

// Return result
if ($isCorrect) {
    unset($_SESSION['captcha_token'], $_SESSION['captcha_answer']);
    echo json_encode(["success" => true, "message" => "Human verified!"]);
} else {
    echo json_encode(["success" => false, "message" => "Incorrect puzzle order"]);
}

$conn->close();
?>
