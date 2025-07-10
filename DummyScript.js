document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded");

  const display = document.getElementById("typingSpeedDisplay");
  let typingStartTime = 0;
  let lastKeyTime = 0;
  let totalTypedChars = 0;
  let keyPressTimes = [];

  const textarea = document.querySelector("textarea");
  if (!textarea || !display) {
    console.error("Textarea or display element not found.");
    return;
  }

  textarea.addEventListener("keydown", (e) => {
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
    display.textContent = `Typing Speed: ${cpm} Characters Per Minute`;
  });
});
