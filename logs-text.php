<?php
include 'db.php';

$result = $conn->query("SELECT id, captcha_id, user_answer, time_taken_ms, mouse_path, created_at FROM user_logs ORDER BY created_at DESC LIMIT 20");
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
        <th>Answer</th>
        <th>Time Taken (ms)</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      <?php while ($row = $result->fetch_assoc()): ?>
        <tr data-mouse='<?php echo htmlspecialchars($row["mouse_path"]); ?>'>
          <td><?php echo $row["captcha_id"]; ?></td>
          <td><?php echo htmlspecialchars($row["user_answer"]); ?></td>
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

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  </script>
</body>
</html>
