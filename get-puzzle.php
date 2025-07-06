<?php
session_start();
include 'db.php';

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
