document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const menuToggle = document.getElementById("menu-toggle");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  function setModeForViewport() {
    if (window.innerWidth <= 768) {
      body.classList.remove("sidebar-collapsed");
    } else {
      body.classList.remove("sidebar-open");
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.innerWidth <= 768) {
        body.classList.toggle("sidebar-open");
      } else {
        body.classList.toggle("sidebar-collapsed");
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
      body.classList.remove("sidebar-open");
    });
  }

  window.addEventListener("resize", setModeForViewport);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") body.classList.remove("sidebar-open");
  });
  setModeForViewport();
});
