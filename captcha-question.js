document.addEventListener("DOMContentLoaded", () => {
  let currentCaptchaId = null;
  let captchaToken = null;
  let captchaStartTime = null;
  let mouseMovements = [];

  // Track mouse movement
  document.addEventListener("mousemove", (e) => {
    mouseMovements.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now()
    });
  });

  const returnUrl = new URLSearchParams(window.location.search).get("returnUrl");

  // Display question if already stored
  const cachedCaptcha = sessionStorage.getItem("captchaQuestion");
  if (cachedCaptcha) {
    const data = JSON.parse(cachedCaptcha);
    displayCaptcha(data);
  } else {
    fetch("http://localhost/captcha-extension/get-captcha.php")
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error("CAPTCHA fetch error:", data.message);
          return;
        }

        if (data.type === "puzzle") {
          // Redirect if wrong type
          window.location.href = "captcha-puzzle.html?returnUrl=" + encodeURIComponent(returnUrl);
        } else if (!data.question || !data.id || !data.token) {
          console.error("Incomplete CAPTCHA data", data);
        } else {
          sessionStorage.setItem("captchaQuestion", JSON.stringify(data));
          displayCaptcha(data);
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        document.getElementById("message").textContent = "⚠️ Failed to load CAPTCHA. Try refreshing.";
      });
  }

  function displayCaptcha(data) {
    document.getElementById("captchaQuestion").innerText = data.question;
    currentCaptchaId = data.id;
    captchaToken = data.token;
    captchaStartTime = Date.now();
  }

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
        mouse_data: mouseMovements,
        token: captchaToken
      })
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        messageEl.style.color = 'green';
        messageEl.textContent = '✅ CAPTCHA passed! Redirecting...';
        sessionStorage.setItem("captchaPassed", "true");
        sessionStorage.removeItem("captchaRequired");
        sessionStorage.removeItem("captchaQuestion"); // Clear used CAPTCHA
        
        if (returnUrl) {
        window.location.href = decodeURIComponent(returnUrl);
        } else {
        window.history.back(); // fallback to previous page
        }

      } else {
        messageEl.style.color = 'red';
        messageEl.textContent = '❌ ' + result.message;
      }
      
    })
    .catch((err) => {
      console.error("Validation error:", err);
      messageEl.style.color = 'red';
      messageEl.textContent = '⚠️ Error validating CAPTCHA. Please try again.';
    });
  }

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
