<?php
// db.php
$servername = "sql201.infinityfree.com";
$username = "if0_39442078";
$password = "vJLtyHnMYm";
$dbname = "if0_39442078_db_captcha";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
