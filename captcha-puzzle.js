document.addEventListener("DOMContentLoaded", () => {
  let captchaToken = null;
  let startTime = Date.now();
  let mouseMovements = [];

  document.addEventListener("mousemove", (e) => {
    mouseMovements.push({ 
      x: e.clientX, 
      y: e.clientY, 
      t: Date.now() 
    });
    if (mouseMovements.length > 300) mouseMovements.shift();
  });

  async function getPuzzleDataFromDB() {
    const response = await fetch("get-puzzle.php");
    const data = await response.json();

    if (data.type !== "puzzle") {
      return;
    }

    captchaToken = data.token;
    startTime = Date.now();
    return data.pieces;
  }

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  async function loadPuzzle() {
    const pieces = await getPuzzleDataFromDB();
    if (!pieces) return;

    const container = document.getElementById("puzzle-container");
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

  document.getElementById("verify-btn").addEventListener("click", async () => {
    const imgs = [...document.getElementById("puzzle-container").children];
    const order = imgs.map(img => img.src.split('/').pop());
    const timeTaken = Date.now() - startTime;

    const response = await fetch("validate-puzzle.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: captchaToken,
        order: order.map(piece => `puzzle/${piece}`),
        time_taken: timeTaken,
        mouse_path: mouseMovements
      })
    });

    const result = await response.json();
    if (result.success) {
      sessionStorage.removeItem("captchaInProgress");
      sessionStorage.removeItem("captchaRequired");

      const returnUrl = new URLSearchParams(window.location.search).get("returnUrl");

      alert("Verified! Redirecting...");
      if (returnUrl) {
        window.location.href = decodeURIComponent(returnUrl);
      } else {
        window.history.back();
      }
    } else {
      alert(result.message);
    }
  });

  loadPuzzle();
});
