<?php
session_start();
include 'db.php';

// Function to generate dynamic text CAPTCHA
function generateTextCaptcha() {
    $operations = ['+', '-', '*'];

    // Generate random string (6–10 characters)
    function randomString($length = 8) {
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $result = '';
        for ($i = 0; $i < $length; $i++) {
            $result .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $result;
    }

    // Randomly choose between math or typing
    $type = rand(0, 1) ? "math" : "typing";

    if ($type === "math") {
        $num1 = rand(1, 50);
        $num2 = rand(1, 50);
        $op = $operations[array_rand($operations)];

        switch ($op) {
            case '+': $answer = $num1 + $num2; break;
            case '-': $answer = $num1 - $num2; break;
            case '*': $answer = $num1 * $num2; break;
        }

        $question = "What is $num1 $op $num2?";
    } else {
        $answer = randomString(rand(6, 10)); // e.g. "xTr9QaLz"
        $question = "Please type this exactly: $answer";
    }

    return [$question, $answer];
}

// Generate CAPTCHA
list($question, $answer) = generateTextCaptcha();

// Insert into database
$stmt = $conn->prepare("INSERT INTO text_questions (question, answer) VALUES (?, ?)");
$stmt->bind_param("ss", $question, $answer);

if ($stmt->execute()) {
    $id = $stmt->insert_id; // Get ID of the inserted question
    $token = bin2hex(random_bytes(16)); // Generate secure token

    // Store validation data in session
    $_SESSION['captcha_token'] = $token;
    $_SESSION['captcha_answer'] = ['id' => $id];
    $_SESSION['captcha_issued_at'] = time();

    // Output in desired format
    echo json_encode([
        "type" => "text",
        "id" => $id,
        "question" => $question,
        "token" => $token
    ]);
} else {
    echo json_encode([
        "error" => true,
        "message" => "Failed to insert CAPTCHA question"
    ]);
}

$stmt->close();
$conn->close();
?>
