const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const source = file => readFileSync(join(__dirname, "..", file), "utf8");
const loader = source("Web/wwwroot/js/components/partner-tracking.js");
const template = source("Gtm/consent-template.js");

function page({ attributes = {}, pathname = "/" } = {}) {
    const defaultDataLayer = [{ event: "existing-ga4-entry" }];
    const gaEvents = [];
    const gtag = (...args) => gaEvents.push(args);
    const scripts = [];
    const windowEvents = {};
    let reloads = 0;
    let broadcast;
    const window = {
        dataLayer: defaultDataLayer,
        gtag,
        location: { origin: "https://www.example.com", pathname, reload: () => { reloads++; } },
        addEventListener: (event, handler) => { windowEvents[event] = handler; }
    };
    const document = {
        baseURI: window.location.origin + pathname,
        currentScript: {
            nonce: "site-nonce",
            dataset: {
                containerId: "GTM-TEST", dataroidSdkKey: "staging-public-key",
                dataroidEndpoint: "https://staging.api.dataroid.com",
                dataroidAppName: "staging-site", dataroidAppVersion: "1.0",
                pagePath: "/", ...attributes
            }
        },
        createElement: () => ({ addEventListener(event, handler) { this[event] = handler; } }),
        head: { append: element => scripts.push(element) }
    };
    const context = {
        window,
        document, URL,
        BroadcastChannel: class {
            constructor(name) {
                assert.equal(name, "ykb-cookie-consent");
            }
            addEventListener(event, handler) {
                if (event === "message") broadcast = handler;
            }
        }
    };

    runInNewContext(loader, context);
    return {
        window, scripts, defaultDataLayer, gtag, gaEvents, windowEvents,
        runAgain: () => runInNewContext(loader, context),
        reloads: () => reloads,
        events: () => Array.from(window.ykbPartnerLayer || [], item => item.event).filter(Boolean),
        receive: data => broadcast({ data }),
        load: () => scripts[0].load(),
        click(name, target, disabled = false, mobileLink = null, tab = false) {
            const anchor = {
                dataset: { partnerClick: name }, textContent: "Elektrik Faturası",
                matches: selector => (disabled && selector.includes("[aria-disabled='true']")) || (tab && selector.includes("[role='tab']")),
                hasAttribute: key => key === "data-ykb-button" && !!mobileLink,
                getAttribute: key => key === "href" ? target : null
            };
            window.YkbButtonLinks = { inspect: () => mobileLink };
            windowEvents.click({ button: 0, target: { closest: selector => selector === "a[data-partner-click]" && name ? anchor : null } });
        }
    };
}

test("partner loader is inert without its own valid container and tenant details", () => {
    for (const attributes of [
        { containerId: "G-TEST" }, { dataroidSdkKey: "" }, { dataroidEndpoint: "" },
        { pagePath: "" }, { pagePath: "/arama?q=sample" }, { pagePath: "//example.net" }, { pagePath: "/offer%2fsecret" }, { pagePath: "/%2e%2e/secret" }
    ]) {
        assert.equal(page({ attributes }).scripts.length, 0);
    }
});

test("GTM and all partner events use their own named layer and preserve the existing Google tag", () => {
    const site = page();
    site.runAgain();
    assert.equal(site.scripts.length, 1);
    assert.equal(site.scripts[0].src, "https://www.googletagmanager.com/gtm.js?id=GTM-TEST&l=ykbPartnerLayer");
    assert.equal(site.scripts[0].nonce, "site-nonce");
    site.load();
    assert.deepEqual(site.events(), ["gtm.js", "k13.dataroid_page_view"]);
    assert.equal(site.window.ykbPartnerLayer[0].k13_dataroid_app_name, "staging-site");
    assert.equal(site.window.dataLayer, site.defaultDataLayer);
    assert.deepEqual(site.defaultDataLayer, [{ event: "existing-ga4-entry" }]);
    assert.equal(site.window.gtag, site.gtag);
});

test("button clicks use the inventory names and safe parameters", () => {
    const site = page();
    site.click("home_personal_loan_apply", "/basvuru-merkezi");
    assert.deepEqual(site.events(), ["gtm.js"]);
    site.load();
    site.click("customer_acquisition", "/banka-hesabi-ac?token=omit");
    site.click("customer_acquisition", "/other", true);
    site.click("unrecognized", "/other");
    assert.deepEqual(site.events(), [
        "gtm.js", "k13.dataroid_page_view",
        "k13.AnasayfaBIK_HemenBasvur_ButtonClick", "k13.Yapi_Kredili_Ol_ButtonClick"
    ]);
    const [apply, acquisition] = site.window.ykbPartnerLayer.slice(-2);
    assert.equal(apply.k13_button_url, "https://www.example.com/basvuru-merkezi");
    assert.equal(acquisition.k13_button_url, "https://www.example.com/banka-hesabi-ac");
    assert.ok(!JSON.stringify(site.window.ykbPartnerLayer).includes("token=omit"));
});

test("a saved preference received before GTM loads discards queued events and refreshes the active tab", () => {
    const site = page();
    site.click("home_personal_loan_apply", "/basvuru-merkezi");
    site.receive({ unrelated: true });
    assert.equal(site.window.YkbPartnerTracking.analyticsAllowed, true);
    site.receive({ analytics: false });
    site.load();
    assert.equal(site.reloads(), 1);
    assert.equal(site.window.YkbPartnerTracking.analyticsAllowed, false);
    assert.deepEqual(site.events(), ["gtm.js"]);
});

test("a loaded page signals Dataroid consent revocation and stops events when cached in history", () => {
    const site = page();
    site.load();
    site.windowEvents.pagehide({ persisted: true });
    site.click("customer_acquisition", "/banka-hesabi-ac");
    assert.deepEqual(site.events(), ["gtm.js", "k13.dataroid_page_view", "k13.partner_consent_update"]);
    assert.equal(site.window.YkbPartnerTracking.analyticsAllowed, false);
});

test("GTM template reads the saved analytics decision for Dataroid", () => {
    function run(initialize, allowed) {
        const calls = [];
        runInNewContext(template, {
            data: { initialize, gtmOnSuccess: () => calls.push(["success"]) },
            require(name) {
                if (name === "copyFromWindow") {
                    return key => {
                        assert.equal(key, "YkbPartnerTracking.analyticsAllowed");
                        return allowed;
                    };
                }
                return state => calls.push([name, { ...state }]);
            }
        });
        return calls;
    }
    assert.deepEqual(run(true, true), [
        ["setDefaultConsentState", { ykb_dataroid_storage: "denied" }],
        ["updateConsentState", { ykb_dataroid_storage: "granted" }],
        ["success"]
    ]);
    assert.deepEqual(run(false, undefined), [
        ["updateConsentState", { ykb_dataroid_storage: "denied" }],
        ["success"]
    ]);
});

test("Razor uses existing saved category preferences, excludes preview and reads provider values from Kentico", () => {
    const tracking = source("Web/Views/Shared/_PartnerTracking.cshtml");
    const settings = source("Infrastructure/CookieConsent/PartnerSettings.cs");
    assert.match(tracking, /Model\?\.Analytics != true/);
    assert.match(tracking, /Context\.Request\.QueryString\.HasValue/);
    assert.match(tracking, /\.Preview\(\)\.Enabled/);
    assert.match(tracking, /\.PageBuilder\(\)\.EditMode/);
    assert.match(tracking, /@inject ISettingsService/);
    assert.match(tracking, /PartnerSettings\.IsPublicSiteHost\(Context\.Request\.Host\.Host\)/);
    assert.doesNotMatch(tracking, /IConfiguration/);
    assert.match(settings, /SiteContext\.CurrentSiteName/);
    assert.match(settings, /settings\[SiteCodeName \+ "\." \+ KeyPrefix \+ suffix\]/);
});

test("CMS button selection, mobile destination and origin decide both providers", () => {
    const site = page({ attributes: { gaId: "G-TARGET" } });
    site.load();
    for (const url of ["https://internetsube.yapikredi.com.tr/", "//example.net/", "#menu", "javascript:void(0)"]) {
        site.click("electricity", url);
    }
    site.click("", "/bill");
    site.click("unknown", "/bill");
    site.click("electricity", "/bill", true);
    site.click("electricity", "/bill", false, { target: "_self", url: "https://internetsube.yapikredi.com.tr/" });
    site.click("electricity", "/bill", false, { target: "_modal", url: "/bill" });
    assert.equal(site.gaEvents.length, 0);
    assert.deepEqual(site.events(), ["gtm.js", "k13.dataroid_page_view"]);
    site.click("electricity", "https://example.net/", false, { target: "_self", url: "/mobile?token=omit#section" });
    assert.equal(site.gaEvents[0][1], "OdemeMerkezi_ElektrikFaturasi_ButtonClick");
    assert.equal(site.gaEvents[0][2].send_to, "G-TARGET");
    assert.equal(site.window.ykbPartnerLayer.at(-1).k13_button_url, "https://www.example.com/mobile");
    site.click("all_calculators", "/calc");
    assert.equal(site.gaEvents.at(-1)[1], "TumHesaplamaAraclari_ButtonClick");
    assert.equal(site.events().length, 3);
});

test("GA4 events use the existing Google tag even when Dataroid is disabled", () => {
    const site = page({ attributes: { dataroidSdkKey: "", gaId: "G-TEST" } });
    assert.equal(site.scripts.length, 0);
    assert.equal(site.gaEvents.length, 0);
    site.click("customer_acquisition", "/account?token=omit");
    assert.equal(site.gaEvents[0][2].Button_URL, "https://www.example.com/account");
    assert.equal(site.gaEvents[0][2].Page_URL, "https://www.example.com/");
    assert.ok(!JSON.stringify(site.gaEvents).includes("token=omit"));
    site.window["ga-disable-G-TEST"] = true;
    site.click("electricity", "/bill");
    assert.equal(site.gaEvents.length, 1);
});

test("content switches and browser history changes produce no click or extra page view", () => {
    const site = page({ attributes: { gaId: "G-TEST", pagePath: "/urun/" }, pathname: "/urun/" });
    site.load();
    for (const url of ["#taksit", "?tab=taksit", "/urun#taksit", "/urun/?tab=taksit"]) {
        site.click("electricity", url);
    }
    site.click("electricity", "/other", false, null, true);
    site.windowEvents.popstate?.({});
    site.windowEvents.hashchange?.({});
    assert.equal(site.gaEvents.length, 0);
    assert.deepEqual(site.events(), ["gtm.js", "k13.dataroid_page_view"]);
});

test("documented button choices reproduce the GA4 names and matching Dataroid triggers", () => {
    const rows = source("Integration/BUTON-ALANI.md").split("\n");
    const options = rows.filter(row => /^[a-z_]+;/.test(row)).map(row => row.split(";")[0]);
    const expectedEvents = rows.filter(row => row.includes(" | `/")).map(row => row.split("|")[3].trim().replaceAll("`", ""));
    const site = page({ attributes: { gaId: "G-TEST", pagePath: "/bireysel/ödeme.html" } });
    site.load();
    for (const option of options) site.click(option, "/ödeme/su.html");
    assert.equal(options.length, 12);
    assert.deepEqual(site.gaEvents.map(event => event[1]), expectedEvents);
    const triggerCsv = source("Gtm/OLAYLAR.csv");
    const clickSignals = site.events().filter(name => name.endsWith("ButtonClick"));
    assert.equal(clickSignals.length, 11);
    for (const eventName of clickSignals) assert.ok(triggerCsv.includes(eventName + ",Custom Event"));
});
