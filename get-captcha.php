<?php
// get-captcha.php
header('Content-Type: application/json');
include 'db.php'; // Assumes you have a working $conn in db.php

// Randomly select CAPTCHA type
$type = rand(0, 1) ? "text" : "puzzle"; // 50% chance for each

if ($type === "text") {
    // Get one random text-based CAPTCHA
    $sql = "SELECT id, question FROM text_questions ORDER BY RAND() LIMIT 1";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $captcha = $result->fetch_assoc();
        echo json_encode([
            "type" => "text",
            "id" => $captcha['id'],
            "question" => $captcha['question']
        ]);
    } else {
        echo json_encode([
            "error" => true,
            "message" => "No text captchas found in database"
        ]);
    }

} else {
    // Get all puzzle image pieces from puzzle_pieces table
    $sql = "SELECT image_path FROM puzzle_pieces";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $pieces = [];
        while ($row = $result->fetch_assoc()) {
            $pieces[] = $row['image_path'];
        }

        // Shuffle puzzle pieces
        shuffle($pieces);

        echo json_encode([
            "type" => "puzzle",
            "pieces" => $pieces
        ]);
    } else {
        echo json_encode([
            "error" => true,
            "message" => "No puzzle pieces found in database"
        ]);
    }
}

$conn->close();
?>
