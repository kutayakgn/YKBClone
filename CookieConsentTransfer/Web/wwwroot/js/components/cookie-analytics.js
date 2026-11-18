(() => {
    "use strict";

    const config = document.currentScript?.dataset;
    const id = config?.measurementId;
    if (!id || !/^G-[A-Z0-9]+$/.test(id) || window["ga-disable-" + id]) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };

    window.gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
    });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", id, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: "none",
        cookie_path: "/",
        cookie_prefix: config.cookiePrefix,
        cookie_expires: 31536000,
        cookie_update: false,
        cookie_flags: "SameSite=Lax;Secure"
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.append(script);
})();
