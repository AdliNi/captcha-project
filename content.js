(() => {
  const currentPage = window.location.pathname;

  // Check if the current page is a CAPTCHA page
  const isCaptchaPage =
    currentPage.includes("captcha-text.html") ||
    currentPage.includes("captcha-puzzle.html");

  // === Reset CAPTCHA flags on full page reload ===
  window.addEventListener("load", () => {
    sessionStorage.removeItem("captchaRequired");
    sessionStorage.removeItem("captchaInProgress");

    console.log("[SessionStorage] Flags reset on page load.");
    console.log(
      " - captchaInProgress:",
      sessionStorage.getItem("captchaInProgress")
    );
    console.log(
      " - captchaRequired:",
      sessionStorage.getItem("captchaRequired")
    );
  });

  // benchmark thresholds
  const MAX_SUSPICIOUS_THRESHOLD = 3; // Trigger CAPTCHA after 3 consecutive suspicious checks
  const MIN_TYPING_INTERVAL = 35; //ms Minimum interval between keystrokes for human typing
  const MIN_TYPING_DEVIATION = 50; //ms Minimum deviation for constant typing speed detection
  const MAX_SCROLL_SPEED = 8000.0; //px/s
  const MIN_SCROLLING_DEVIATION = 100; //px/s Minimum deviation for constant scrolling speed detection
  const MOUSE_SAMPLE_SIZE = 20; // number of points to analyze

  // === Behavior logging ===
  let suspiciousCount = 0;
  let mousePositions = [];
  let keyPressTimes = [];
  let scrollRecords = [];
  let lastKeyTime = 0;
  let typingStartTime = 0;
  let totalTypedChars = 0;

  // === Enhanced Mouse Tracking Data ===
  let mouseTrackingData = {
    movementIntervals: [],
    directionChanges: [],
    accelerationPatterns: [],
    clicks: [],
    clickTimings: [],
    hoverEvents: [],
    pauseDurations: [],
    microMovements: 0,
    totalMovements: 0,
  };

  let isMouseMoving = false;
  let mousePauseStartTime = null;
  let mousePauseTimer = null;

  // === Mouse Movement Analysis ===
  function checkMouseMovementBehavior() {
    if (mousePositions.length < 5) return false;

    const timingIssues = analyzeTimingPatterns();
    const movementIssues = analyzeMovementPatterns();
    const clickIssues = analyzeClickPatterns();
    const microMovementIssues = analyzeMicroMovements();

    const suspiciousFlags = [
      timingIssues,
      movementIssues,
      clickIssues,
      microMovementIssues,
    ].filter(Boolean).length;

    const isSuspicious = suspiciousFlags >= 2;

    if (isSuspicious) {
      console.log("[Mouse Analysis] Bot-like behavior detected");
      console.log("  - Timing issues:", timingIssues);
      console.log("  - Movement issues:", movementIssues);
      console.log("  - Click issues:", clickIssues);
      console.log("  - Micro-movement issues:", microMovementIssues);
    }

    return isSuspicious;
  }

  // helper function to analyze mouse timing patterns
  function analyzeTimingPatterns() {
    const intervals = mouseTrackingData.movementIntervals;
    if (intervals.length < 10) return false;

    // Calculate coefficient of variation (CV) for intervals
    const mean =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      intervals.length;
    const cv = Math.sqrt(variance) / mean;

    return cv < 0.15; // Too consistent timing
  }

  // helper function to analyze mouse movement patterns
  function analyzeMovementPatterns() {
    const directions = mouseTrackingData.directionChanges;
    if (directions.length < 5) return false;

    const avgDirectionChange =
      directions.reduce((sum, val) => sum + val, 0) / directions.length;
    return avgDirectionChange < 0.1; // Too straight
  }

  // helper function to analyze click patterns
  function analyzeClickPatterns() {
    const clickTimings = mouseTrackingData.clickTimings;
    if (clickTimings.length < 3) return false;

    // Calculate coefficient of variation (CV) for click timings
    const mean =
      clickTimings.reduce((sum, val) => sum + val, 0) / clickTimings.length;
    const variance =
      clickTimings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      clickTimings.length;
    const cv = Math.sqrt(variance) / mean;

    const minClickInterval = Math.min(...clickTimings);

    return cv < 0.2 || minClickInterval < 50;
  }

  // helper function to analyze micro movements
  function analyzeMicroMovements() {
    if (mouseTrackingData.totalMovements < 20) return false;

    const microMovementRatio =
      mouseTrackingData.microMovements / mouseTrackingData.totalMovements;
    return microMovementRatio < 0.02 || microMovementRatio > 0.25;
  }

  // === Typing Analysis ===
  // Calculate intervals between consecutive keypresses
  function analyzeTyping() {
    if (keyPressTimes.length < 5) return false;

    const intervals = [];

    // Calculate intervals between consecutive keypresses
    for (let i = 1; i < keyPressTimes.length; i++) {
      const diff = Math.abs(keyPressTimes[i] - keyPressTimes[i - 1]);
      intervals.push(diff); // Store the interval
    }

    // Calculate the average interval between keypresses
    const avgInterval =
      keyPressTimes.reduce((a, b) => a + b, 0) / keyPressTimes.length;

    // Calculate the standard deviation of the intervals
    const stdDev = calculateStandardDeviation(intervals);

    console.log(
      "[Typing Analysis] Avg Interval:",
      avgInterval,
      "| Typing Deviation:",
      stdDev
    );

    return (
      avgInterval < MIN_TYPING_INTERVAL || // Typing too fast (human limit)
      stdDev < MIN_TYPING_DEVIATION // Detect uniform typing speed (low variation between keystrokes)
    );
  }

  // Helper function to calculate the standard deviation of intervals
  function calculateStandardDeviation(arr) {
    const mean = arr.reduce((a, b) => a + b) / arr.length;
    const squaredDiffs = arr.map((val) => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b) / arr.length;
    return Math.sqrt(avgSquaredDiff);
  }

  // === Scrolling Analysis ===
  function analyzeScrolling() {
    if (scrollRecords.length < 3) return false;

    let totalScroll = 0;
    let totalTime = 0;
    let scrollSpeeds = [];

    // Calculate the scroll speed and store the intervals
    for (let i = 1; i < scrollRecords.length; i++) {
      const scrollDistance = Math.abs(
        scrollRecords[i].y - scrollRecords[i - 1].y
      );
      const timeInterval = scrollRecords[i].time - scrollRecords[i - 1].time;

      totalScroll += scrollDistance;
      totalTime += timeInterval;

      if (timeInterval > 0) {
        scrollSpeeds.push(scrollDistance / timeInterval); // Store speed for std deviation calculation
      }
    }

    speed = totalTime > 0 ? totalScroll / totalTime : 0;

    // Calculate the standard deviation of the scroll speeds
    const meanSpeed =
      scrollSpeeds.reduce((sum, speed) => sum + speed, 0) / scrollSpeeds.length;
    const squaredDiffs = scrollSpeeds.map((speed) =>
      Math.pow(speed - meanSpeed, 2)
    );
    const variance =
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(variance) * 1000; // Convert to px/s

    speed = speed * 1000; // Convert to px/s

    // Detect uniform scrolling speed based on standard deviation
    const isUniformScrolling = stdDev < MIN_SCROLLING_DEVIATION; // Adjust threshold for uniformity detection as needed

    console.log("scrolling speed:", speed, "| Scroll Deviation:", stdDev);

    return speed > MAX_SCROLL_SPEED || isUniformScrolling; // Consider uniform scrolling as suspicious
  }

  // Check for suspicious behavior based on mouse movement, typing, and scrolling
  function checkSuspicious() {
    const suspiciousMouse = checkMouseMovementBehavior();
    const suspiciousTyping = analyzeTyping();
    const suspiciousScroll = analyzeScrolling();

    console.log(
      "[Detection] Mouse Suspicious:",
      suspiciousMouse,
      "| Typing Suspicious:",
      suspiciousTyping,
      "| Scroll Suspicious:",
      suspiciousScroll
    );

    return suspiciousMouse || suspiciousTyping || suspiciousScroll;
  }

  // Trigger CAPTCHA if suspicious behavior is detected
  function triggerCaptcha() {
    if (sessionStorage.getItem("captchaInProgress") === "true") return;

    sessionStorage.setItem("captchaInProgress", "true");
    sessionStorage.setItem("captchaRequired", "true");

    console.log("[SessionStorage] CAPTCHA triggered");
    console.log(
      " - captchaInProgress:",
      sessionStorage.getItem("captchaInProgress")
    );
    console.log(
      " - captchaRequired:",
      sessionStorage.getItem("captchaRequired")
    );

    fetch("https://captcha-ex.rf.gd/get-captcha.php")
      .then((res) => res.json())
      .then((data) => {
        if (!data.type || !data.token) return;

        window.captchaToken = data.token;

        const modalUrl = chrome.runtime.getURL(
          data.type === "puzzle" ? "captcha-puzzle.html" : "captcha-text.html"
        );

        fetch(modalUrl)
          .then((res) => res.text())
          .then((html) => {
            const modal = document.createElement("div");
            modal.id = "captcha-modal"; // Add this line
            modal.innerHTML = html;
            document.body.appendChild(modal);

            const script = document.createElement("script");
            script.src = chrome.runtime.getURL(
              data.type === "puzzle" ? "captcha-puzzle.js" : "captcha-text.js"
            );
            document.body.appendChild(script);
          });
      });
  }

  // === Event Listeners ===
  document.addEventListener("mousemove", (e) => {
    const now = Date.now();

    // Store mouse position with timestamp
    mousePositions.push({
      x: e.clientX,
      y: e.clientY,
      time: now,
    });

    // Enhanced tracking data collection
    mouseTrackingData.totalMovements++;

    if (mousePositions.length > 1) {
      const currentPos = mousePositions[mousePositions.length - 1];
      const lastPos = mousePositions[mousePositions.length - 2];

      // Track movement intervals
      const interval = now - lastPos.time;
      mouseTrackingData.movementIntervals.push(interval);

      // Track micro movements
      const distance = calculateDistance(lastPos, currentPos);
      if (distance < 3) {
        mouseTrackingData.microMovements++;
      }

      // Track direction changes
      if (mousePositions.length >= 3) {
        const directionChange = calculateDirectionChange();
        mouseTrackingData.directionChanges.push(directionChange);
      }

      // Track acceleration
      if (mousePositions.length >= 3) {
        const acceleration = calculateAcceleration();
        mouseTrackingData.accelerationPatterns.push(acceleration);
      }

      // Handle pause detection
      if (!isMouseMoving) {
        if (mousePauseStartTime) {
          const pauseDuration = now - mousePauseStartTime;
          mouseTrackingData.pauseDurations.push(pauseDuration);
          mousePauseStartTime = null;
        }
        isMouseMoving = true;
      }
    }

    // Keep only recent positions for analysis
    if (mousePositions.length > MOUSE_SAMPLE_SIZE) {
      mousePositions.shift();
    }

    // Keep tracking data arrays manageable
    if (mouseTrackingData.movementIntervals.length > 100) {
      mouseTrackingData.movementIntervals.shift();
    }
    if (mouseTrackingData.directionChanges.length > 100) {
      mouseTrackingData.directionChanges.shift();
    }
    if (mouseTrackingData.accelerationPatterns.length > 100) {
      mouseTrackingData.accelerationPatterns.shift();
    }

    lastMouseEventTime = now;
    lastMousePosition = { x: e.clientX, y: e.clientY };

    // Schedule mouse movement pause detection
    clearTimeout(mousePauseTimer);
    mousePauseTimer = setTimeout(() => {
      if (isMouseMoving) {
        isMouseMoving = false;
        mousePauseStartTime = performance.now();
      }
    }, 100);
  });

  // Helper functions to calculate distance
  function calculateDistance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Helper function to calculate direction between two points
  function calculateDirection(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.atan2(dy, dx);
  }

  // helper functions for acceleration and direction change calculations
  function calculateAcceleration() {
    if (mousePositions.length < 3) return 0;

    const len = mousePositions.length;
    const p1 = mousePositions[len - 3];
    const p2 = mousePositions[len - 2];
    const p3 = mousePositions[len - 1];

    const v1 = calculateDistance(p1, p2) / (p2.time - p1.time);
    const v2 = calculateDistance(p2, p3) / (p3.time - p2.time);

    return v2 - v1;
  }

  //helper function to calculate mouse direction change
  function calculateDirectionChange() {
    if (mousePositions.length < 3) return 0;

    const len = mousePositions.length;
    const p1 = mousePositions[len - 3];
    const p2 = mousePositions[len - 2];
    const p3 = mousePositions[len - 1];

    const dir1 = calculateDirection(p1, p2);
    const dir2 = calculateDirection(p2, p3);

    let change = Math.abs(dir2 - dir1);
    if (change > Math.PI) change = 2 * Math.PI - change;

    return change;
  }

  document.addEventListener("click", (e) => {
    const now = Date.now();

    // Track click data
    mouseTrackingData.clicks.push({
      x: e.clientX,
      y: e.clientY,
      timestamp: now,
      button: e.button,
    });

    // Track click timings
    if (mouseTrackingData.clicks.length > 1) {
      const lastClick =
        mouseTrackingData.clicks[mouseTrackingData.clicks.length - 2];
      const clickInterval = now - lastClick.timestamp;
      mouseTrackingData.clickTimings.push(clickInterval);
    }

    // Keep click data manageable
    if (mouseTrackingData.clicks.length > 20) {
      mouseTrackingData.clicks.shift();
    }
    if (mouseTrackingData.clickTimings.length > 20) {
      mouseTrackingData.clickTimings.shift();
    }
  });

  document.addEventListener("mouseover", (e) => {
    const now = Date.now();

    // Track hover events
    mouseTrackingData.hoverEvents.push({
      x: e.clientX,
      y: e.clientY,
      timestamp: now,
      target: e.target.tagName,
    });

    // Keep hover data manageable
    if (mouseTrackingData.hoverEvents.length > 30) {
      mouseTrackingData.hoverEvents.shift();
    }
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
  });

  document.addEventListener("scroll", () => {
    const now = Date.now();
    const currentY = window.scrollY;
    scrollRecords.push({ y: currentY, time: now });
    if (scrollRecords.length > 50) scrollRecords.shift();
  });

  // === Continuous Bot Check ===
  if (!isCaptchaPage) {
    setInterval(() => {
      if (checkSuspicious()) {
        suspiciousCount++;
      } else {
        suspiciousCount = 0; // Reset counter if behavior is normal
      }

      if (suspiciousCount >= MAX_SUSPICIOUS_THRESHOLD) {
        triggerCaptcha();
        suspiciousCount = 0; // Reset after triggering CAPTCHA
        mousePositions = [];
        keyPressTimes = [];
        scrollRecords = [];
        typingStartTime = 0;
        totalTypedChars = 0;

        // Reset enhanced tracking data
        mouseTrackingData = {
          movementIntervals: [],
          directionChanges: [],
          accelerationPatterns: [],
          clicks: [],
          clickTimings: [],
          hoverEvents: [],
          pauseDurations: [],
          microMovements: 0,
          totalMovements: 0,
        };
      }
    }, 1000); // Check every second
  }
})();
