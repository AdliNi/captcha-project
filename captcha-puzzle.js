const pieces = [
  "puzzle/piece1.png",
  "puzzle/piece2.png",
  "puzzle/piece3.png",
  "puzzle/piece4.png",
  "puzzle/piece5.png",
  "puzzle/piece6.png",
  "puzzle/piece7.png",
  "puzzle/piece8.png",
  "puzzle/piece9.png"
];

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function loadPuzzle() {
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
      const container = document.getElementById("puzzle-container");
      const fromImg = container.children[fromIndex];
      const toImg = container.children[toIndex];

      // Swap the two images in the DOM
      const fromNextSibling = fromImg.nextSibling;
      const toNextSibling = toImg.nextSibling;

      if (fromNextSibling === toImg) {
        container.insertBefore(toImg, fromImg);
      } else if (toNextSibling === fromImg) {
        container.insertBefore(fromImg, toImg);
      } else {
        container.insertBefore(fromImg, toNextSibling);
        container.insertBefore(toImg, fromNextSibling);
      }

      // Update dataset indices after swap
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
