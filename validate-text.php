<?php
// validate-captcha.php

header("Access-Control-Allow-Origin: *");  // Allow cross-origin requests
header("Access-Control-Allow-Methods: GET, POST");  // Allow specific HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Authorization");  // Allow specific headers
header('Content-Type: application/json');
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["captcha_id"], $data["user_answer"], $data["time_taken"])) {
    echo json_encode(["success" => false, "message" => "Missing data"]);
    exit;
}

$captcha_id = intval($data["captcha_id"]);
$user_answer = trim($data["user_answer"]);
$timeTaken = intval($data["time_taken"]);
$mouseData = isset($data["mouse_data"]) ? $data["mouse_data"] : [];
$mousePathJson = json_encode($mouseData);
$isBot = false;
$botReason = "";

// Get correct answer
$stmt = $conn->prepare("SELECT answer FROM text_questions WHERE id = ?");
$stmt->bind_param("i", $captcha_id);
$stmt->execute();
$stmt->bind_result($correct_answer);
$stmt->fetch();
$stmt->close();

// Now check if the answer is correct
$correct = trim($correct_answer) === trim($user_answer);

// Initial result assignment based on answer correctness
$result = $correct ? 'pass' : 'fail';

// Rule 1: Check if too fast
if ($timeTaken < 500) {
    $isBot = true;
    $botReason = "Solved too fast";
}

// Rule 2: Check for straight-line mouse movement
if (count($mouseData) >= 3 && !$isBot) {
    $angleChanges = [];
    for ($i = 1; $i < count($mouseData) - 1; $i++) {
        $a = $mouseData[$i - 1];
        $b = $mouseData[$i];
        $c = $mouseData[$i + 1];

        $angle1 = atan2($b['y'] - $a['y'], $b['x'] - $a['x']);
        $angle2 = atan2($c['y'] - $b['y'], $c['x'] - $b['x']);
        $angleChanges[] = abs($angle2 - $angle1);
    }

    $avgAngleChange = array_sum($angleChanges) / count($angleChanges);

    // If movement angle is almost constant = straight line
    if ($avgAngleChange < 0.1) {
        $isBot = true;
        $botReason = "Mouse movement too linear";
    }
}

// If flagged as a bot, update result
if ($isBot) {
    $result = 'bot';
}

// Respond based on result
if ($result === 'pass') {
    echo json_encode(["success" => true]);
} elseif ($result === 'bot') {
    echo json_encode([
        "success" => false,
        "message" => $botReason,
        "bot_reason" => $botReason
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Incorrect answer"]);
}

// Save to DB (always log for analysis)
$logStmt = $conn->prepare("INSERT INTO text_logs (captcha_id, user_answer, time_taken_ms, mouse_path, bot_reason, result) VALUES (?, ?, ?, ?, ?, ?)");
$logStmt->bind_param("isisss", $captcha_id, $user_answer, $timeTaken, $mousePathJson, $botReason, $result);
$logStmt->execute();
$logStmt->close();

$conn->close();
?>
