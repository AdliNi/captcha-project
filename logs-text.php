<?php
include 'db.php';

// Allow all origins (you can change '*' to a specific domain if needed)
header("Access-Control-Allow-Origin: *");  // Allow cross-origin requests
header("Access-Control-Allow-Methods: GET, POST");  // Allow specific HTTP methods
header("Access-Control-Allow-Headers: Content-Type, Authorization");  // Allow specific headers


// Update SQL to join with text_questions and get the question
$result = $conn->query("SELECT l.id, l.captcha_id, q.question, l.user_answer, l.time_taken_ms, l.mouse_path, l.created_at, l.bot_reason, l.result
FROM text_logs l
LEFT JOIN text_questions q ON l.captcha_id = q.id
ORDER BY l.created_at DESC LIMIT 20");
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CAPTCHA Logs Viewer</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f8f9fa; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    canvas { border: 1px solid #000; margin-top: 20px; }
    tr:hover { background-color: #eef; cursor: pointer; }
  </style>
</head>
<body>
  <h1>CAPTCHA Logs & Mouse Movement</h1>

  <table id="logsTable">
    <thead>
      <tr>
        <th>ID</th>
        <th>Question</th>
        <th>Answer</th>
        <th>Result</th>
        <th>Bot Reason</th>
        <th>Time Taken (ms)</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      <?php while ($row = $result->fetch_assoc()): ?>
        <tr data-mouse='<?php echo htmlspecialchars($row["mouse_path"]); ?>'>
          <td><?php echo $row["captcha_id"]; ?></td>
          <td><?php echo htmlspecialchars($row["question"]); ?></td>
          <td><?php echo htmlspecialchars($row["user_answer"]); ?></td>
          <td><?php echo $row["result"] === 'pass' ? 'Pass' : ($row['result'] === 'bot' ? 'BOT' : 'Fail'); ?></td>
          <td><?php echo isset($row["bot_reason"]) ? htmlspecialchars($row["bot_reason"]) : ""; ?></td>
          <td><?php echo $row["time_taken_ms"]; ?></td>
          <td><?php echo $row["created_at"]; ?></td>
        </tr>
      <?php endwhile; ?>
    </tbody>
  </table>

  <h3>Mouse Movement</h3>
  <canvas id="mouseCanvas" width="800" height="400"></canvas>

  <script>
    const table = document.getElementById("logsTable");
    const canvas = document.getElementById("mouseCanvas");
    const ctx = canvas.getContext("2d");

    table.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      const mouseData = row.getAttribute("data-mouse");

      if (!mouseData) return;

      const points = JSON.parse(mouseData);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (points.length === 0) return;

      // Get min and max values for normalization
      const xVals = points.map(p => p.x);
      const yVals = points.map(p => p.y);
      const minX = Math.min(...xVals);
      const maxX = Math.max(...xVals);
      const minY = Math.min(...yVals);
      const maxY = Math.max(...yVals);

      const padding = 20; // padding around canvas edges
      const canvasWidth = canvas.width - padding * 2;
      const canvasHeight = canvas.height - padding * 2;

      const scaleX = canvasWidth / (maxX - minX || 1);
      const scaleY = canvasHeight / (maxY - minY || 1);
      const scale = Math.min(scaleX, scaleY); // maintain aspect ratio

      // Draw scaled and centered path
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
  </script>
</body>
</html>
