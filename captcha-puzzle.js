
async function getPuzzleDataFromDB() {
  const response = await fetch("get-captcha.php");
  const data = await response.json();

  if (data.type !== "puzzle") {
    alert("Error: Expected a puzzle CAPTCHA but got something else.");
    window.location.href = "captcha-question.html"; // fallback
    return null;
  }

  return data.pieces;
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

async function loadPuzzle() {
  const pieces = await getPuzzleDataFromDB();
  if (!pieces) return; // exit if no puzzle pieces

  const container = document.getElementById("puzzle-container");
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

      // Update index data
      Array.from(container.children).forEach((child, idx) => {
        child.dataset.index = idx;
      });
    });

    container.appendChild(img);
  });
}

document.getElementById("verify-btn").addEventListener("click", () => {
  const imgs = [...document.getElementById("puzzle-container").children];
  const correct = imgs.every((img, i) => img.src.includes(`piece${i + 1}`));
  alert(correct ? "Verified as human!" : "Try again.");
});

loadPuzzle();

