<?php
session_start();
include 'db.php';

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

$conn->close();
?>
