document.addEventListener("DOMContentLoaded", () => {
  let currentCaptchaId = null;
  let captchaStartTime = null;
  let mouseMovements = [];

  // Track mouse movement
  document.addEventListener("mousemove", (e) => {
    const time = Date.now();
    mouseMovements.push({
      x: e.clientX,
      y: e.clientY,
      t: time
    });
  });

  // Get query parameter returnUrl
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  const returnUrl = getQueryParam('returnUrl') || '/';

  // Fetch CAPTCHA question from PHP backend
  fetch("http://localhost/captcha-extension/get-captcha.php")
    .then(res => res.json())
    .then(data => {
      currentCaptchaId = data.id;
      document.getElementById("captchaQuestion").innerText = data.question;
      // Start the timer
      captchaStartTime = Date.now();
    });

  function checkCaptcha() {
    const answer = document.getElementById('captchaAnswer').value.trim();
    const messageEl = document.getElementById('message');
    const timeTaken = Date.now() - captchaStartTime; // in milliseconds

    fetch("http://localhost/captcha-extension/validate-captcha.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        captcha_id: currentCaptchaId,
        user_answer: answer,
        time_taken: timeTaken,
        mouse_data: mouseMovements 
      })
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        messageEl.style.color = 'green';
        messageEl.textContent = 'CAPTCHA passed! Redirecting...';
        setTimeout(() => {
          window.location.href = decodeURIComponent(returnUrl);
        }, 1000);
      } else {
        messageEl.style.color = 'red';
        messageEl.textContent = 'Incorrect answer. Please try again.';
      }
    })
    .catch((err) => {
      console.error("Fetch error:", err);
      messageEl.style.color = 'red';
      messageEl.textContent = 'Error validating CAPTCHA. Please try again.';
    });
  }

  document.getElementById('submitBtn').addEventListener('click', () => {
    checkCaptcha();
  });

  document.getElementById('captchaAnswer').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      checkCaptcha();
    }
  });
});
