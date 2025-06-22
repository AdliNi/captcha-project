<?php
session_start();
include 'db.php';

$type = rand(0, 1) ? "text" : "puzzle";

if ($type === "puzzle") {
    $sql = "SELECT image_path FROM puzzle_pieces";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $pieces = [];
        while ($row = $result->fetch_assoc()) {
            $pieces[] = $row['image_path'];
        }

        // Store correct order for validation
        $_SESSION['captcha_token'] = bin2hex(random_bytes(16));
        $_SESSION['captcha_answer'] = $pieces;

        // Shuffle for display
        shuffle($pieces);

        echo json_encode([
            "type" => "puzzle",
            "token" => $_SESSION['captcha_token'],
            "pieces" => $pieces
        ]);
    } else {
        echo json_encode(["error" => true, "message" => "No puzzle pieces found"]);
    }

} else {
    // Text-based fallback
    $sql = "SELECT id, question FROM captchas ORDER BY RAND() LIMIT 1";
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $captcha = $result->fetch_assoc();
        echo json_encode([
            "type" => "text",
            "id" => $captcha['id'],
            "question" => $captcha['question']
        ]);
    } else {
        echo json_encode(["error" => true, "message" => "No text captchas found"]);
    }
}

$conn->close();
?>
