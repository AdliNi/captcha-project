// File: captcha-puzzle.js

function waitForPuzzleModal() {
  const container = document.getElementById("puzzle-container");
  const verifyBtn = document.getElementById("verify-btn");

  if (!container || !verifyBtn) {
    return setTimeout(waitForPuzzleModal, 100); // Retry until DOM is ready
  }

  // === Main Logic Starts Here ===
  let captchaToken = null;
  let startTime = Date.now();
  let mouseMovements = [];
  let failCount = 0;
  const maxFails = 3;

  const messageBox = document.createElement("div");
  messageBox.id = "puzzleMessage";
  messageBox.style.marginTop = "10px";
  messageBox.style.color = "red";
  container.after(messageBox);

  document.addEventListener("mousemove", (e) => {
    mouseMovements.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    if (mouseMovements.length > 300) mouseMovements.shift();
  });

  // Fetch puzzle data from the server
  async function getPuzzleDataFromDB() {
    try {
      const response = await fetch("https://captcha-ex.rf.gd/get-puzzle.php");
      const data = await response.json();

      if (data.type !== "puzzle") return;

      captchaToken = data.token;
      startTime = Date.now();
      return data.pieces;
    } catch (err) {
      messageBox.textContent = "Failed to load puzzle.";
      console.error("Puzzle fetch error:", err);
    }
  }

  // Shuffle function to randomize puzzle pieces
  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  // Load puzzle pieces and set up drag-and-drop functionality
  async function loadPuzzle() {
    const pieces = await getPuzzleDataFromDB();
    if (!pieces) return;

    container.innerHTML = "";
    const shuffled = shuffle([...pieces]);

    shuffled.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src;
      img.draggable = true;
      img.dataset.index = i;

      img.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", img.dataset.index);
      });

      img.addEventListener("dragover", (e) => e.preventDefault());

      img.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromIndex = e.dataTransfer.getData("text/plain");
        const toIndex = img.dataset.index;
        const fromImg = container.children[fromIndex];
        const toImg = container.children[toIndex];

        const fromNext = fromImg.nextSibling;
        const toNext = toImg.nextSibling;

        if (fromNext === toImg) {
          container.insertBefore(toImg, fromImg);
        } else if (toNext === fromImg) {
          container.insertBefore(fromImg, toImg);
        } else {
          container.insertBefore(fromImg, toNext);
          container.insertBefore(toImg, fromNext);
        }

        Array.from(container.children).forEach((child, idx) => {
          child.dataset.index = idx;
        });
      });

      container.appendChild(img);
    });
  }

  // Handle verification of the puzzle
  async function handleVerify() {
    const imgs = [...container.children];
    const order = imgs.map((img) => img.src.split("/").pop());
    const timeTaken = Date.now() - startTime;

    try {
      const response = await fetch(
        "https://captcha-ex.rf.gd/validate-puzzle.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: captchaToken,
            order: order.map((piece) => `puzzle/${piece}`),
            time_taken: timeTaken,
            mouse_path: mouseMovements,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        sessionStorage.removeItem("captchaInProgress");
        sessionStorage.removeItem("captchaRequired");

        console.log("[SessionStorage] Flags reset.");
        console.log(
          " - captchaInProgress:",
          sessionStorage.getItem("captchaInProgress")
        );
        console.log(
          " - captchaRequired:",
          sessionStorage.getItem("captchaRequired")
        );

        alert("Puzzle verified!");
        document.getElementById("captchaModalOverlay")?.remove();
        document.body.style.overflow = "auto";
      } else {
        failCount++;
        messageBox.style.color = "red";
        messageBox.textContent = `${
          result.message || "Incorrect puzzle."
        } (${failCount}/${maxFails})`;

        if (failCount >= maxFails) {
          lockUserOut();
        }
      }
    } catch (err) {
      console.error("Validation error:", err);
      messageBox.style.color = "red";
      messageBox.textContent = "Error validating CAPTCHA. Try again.";
    }
  }

  // Lock user out after too many failed attempts (3)
  function lockUserOut() {
    messageBox.style.color = "darkred";
    messageBox.textContent = "Too many failed attempts. You are locked out.";

    verifyBtn.disabled = true;
    verifyBtn.style.backgroundColor = "#d9534f"; // 🔴 Red background
    verifyBtn.style.borderColor = "#d43f3a"; // Slightly darker red border
    verifyBtn.style.color = "#ffffff"; // White text for contrast
    verifyBtn.style.cursor = "not-allowed"; // Visual cue that it's disabled

    setTimeout(() => {
      document.getElementById("captchaModalOverlay")?.remove();
      document.body.style.overflow = "auto";
      sessionStorage.removeItem("captchaInProgress");
    }, 300000); // 5 minutes
  }

  verifyBtn.addEventListener("click", handleVerify);

  // Load the puzzle pieces when the modal is ready
  loadPuzzle();
}

//Start checking for the modal and run when ready
waitForPuzzleModal();
