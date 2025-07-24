<?php
include 'db.php';

// Allow all origins (you can change '*' to a specific domain if needed)
header("Access-Control-Allow-Origin: *");  // Allow cross-origin requests
header("Access-Control-Allow-Methods: GET, POST");  // Allow specific HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Authorization");  // Allow specific headers

$result = $conn->query("SELECT * FROM puzzle_logs ORDER BY created_at DESC LIMIT 100");
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Puzzle CAPTCHA Logs</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 8px; border: 1px solid #ccc; text-align: left; }
    th { background-color: #f2f2f2; }
    tr.log-row:hover { background-color: #e6f0ff; cursor: pointer; }
    .details {
      font-size: 0.9em;
      background-color: #f9f9f9;
      margin-top: 5px;
      padding: 10px;
      border: 1px solid #ccc;
      display: none;
    }
    .log-title { margin-bottom: 5px; margin-top: 10px; }
    .json-box {
      font-family: monospace;
      white-space: pre-wrap;
      background-color: #eee;
      padding: 8px;
      border: 1px solid #ccc;
      max-height: 200px;
      overflow-y: auto;
    }
    .toggle-btn {
      color: #007bff;
      text-decoration: underline;
      cursor: pointer;
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
    <th>Time (ms)</th>
    <th>Result</th>
    <th>Bot Reason</th>
    <th>Timestamp</th>
    <th>Action</th>
  </tr>

<?php
if ($result && $result->num_rows > 0) {
  while ($row = $result->fetch_assoc()) {
    $id = $row['id'];
    $time = $row['time_taken_ms'];
    $resultText = $row['result'] === 'pass' ? 'Pass' : 'Fail';
    $created = $row['created_at'];

    $submitted = htmlspecialchars($row['submitted_order']);
    $correct = htmlspecialchars($row['correct_order']);
    $mousePathRaw = $row['mouse_path'];
    $mouseAttr = htmlspecialchars($mousePathRaw);
    $botReason = isset($row['bot_reason']) ? htmlspecialchars($row['bot_reason']) : '';

    echo "<tr class='log-row' data-id='$id' data-mouse=\"$mouseAttr\" data-submitted='$submitted' data-correct='$correct'>
      <td>$id</td>
      <td>$time</td>
      <td>$resultText</td>
      <td>$botReason</td>
      <td>$created</td>
      <td><span class='toggle-btn' onclick='event.stopPropagation(); toggleDetails($id)'>Toggle Details</span></td>
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

          <p class='log-title'><strong>Bot Reason:</strong></p>
          <div class='json-box'>$botReason</div>
        </div>
      </td>
    </tr>";
  }
} else {
  echo "<tr><td colspan='5'>No logs found.</td></tr>";
}
$conn->close();
?>
</table>

<h3>Mouse Movement Visualization</h3>
<canvas id="mouseCanvas" width="800" height="400"></canvas>

<script>
const canvas = document.getElementById("mouseCanvas");
const ctx = canvas.getContext("2d");

document.querySelectorAll(".log-row").forEach(row => {
  row.addEventListener("click", () => {
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

    const xVals = points.map(p => p.x);
    const yVals = points.map(p => p.y);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const padding = 20;
    const canvasWidth = canvas.width - padding * 2;
    const canvasHeight = canvas.height - padding * 2;

    const scaleX = canvasWidth / (maxX - minX || 1);
    const scaleY = canvasHeight / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);

    ctx.beginPath();
    points.forEach((p, i) => {
      const x = padding + (p.x - minX) * scale;
      const y = padding + (p.y - minY) * scale;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
});

function toggleDetails(id) {
  const detailBox = document.getElementById("details-" + id);
  const shouldShow = detailBox.style.display === "none";
  detailBox.style.display = shouldShow ? "block" : "none";
}
</script>

</body>
</html>
