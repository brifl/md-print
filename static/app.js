document.addEventListener("DOMContentLoaded", () => {
  const printButton = document.querySelector(".js-print");
  if (!printButton) {
    return;
  }

  printButton.addEventListener("click", () => {
    window.print();
  });
});
