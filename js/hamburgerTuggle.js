function closeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("overlay");

  if (!sidebar || !overlay) return;

  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}


document.addEventListener("DOMContentLoaded", () => {
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("overlay");

menuToggle.addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
});

overlay.addEventListener("click", () => {
  closeSidebar();
});

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

/* 🔥 GUARANTEED CLOSE ON LINK CLICK */
document.addEventListener("click", (e) => {
  if (sidebar.classList.contains("open")) {
    const link = e.target.closest(".sidebar a");
    if (link) {
      closeSidebar();
    }
  }
});
});