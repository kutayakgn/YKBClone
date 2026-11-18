(() => {
    "use strict";

    const root = document.getElementById("cookieConsent");
    if (!root) return;

    const banner = document.getElementById("cookieBanner");
    const modal = document.getElementById("cookieModal");
    const icon = document.getElementById("cookieIcon");
    const form = document.getElementById("cookieConsentToken");
    const switches = Array.from(modal.querySelectorAll("input[data-cookie-field]"));
    const controls = Array.from(root.querySelectorAll("button[data-cookie-action]"));
    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("ykb-cookie-consent") : null;
    const choices = switches.map(input => input.checked);
    const hasChoice = root.dataset.hasChoice === "true";
    let previousFocus;
    let saving = false;
    let lastRequest;

    function showRestingState() {
        if (modal.hidden) {
            banner.classList.toggle("is-visible", !hasChoice);
            icon.hidden = !hasChoice;
        }
    }

    function clearErrors() {
        root.querySelectorAll(".cookie-save-error").forEach(error => {
            error.hidden = true;
            error.textContent = "";
        });
    }

    function openModal(trigger) {
        previousFocus = trigger;
        clearErrors();
        switches.forEach((input, index) => { input.checked = choices[index]; });
        banner.classList.remove("is-visible");
        icon.hidden = true;
        modal.hidden = false;
        modal.focus({ preventScroll: true });
    }

    function closeModal() {
        modal.hidden = true;
        showRestingState();
        if (previousFocus && (!hasChoice || previousFocus === icon)) {
            previousFocus.focus({ preventScroll: true });
        } else if (hasChoice) {
            icon.focus({ preventScroll: true });
        }
    }

    function disableAnalytics() {
        const id = document.getElementById("ykbCookieAnalytics")?.dataset.measurementId;
        if (id) window["ga-disable-" + id] = true;
    }

    async function save(action) {
        if (saving) return;

        clearErrors();
        const submitted = switches.map(input => action === "custom" ? input.checked : action === "accept");
        saving = true;
        controls.forEach(button => { button.disabled = true; });
        switches.forEach(input => { input.disabled = true; });
        let errorMessage = root.dataset.saveError;
        let closeAfterSave = false;

        try {
            const formData = new FormData(form);
            formData.set("Action", action);
            if (action === "custom") {
                switches.forEach((input, index) => formData.set(input.dataset.cookieField, String(submitted[index])));
            }
            const signature = JSON.stringify(Array.from(formData.entries()));
            if (lastRequest?.signature !== signature) {
                lastRequest = { signature, id: crypto.randomUUID() };
            }
            formData.set("EventId", lastRequest.id);

            const response = await fetch(form.action, {
                method: "POST",
                credentials: "same-origin",
                body: formData,
                redirect: "error"
            });
            if (response.status === 409) errorMessage = root.dataset.policyChanged;
            if (!response.ok) throw new Error("Unable to save cookie preferences");

            const result = await response.json();
            if (typeof result.changed !== "boolean" || typeof result.analytics !== "boolean") {
                throw new Error("Unexpected cookie preference response");
            }

            if (!result.analytics) disableAnalytics();
            if (result.changed || !hasChoice || submitted.some((value, index) => value !== choices[index])) {
                if (result.changed) channel?.postMessage({ analytics: result.analytics });
                window.location.reload();
                return;
            }
            lastRequest = undefined;
            closeAfterSave = true;
        } catch {
            const error = (modal.hidden ? banner : modal).querySelector(".cookie-save-error");
            error.textContent = errorMessage;
            error.hidden = false;
        } finally {
            controls.forEach(button => { button.disabled = false; });
            switches.forEach(input => { input.disabled = false; });
            saving = false;
            if (closeAfterSave) closeModal();
        }
    }

    root.addEventListener("click", event => {
        const button = event.target.closest("button[data-cookie-action]");
        if (button && !saving) {
            const action = button.dataset.cookieAction;
            if (action === "edit") openModal(button);
            else if (action === "close") closeModal();
            else void save(action);
        } else if (event.target === modal && !saving) {
            closeModal();
        }
    });

    modal.addEventListener("keydown", event => {
        if (event.key === "Escape" && !saving) {
            event.preventDefault();
            closeModal();
        }
        if (event.key !== "Tab") return;

        const focusable = modal.querySelectorAll("a[href], button:not(:disabled), input:not(:disabled)");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first) {
            event.preventDefault();
        } else if (!modal.contains(document.activeElement) || document.activeElement === modal ||
            document.activeElement === (event.shiftKey ? first : last)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        }
    });

    channel?.addEventListener("message", event => {
        if (event.data?.analytics === false) {
            disableAnalytics();
        }
        if (typeof event.data?.analytics === "boolean") {
            // Keep this page's forms intact. Refresh stale preferences before opening the editor.
            root.addEventListener("click", refreshBeforeEditing, { capture: true });
        }
    });

    function refreshBeforeEditing(event) {
        if (event.target.closest('[data-cookie-action="edit"]')) {
            event.stopImmediatePropagation();
            window.location.reload();
        }
    }

    window.addEventListener("pagehide", event => {
        if (event.persisted) disableAnalytics();
    });

    window.addEventListener("pageshow", event => {
        if (event.persisted) window.location.reload();
    });

    showRestingState();
})();
