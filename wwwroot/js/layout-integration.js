(() => {
    "use strict";

    // These handlers belong to the host layout in the source project.
    document.addEventListener("click", (event) => {
        const link = event.target.closest?.("a");
        if (!link || event.defaultPrevented || event.button !== 0
            || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

        if (link.getAttribute("href") === "#mobil-uygulama" && !link.hasAttribute("data-bs-toggle")) {
            const modal = document.querySelector("[data-mobil-uygulama-modal]");
            if (!modal || !window.bootstrap?.Modal) return;
            event.preventDefault();

            const menuToggle = document.querySelector('[data-mobile-menu-toggle][aria-expanded="true"]');
            menuToggle?.click();
            window.bootstrap.Modal.getOrCreateInstance(modal).show(link);
        } else if (link.dataset.popup === "true") {
            event.preventDefault();
            const popup = window.open(link.href, "ykb-popup", "width=1100,height=760,resizable=yes,scrollbars=yes");
            if (popup) popup.opener = null;
        }
    });
})();
