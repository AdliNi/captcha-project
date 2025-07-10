<?php
// validate-captcha.php
header('Content-Type: application/json');
include 'db.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["captcha_id"], $data["user_answer"], $data["time_taken"])) {
    echo json_encode(["success" => false, "message" => "Missing data"]);
    exit;
}

$captcha_id = intval($data["captcha_id"]);
$user_answer = strtolower(trim($data["user_answer"]));
$timeTaken = intval($data["time_taken"]);
$mouseData = isset($data["mouse_data"]) ? $data["mouse_data"] : [];

$isBot = false;
$botReason = "";

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

$mousePathJson = json_encode($mouseData);

// Save to DB (always log for analysis)
$logStmt = $conn->prepare("INSERT INTO text_logs (captcha_id, user_answer, time_taken_ms, mouse_path) VALUES (?, ?, ?, ?)");
$logStmt->bind_param("isis", $captcha_id, $user_answer, $timeTaken, $mousePathJson);
$logStmt->execute();
$logStmt->close();

// Get correct answer
$stmt = $conn->prepare("SELECT answer FROM text_questions WHERE id = ?");
$stmt->bind_param("i", $captcha_id);
$stmt->execute();
$stmt->bind_result($correct_answer);
$stmt->fetch();
$stmt->close();

$correct = strtolower(trim($correct_answer)) === $user_answer;

if ($correct && !$isBot) {
    echo json_encode(["success" => true]);
} else {
    $msg = !$correct ? "Incorrect answer" : $botReason;
    echo json_encode(["success" => false, "message" => $msg]);
}

$conn->close();
?>
