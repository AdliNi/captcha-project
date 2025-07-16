<?php
session_start();
include 'db.php';

// Allow all origins (you can change '*' to a specific domain if needed)
header("Access-Control-Allow-Origin: *");  // Allow cross-origin requests
header("Access-Control-Allow-Methods: GET, POST");  // Allow specific HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Authorization");  // Allow specific headers

header("Content-Type: application/json"); // REQUIRED for JSON responses

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

$conn->close();
?>
