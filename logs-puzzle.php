<?php
include 'db.php';

$result = $conn->query("SELECT * FROM puzzle_logs ORDER BY created_at DESC LIMIT 100");
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Puzzle CAPTCHA Logs</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      padding: 8px;
      border: 1px solid #ccc;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    .details {
      font-size: 0.9em;
      background-color: #f9f9f9;
      margin-top: 5px;
      padding: 8px;
      display: none;
    }
    .show-btn {
      color: blue;
      cursor: pointer;
      text-decoration: underline;
    }
    .log-title {
      margin-bottom: 0;
    }
    .json-box {
      font-family: monospace;
      white-space: pre-wrap;
      background-color: #eee;
      padding: 5px;
      border: 1px solid #ccc;
      max-height: 200px;
      overflow-y: auto;
    }
    canvas {
      border: 1px solid #ccc;
      margin-top: 20px;
      display: block;
    }
  </style>
</head>
<body>

<h1>Puzzle CAPTCHA Attempt Logs</h1>

<table id="logsTable">
  <tr>
    <th>ID</th>
    <th>Token</th>
    <th>Time (ms)</th>
    <th>Result</th>
    <th>Timestamp</th>
    <th>Actions</th>
  </tr>

<?php
if ($result && $result->num_rows > 0) {
  while ($row = $result->fetch_assoc()) {
    $id = $row['id'];
    $token = htmlspecialchars($row['token']);
    $time = $row['time_taken_ms'];
    $resultText = $row['result'] === 'pass' ? 'Pass' : 'Fail';
    $created = $row['created_at'];

    $submitted = htmlspecialchars($row['submitted_order']);
    $correct = htmlspecialchars($row['correct_order']);
    $mousePathRaw = $row['mouse_path'];
    $mouseAttr = htmlspecialchars($mousePathRaw);

    echo "<tr class='log-row' data-id='$id' data-mouse=\"$mouseAttr\">
      <td>$id</td>
      <td>$token</td>
      <td>$time</td>
      <td>$resultText</td>
      <td>$created</td>
      <td><span class='show-btn' onclick='toggleDetails($id)'>Toggle Details</span></td>
    </tr>";

    echo "<tr class='details-row'>
      <td colspan='6'>
        <div class='details' id='details-$id'>
          <p class='log-title'><strong>Submitted Order:</strong></p>
          <div class='json-box'>$submitted</div>
          <p class='log-title'><strong>Correct Order:</strong></p>
          <div class='json-box'>$correct</div>
          <p class='log-title'><strong>Mouse Path (JSON):</strong></p>
          <div class='json-box'>$mouseAttr</div>
        </div>
      </td>
    </tr>";
  }
} else {
  echo "<tr><td colspan='6'>No logs found.</td></tr>";
}
$conn->close();
?>
</table>

<h3>Mouse Movement Visualization</h3>
<canvas id="mouseCanvas" width="800" height="400"></canvas>

<script>
const canvas = document.getElementById("mouseCanvas");
const ctx = canvas.getContext("2d");

function toggleDetails(id) {
  const detailBox = document.getElementById("details-" + id);
  const shouldShow = detailBox.style.display === "none";
  detailBox.style.display = shouldShow ? "block" : "none";

  if (!shouldShow) return;

  const row = document.querySelector(`tr[data-id='${id}']`);
  if (!row) return;

  const mouseData = row.getAttribute("data-mouse");
  if (!mouseData) return;

  let points;
  try {
    points = JSON.parse(mouseData);
  } catch (e) {
    console.warn("Invalid JSON in mouse path");
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!points || points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.stroke();
}
</script>

</body>
</html>
