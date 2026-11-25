(() => {
    "use strict";

    const loader = document.currentScript;
    const config = loader?.dataset;
    function isPublicPath(path) {
        if (typeof path !== "string" || path.length > 250 || /%2f/i.test(path)) return false;
        try {
            const decoded = decodeURIComponent(path);
            return /^\/(?:[\p{L}\p{M}\p{N}_.~-]+\/)*[\p{L}\p{M}\p{N}_.~-]*$/u.test(decoded) &&
                !decoded.split("/").some(segment => segment === "." || segment === "..");
        } catch {
            return false;
        }
    }
    if (!config || window.YkbPartnerTracking || !isPublicPath(config.pagePath)) return;
    const hasDataroid = /^GTM-[A-Z0-9]+$/.test(config.containerId) && !!config.dataroidSdkKey && !!config.dataroidEndpoint;
    const hasGa = /^G-[A-Z0-9]+$/.test(config.gaId);
    if (!hasDataroid && !hasGa) return;

    const layerName = "ykbPartnerLayer";
    const layer = hasDataroid ? (window[layerName] = window[layerName] || []) : null;
    let pending = [];
    let ready = false;
    let stopped = false;

    function emit(event) {
        if (stopped) return;
        if (ready) layer.push(event);
        else if (pending.length < 20) pending.push(event);
    }

    function stop() {
        if (stopped) return;
        stopped = true;
        pending = [];
        if (ready) layer.push({ event: "k13.partner_consent_update" });
    }

    window.YkbPartnerTracking = {
        get analyticsAllowed() { return hasDataroid && !stopped; }
    };
    const buttons = new Map([
        ["home_personal_loan_apply", ["AnasayfaBIK_HemenBasvur_ButtonClick", "Aninda_Basvuru"]],
        ["home_card_apply", ["AnasayfaKK_HemenBasvur_ButtonClick", "Aninda_Basvuru"]],
        ["all_applications", ["TumBasvuruIslemleri_ButtonClick", "Aninda_Basvuru"]],
        ["all_calculators", ["TumHesaplamaAraclari_ButtonClick", ""]],
        ["all_payments", ["TumOdemeler_ButtonClick", "Odeme_Merkezi"]],
        ["electricity", ["OdemeMerkezi_ElektrikFaturasi_ButtonClick", "Odeme_Merkezi"]],
        ["water", ["OdemeMerkezi_SuFaturasi_ButtonClick", "Odeme_Merkezi"]],
        ["natural_gas", ["OdemeMerkezi_DogalgazFaturasi_ButtonClick", "Odeme_Merkezi"]],
        ["mobile_bill", ["OdemeMerkezi_CepTelefonFaturasi_ButtonClick", "Odeme_Merkezi"]],
        ["telecom", ["OdemeMerkezi_TelekomFaturasi_ButtonClick", "Odeme_Merkezi"]],
        ["motor_tax", ["OdemeMerkezi_MtvBorcu_ButtonClick", "Odeme_Merkezi"]],
        ["customer_acquisition", ["Yapi_Kredili_Ol_ButtonClick", "customer"]]
    ]);

    // Window capture runs before the existing button component handles navigation on document.
    window.addEventListener("click", event => {
        if (stopped || event.button !== 0 || !event.target?.closest) return;
        const control = event.target.closest("a[data-partner-click]");
        if (!control || control.matches("[aria-disabled='true'], [role='tab'], [data-bs-toggle], [data-toggle]")) return;
        const mapping = buttons.get(control.dataset.partnerClick);
        if (!mapping) return;
        const link = control.hasAttribute("data-ykb-button") ? window.YkbButtonLinks?.inspect(control) : null;
        const raw = (link?.url ?? control.getAttribute("href") ?? "").trim();
        if (link?.target === "_modal" || !raw || raw.startsWith("#")) return;
        let url;
        try {
            url = new URL(raw, document.baseURI);
        } catch {
            return;
        }
        if (url.protocol !== "https:" || url.origin !== window.location.origin || url.username || url.password ||
            !isPublicPath(url.pathname) || url.pathname.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "")) return;
        const [eventName, section] = mapping;
        const name = (control.textContent.trim() || control.getAttribute("aria-label") || "").replace(/\s+/g, " ").slice(0, 100);
        const targetUrl = url.origin + url.pathname;
        const pageUrl = window.location.origin + config.pagePath;
        const params = { Button_Name: name };
        if (section === "customer") Object.assign(params, { Button_URL: targetUrl, Page_URL: pageUrl });
        if (hasGa && typeof window.gtag === "function" && !window["ga-disable-" + config.gaId]) {
            window.gtag("event", eventName, { ...params, send_to: config.gaId, page_location: pageUrl });
        }
        if (hasDataroid && section) emit({
            event: "k13." + eventName,
            k13_section: section === "customer" ? null : section,
            k13_button_name: name,
            k13_button_url: targetUrl,
            k13_page_url: pageUrl
        });
    }, { capture: true });

    // The existing consent script broadcasts any saved change, even when analytics stays the same.
    if (typeof BroadcastChannel === "function") {
        const channel = new BroadcastChannel("ykb-cookie-consent");
        channel.addEventListener("message", event => {
            if (typeof event.data?.analytics !== "boolean" || stopped) return;
            stop();
            window.location.reload();
        });
    }

    window.addEventListener("pagehide", event => {
        if (event.persisted) stop();
    });

    if (!layer) return;
    layer.push({
        k13_dataroid_sdk_key: config.dataroidSdkKey,
        k13_dataroid_endpoint: config.dataroidEndpoint,
        k13_dataroid_app_name: config.dataroidAppName,
        k13_dataroid_app_version: config.dataroidAppVersion,
        k13_page_path: config.pagePath
    });
    layer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const gtm = document.createElement("script");
    gtm.async = true;
    gtm.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(config.containerId) + "&l=" + layerName;
    gtm.referrerPolicy = "no-referrer";
    if (loader.nonce) gtm.nonce = loader.nonce;
    gtm.addEventListener("load", () => {
        if (stopped) return;
        ready = true;
        emit({ event: "k13.dataroid_page_view" });
        for (const event of pending) {
            if (stopped) break;
            layer.push(event);
        }
        pending = [];
    });
    document.head.append(gtm);
})();
