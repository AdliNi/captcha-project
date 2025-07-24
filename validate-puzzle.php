<?php
session_start();

header("Access-Control-Allow-Origin: *");  // Allow cross-origin requests
header("Access-Control-Allow-Methods: GET, POST");  // Allow specific HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Authorization");  // Allow specific headers
header('Content-Type: application/json');
include 'db.php';

// === Step 1: Get POST Data ===
$data = json_decode(file_get_contents("php://input"), true);
$submitted = $data['order'] ?? [];
$token = $data['token'] ?? '';
$timeTaken = isset($data['time_taken']) ? intval($data['time_taken']) : 0;
$mouseData = $data['mouse_path'] ?? [];
$mousePathJson = json_encode($mouseData);

// === Step 2: Validate Session ===
if (!isset($_SESSION['captcha_token'], $_SESSION['captcha_answer'])) {
    echo json_encode(["success" => false, "message" => "No CAPTCHA session found"]);
    exit;
}
if ($token !== $_SESSION['captcha_token']) {
    echo json_encode(["success" => false, "message" => "Invalid CAPTCHA token"]);
    exit;
}

// === Step 3: Compare Answer ===
$correctOrder = $_SESSION['captcha_answer'];
$submittedJson = json_encode($submitted);
$correctJson = json_encode($correctOrder);

$isCorrect = $submitted === $correctOrder;
$result = $isCorrect ? 'pass' : 'fail';
$isBot = false;
$botReason = '';

// === Step 4: Bot Detection Rules ===

// Rule 1: Solved too fast
if ($timeTaken < 500) {
    $isBot = true;
    $botReason = "Solved too fast";
}

// Rule 2: Straight-line movement
if (!$isBot && count($mouseData) >= 3) {
    $angleChanges = [];
    for ($i = 1; $i < count($mouseData) - 1; $i++) {
        $a = $mouseData[$i - 1];
        $b = $mouseData[$i];
        $c = $mouseData[$i + 1];

        $angle1 = atan2($b['y'] - $a['y'], $b['x'] - $a['x']);
        $angle2 = atan2($c['y'] - $b['y'], $c['x'] - $b['x']);

        $delta = abs($angle2 - $angle1);
        if ($delta > M_PI) {
            $delta = 2 * M_PI - $delta;
        }
        $angleChanges[] = $delta;
    }

    $avgAngleChange = array_sum($angleChanges) / count($angleChanges);
    if ($avgAngleChange < 0.1) {
        $isBot = true;
        $botReason = "Mouse movement too linear";
    }
}

// Rule 3: Mouse barely moved
if (!$isBot && count($mouseData) > 1) {
    $totalDistance = 0;
    for ($i = 1; $i < count($mouseData); $i++) {
        $dx = $mouseData[$i]['x'] - $mouseData[$i - 1]['x'];
        $dy = $mouseData[$i]['y'] - $mouseData[$i - 1]['y'];
        $totalDistance += sqrt($dx * $dx + $dy * $dy);
    }
    if ($totalDistance < 100) {
        $isBot = true;
        $botReason = "Mouse moved very little";
    }
}

// === Step 5: Final Result Override if Bot ===
if ($isBot) {
    $result = 'bot';
}

// === Step 6: Log into Database ===
$stmt = $conn->prepare("INSERT INTO puzzle_logs (token, submitted_order, correct_order, time_taken_ms, result, mouse_path, bot_reason)
                        VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssisss", $token, $submittedJson, $correctJson, $timeTaken, $result, $mousePathJson, $botReason);
$stmt->execute();
$stmt->close();
$conn->close();

// === Step 7: Respond ===
if ($result === 'pass') {
    unset($_SESSION['captcha_token'], $_SESSION['captcha_answer']);
    echo json_encode(["success" => true, "message" => "Human verified!"]);
} elseif ($result === 'bot') {
    echo json_encode([
        "success" => false,
        "message" => $botReason,
        "bot_reason" => $botReason
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Incorrect puzzle order"]);
}
?>
