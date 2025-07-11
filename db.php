<?php
//For InfinityFree hosting, use the following credentials
$servername = "sql201.infinityfree.com";      // MySQL Hostname
$username = "if0_39442078";                   // MySQL Username
$password = "vJLtyHnMYm";                     // MySQL Password
$database = "if0_39442078_db_captcha";        // Database Name

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
