<?php
// get-captcha.php
include 'db.php'; // include the connection

// Get a random captcha
$sql = "SELECT id, question FROM captchas ORDER BY RAND() LIMIT 1";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
  $captcha = $result->fetch_assoc();
  echo json_encode($captcha);
} else {
  echo json_encode(["error" => "No captchas found"]);
}

$conn->close();
?>
