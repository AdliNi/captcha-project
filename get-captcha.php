<?php
session_start();
include 'db.php';

// Randomly choose CAPTCHA type each time
$type = rand(0, 1) ? "text" : "puzzle";

if ($type === "puzzle") {
    $sql = "SELECT image_path FROM puzzle_pieces";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $pieces = [];
        while ($row = $result->fetch_assoc()) {
            $pieces[] = $row['image_path'];
        }

        $token = bin2hex(random_bytes(16));

        // Store correct order for validation
        $_SESSION['captcha_token'] = $token;
        $_SESSION['captcha_answer'] = $pieces;
        $_SESSION['captcha_issued_at'] = time();

        // Shuffle for display
        shuffle($pieces);

        echo json_encode([
            "type" => "puzzle",
            "token" => $token,
            "pieces" => $pieces
        ]);
    } else {
        echo json_encode([
            "error" => true,
            "message" => "No puzzle pieces found"
        ]);
    }

} else {
    // Text-based CAPTCHA
    $sql = "SELECT id, question FROM text_questions ORDER BY RAND() LIMIT 1";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $captcha = $result->fetch_assoc();

        $token = bin2hex(random_bytes(16));

        // Store token and reference ID for validation
        $_SESSION['captcha_token'] = $token;
        $_SESSION['captcha_answer'] = ['id' => $captcha['id']];
        $_SESSION['captcha_issued_at'] = time();

        echo json_encode([
            "type" => "text",
            "id" => $captcha['id'],
            "question" => $captcha['question'],
            "token" => $token
        ]);
    } else {
        echo json_encode([
            "error" => true,
            "message" => "No text CAPTCHA questions found"
        ]);
    }
}

$conn->close();
?>
