function waitForModalAndRun() {
  const questionEl = document.getElementById("captchaQuestion");
  const answerInput = document.getElementById("captchaAnswer");
  const submitBtn = document.getElementById("submitBtn");
  const messageEl = document.getElementById("message");

  // Keep waiting if elements aren't injected yet
  if (!questionEl || !answerInput || !submitBtn || !messageEl) {
    return setTimeout(waitForModalAndRun, 100);
  }

  // === CAPTCHA Logic Starts Here ===
  let currentCaptchaId = null;
  let captchaToken = null;
  let captchaStartTime = null;
  let mouseMovements = [];
  let failCount = 0;
  const maxFails = 3;

  // Mouse movement tracking
  document.addEventListener("mousemove", (e) => {
    mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() });
  });

  // Load CAPTCHA question
  fetch("http://localhost/captcha-extension/get-text.php")
    .then(res => res.json())
    .then(data => {
      if (data.error || !data.question || !data.id || !data.token) {
        questionEl.textContent = "Failed to load CAPTCHA.";
        console.error("CAPTCHA error:", data.message || data);
        return;
      }

      questionEl.textContent = data.question;
      currentCaptchaId = data.id;
      captchaToken = data.token;
      captchaStartTime = Date.now();
    })
    .catch(err => {
      console.error("Fetch error:", err);
      questionEl.textContent = "Error loading CAPTCHA.";
    });

  // Submit validation
  function checkCaptcha() {
    if (failCount >= maxFails) return;

    const answer = answerInput.value.trim();
    const timeTaken = Date.now() - captchaStartTime;

    fetch("http://localhost/captcha-extension/validate-text.php", {
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
          messageEl.style.color = "green";
          messageEl.textContent = "CAPTCHA passed!";
          sessionStorage.removeItem("captchaInProgress");
          sessionStorage.removeItem("captchaRequired");

          setTimeout(() => {
            document.getElementById("captchaTextModalOverlay")?.remove();
            document.body.style.overflow = "auto";
          }, 1000);
        } else {
          failCount++;
          messageEl.style.color = "red";
          messageEl.textContent = `${result.message || "Incorrect answer."} (${failCount}/${maxFails})`;

          if (failCount >= maxFails) {
            lockUserOut();
          }
        }
      })
      .catch(err => {
        console.error("Validation error:", err);
        messageEl.style.color = "red";
        messageEl.textContent = "Validation error. Try again.";
      });
  }

  // Lockout function
  function lockUserOut() {
    messageEl.style.color = "darkred";
    messageEl.textContent = "Too many failed attempts. Try again later.";
    answerInput.disabled = true;
    submitBtn.disabled = true;

    setTimeout(() => {
      document.getElementById("captchaTextModalOverlay")?.remove();
      document.body.style.overflow = "auto";
      sessionStorage.removeItem("captchaInProgress");
    }, 3000);
  }

  // Button + Enter key bindings
  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    checkCaptcha();
  });

  answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkCaptcha();
    }
  });
}

waitForModalAndRun();
