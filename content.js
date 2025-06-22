(() => {
  const currentPage = window.location.pathname;

  const isCaptchaPage =
    currentPage.includes("captcha-question.html") ||
    currentPage.includes("captcha-puzzle.html");

  // 🔒 Block access if CAPTCHA required and not passed, unless already on CAPTCHA page
  if (!isCaptchaPage &&
      sessionStorage.getItem("captchaRequired") === "true" &&
      sessionStorage.getItem("captchaPassed") !== "true") {
    
    const returnUrl = encodeURIComponent(window.location.href);
    const pages = ["captcha-question.html", "captcha-puzzle.html"];
    const selectedPage = pages[Math.floor(Math.random() * pages.length)];

    history.replaceState({}, "", window.location.href); // clean history
    window.location.replace(`${selectedPage}?returnUrl=${returnUrl}`);
    return; // stop script execution
  }

  // === Behavior Tracking ===
  let mousePositions = [];
  let keyPressTimes = [];
  let scrollRecords = [];
  let lastKeyTime = 0;
  let typingStartTime = 0;
  let totalTypedChars = 0;

  const MAX_LINEARITY = 0.95;
  const MIN_TYPING_INTERVAL = 50;
  const MAX_TYPING_INTERVAL = 1000;
  const MAX_SCROLL_SPEED = 2.0;

  function calculateLinearity(points) {
    if (points.length < 3) return 0;
    const start = points[0];
    const end = points[points.length - 1];
    let pathLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      pathLength += Math.sqrt(dx * dx + dy * dy);
    }
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const directDist = Math.sqrt(dx * dx + dy * dy);
    return directDist / pathLength;
  }

  function analyzeTyping() {
    if (keyPressTimes.length < 5) return false;
    let irregularCount = 0;
    for (let i = 1; i < keyPressTimes.length; i++) {
      const diff = Math.abs(keyPressTimes[i] - keyPressTimes[i - 1]);
      if (diff > 500) irregularCount++;
    }
    const irregularRatio = irregularCount / (keyPressTimes.length - 1);
    const avgInterval = keyPressTimes.reduce((a, b) => a + b, 0) / keyPressTimes.length;
    return avgInterval < MIN_TYPING_INTERVAL || irregularRatio > 0.5 || avgInterval > MAX_TYPING_INTERVAL;
  }

  function analyzeScrolling() {
    if (scrollRecords.length < 3) return false;
    let totalScroll = 0;
    let totalTime = 0;
    for (let i = 1; i < scrollRecords.length; i++) {
      totalScroll += Math.abs(scrollRecords[i].y - scrollRecords[i - 1].y);
      totalTime += scrollRecords[i].time - scrollRecords[i - 1].time;
    }
    const speed = totalTime > 0 ? totalScroll / totalTime : 0;
    return speed > MAX_SCROLL_SPEED;
  }

  function checkSuspicious() {
    const linearity = calculateLinearity(mousePositions);
    const suspiciousMouse = linearity > MAX_LINEARITY;
    const suspiciousTyping = analyzeTyping();
    const suspiciousScroll = analyzeScrolling();

    console.log("[Detection] Linearity:", linearity.toFixed(3),
                "| Typing:", suspiciousTyping,
                "| Scroll:", suspiciousScroll);

    return suspiciousMouse || suspiciousTyping || suspiciousScroll;
  }

  function triggerCaptcha() {
  if (sessionStorage.getItem("captchaTriggered") === "true") return;

  sessionStorage.setItem("captchaTriggered", "true");
  sessionStorage.setItem("captchaRequired", "true");
  sessionStorage.removeItem("captchaPassed");

  const returnUrl = encodeURIComponent(window.location.href);
  const pages = ["captcha-question.html", "captcha-puzzle.html"];
  const selectedPage = pages[Math.floor(Math.random() * pages.length)];

  history.replaceState({}, "", window.location.href);
  window.location.replace(`${selectedPage}?returnUrl=${returnUrl}`);
}

  // === Event Listeners ===

  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    mousePositions.push({ x: e.clientX, y: e.clientY, time: now });
    if (mousePositions.length > 100) mousePositions.shift();
  });

  document.addEventListener("keydown", (e) => {
    const now = Date.now();
    if (typingStartTime === 0) typingStartTime = now;
    totalTypedChars++;
    if (lastKeyTime !== 0) {
      keyPressTimes.push(now - lastKeyTime);
      if (keyPressTimes.length > 50) keyPressTimes.shift();
    }
    lastKeyTime = now;

    const elapsedMin = (now - typingStartTime) / 60000;
    const cpm = Math.round(totalTypedChars / elapsedMin);
    const display = document.getElementById("typingSpeedDisplay");
    if (display) display.textContent = `Typing Speed: ${cpm} CPM`;
  });

  document.addEventListener("scroll", () => {
    const now = Date.now();
    const currentY = window.scrollY;
    scrollRecords.push({ y: currentY, time: now });
    if (scrollRecords.length > 50) scrollRecords.shift();
  });

  setInterval(() => {
    if (checkSuspicious()) {
      triggerCaptcha();
      mousePositions = [];
      keyPressTimes = [];
      scrollRecords = [];
      typingStartTime = 0;
      totalTypedChars = 0;
    }
  }, 5000);
})();
