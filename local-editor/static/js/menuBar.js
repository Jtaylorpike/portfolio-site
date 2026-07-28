// Classic Macintosh-style application menu behavior.
// Menus open on pointer-down or keyboard activation, switch while open when
// another title is hovered, and close immediately after a real command runs.

function getMenuItems(menu) {
  return [...menu.querySelectorAll('[role="menuitem"]:not([disabled])')];
}

export function setupMacMenuBar() {
  const menuBar = document.querySelector("[data-mac-menu-bar]");
  if (!menuBar) return;

  const triggers = [...menuBar.querySelectorAll(".mac-menu-trigger")];
  let openTrigger = null;

  function getMenu(trigger) {
    const menuId = trigger.getAttribute("aria-controls");
    return menuId ? document.getElementById(menuId) : null;
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (!openTrigger) return;

    const trigger = openTrigger;
    const menu = getMenu(trigger);
    trigger.setAttribute("aria-expanded", "false");
    trigger.classList.remove("is-open");
    if (menu) menu.hidden = true;
    openTrigger = null;

    if (restoreFocus) trigger.focus();
  }

  function openMenu(trigger, focusPosition = null) {
    if (openTrigger && openTrigger !== trigger) closeMenu();

    const menu = getMenu(trigger);
    if (!menu) return;

    openTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    trigger.classList.add("is-open");
    menu.hidden = false;

    if (focusPosition !== null) {
      const items = getMenuItems(menu);
      const item = focusPosition === "last" ? items.at(-1) : items[0];
      item?.focus();
    }
  }

  function moveMenuFocus(menu, direction) {
    const items = getMenuItems(menu);
    if (!items.length) return;

    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + direction + items.length) % items.length;
    items[nextIndex].focus();
  }

  function switchMenu(direction) {
    if (!openTrigger) return;

    const currentIndex = triggers.indexOf(openTrigger);
    const nextTrigger = triggers[(currentIndex + direction + triggers.length) % triggers.length];
    openMenu(nextTrigger, "first");
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (openTrigger === trigger) {
        closeMenu({ restoreFocus: true });
      } else {
        openMenu(trigger);
      }
    });

    trigger.addEventListener("pointerenter", () => {
      if (openTrigger && openTrigger !== trigger) openMenu(trigger);
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMenu(trigger, "first");
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        openMenu(trigger, "last");
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
      }
    });
  });

  menuBar.querySelectorAll(".mac-menu-dropdown").forEach((menu) => {
    menu.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveMenuFocus(menu, 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveMenuFocus(menu, -1);
      } else if (event.key === "Home") {
        event.preventDefault();
        getMenuItems(menu)[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        getMenuItems(menu).at(-1)?.focus();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        switchMenu(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        switchMenu(-1);
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
      } else if (event.key === "Tab") {
        closeMenu();
      }
    });

    menu.addEventListener("click", (event) => {
      const item = event.target.closest('[role="menuitem"]');
      if (!item) return;

      const targetSelector = item.dataset.menuClickTarget;
      closeMenu();

      if (targetSelector) {
        document.querySelector(targetSelector)?.click();
      }
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (openTrigger && !menuBar.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      closeMenu();
      document.querySelector("#saveButton")?.click();
    }
  });

  window.addEventListener("blur", () => closeMenu());
}
