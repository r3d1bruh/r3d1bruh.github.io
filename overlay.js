// overlay.js
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("overlay");
  const page = document.getElementById("page-content");

  if (!overlay || !page) return;

  document.addEventListener(
    "click",
    () => {
      // Add fade-out class
      overlay.classList.add("fade-out");

      // Wait for transition to finish, then hide overlay and show page
      setTimeout(() => {
        overlay.style.display = "none";
        page.style.display = "block";
      }, 1000); // matches CSS transition duration
    },
    { once: true }
  );
});
