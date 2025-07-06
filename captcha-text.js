document.addEventListener("DOMContentLoaded", () => {
  let currentCaptchaId = null;
  let captchaToken = null;
  let captchaStartTime = null;
  let mouseMovements = [];

  const returnUrl = new URLSearchParams(window.location.search).get("returnUrl") || "/";
  const tokenFromURL = new URLSearchParams(window.location.search).get("token");

  // Track mouse movement
  document.addEventListener("mousemove", (e) => {
    mouseMovements.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now()
    });
  });

  // === Fetch question from new endpoint ===
  fetch("get-text.php")
    .then(res => res.json())
    .then(data => {
      if (data.error || !data.question || !data.id || !data.token) {
        document.getElementById("message").textContent = "⚠️ Failed to load CAPTCHA. Try refreshing.";
        console.error("CAPTCHA error:", data.message || data);
        return;
      }

      // Assign question content
      document.getElementById("captchaQuestion").innerText = data.question;
      currentCaptchaId = data.id;
      captchaToken = data.token;
      captchaStartTime = Date.now();
    })
    .catch(err => {
      console.error("Fetch error:", err);
      document.getElementById("message").textContent = "⚠️ Error loading CAPTCHA. Check your connection.";
    });

  function checkCaptcha() {
    const answer = document.getElementById('captchaAnswer').value.trim();
    const messageEl = document.getElementById('message');
    const timeTaken = Date.now() - captchaStartTime;

    fetch("validate-text.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        captcha_id: currentCaptchaId,
        user_answer: answer,
        time_taken: timeTaken,
        mouse_data: mouseMovements,
        token: captchaToken
      })
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        messageEl.style.color = 'green';
        messageEl.textContent = '✅ CAPTCHA passed! Redirecting...';
        sessionStorage.removeItem("captchaInProgress");
        sessionStorage.removeItem("captchaRequired");

        // Redirect user
        setTimeout(() => {
          window.location.href = decodeURIComponent(returnUrl);
        }, 1000);
      } else {
        messageEl.style.color = 'red';
        messageEl.textContent = '❌ ' + result.message;
      }
    })
    .catch((err) => {
      console.error("Validation error:", err);
      messageEl.style.color = 'red';
      messageEl.textContent = '⚠️ Error validating CAPTCHA. Try again.';
    });
  }

  // === Bind UI Events ===
  document.getElementById('submitBtn').addEventListener('click', (e) => {
    e.preventDefault();
    checkCaptcha();
  });

  document.getElementById('captchaAnswer').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      checkCaptcha();
    }
  });
});
