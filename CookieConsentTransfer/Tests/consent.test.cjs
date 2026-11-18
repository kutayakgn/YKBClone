const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const script = name => readFileSync(join(__dirname, "../Web/wwwroot/js/components", name + ".js"), "utf8");

function analytics(measurementId, disabled = false) {
    const requests = [];
    const window = { ["ga-disable-" + measurementId]: disabled };
    const document = {
        currentScript: { dataset: { measurementId, cookiePrefix: "ykbconsent" } },
        createElement: () => ({}),
        head: { append: element => requests.push(element.src) }
    };
    runInNewContext(script("cookie-analytics"), { document, window });
    return { requests, commands: (window.dataLayer || []).map(command => Array.from(command)) };
}

test("GA4 loader only runs with a valid measurement ID and puts consent before config", () => {
    assert.deepEqual(analytics(undefined).requests, []);
    assert.deepEqual(analytics("UA-1234").requests, []);
    assert.deepEqual(analytics("G-TEST", true).requests, []);

    const { requests, commands } = analytics("G-TEST");
    assert.deepEqual(requests, ["https://www.googletagmanager.com/gtag/js?id=G-TEST"]);
    assert.deepEqual(commands[0].slice(0, 2), ["consent", "default"]);
    assert.equal(commands[0][2].analytics_storage, "denied");
    for (const flag of ["ad_storage", "ad_user_data", "ad_personalization"]) {
        assert.equal(commands[0][2][flag], "denied");
    }
    assert.deepEqual(commands[1].slice(0, 2), ["consent", "update"]);
    assert.equal(commands[1][2].analytics_storage, "granted");
    assert.equal(commands[3][0], "config");
    assert.equal(commands[3][2].cookie_domain, "none");
    assert.equal(commands[3][2].cookie_prefix, "ykbconsent");
});

function consentPage({ saved, replies }) {
    const errors = [{ hidden: true }, { hidden: true }];
    const visible = new Set();
    const switches = ["Functional", "Analytics", "Advertising"].map((field, index) => ({
        dataset: { cookieField: field },
        checked: saved?.[index] ?? false
    }));
    const requests = [];
    const messages = [];
    let reloads = 0;
    let postNumber = 0;

    const element = data => Object.assign({ hidden: true, focus() {} }, data);
    const banner = element({
        querySelector: () => errors[0],
        classList: {
            toggle: (name, enabled) => enabled ? visible.add(name) : visible.delete(name),
            remove: name => visible.delete(name)
        }
    });
    const modal = element({
        querySelector: () => errors[1],
        querySelectorAll: () => switches,
        addEventListener() {}
    });
    const icon = element({});
    let clickHandler;
    const root = {
        dataset: {
            hasChoice: String(Boolean(saved)),
            saveError: "Save failed",
            policyChanged: "Policy changed"
        },
        querySelectorAll: selector => selector === ".cookie-save-error" ? errors : [],
        addEventListener: (type, handler) => { if (type === "click") clickHandler = handler; }
    };
    const elements = {
        cookieConsent: root,
        cookieBanner: banner,
        cookieModal: modal,
        cookieIcon: icon,
        cookieConsentToken: { action: "https://localhost/cookie/agree" },
        ykbCookieAnalytics: saved?.[1] ? { dataset: { measurementId: "G-TEST" } } : null
    };
    const window = {
        location: { reload: () => { reloads++; } },
        addEventListener() {}
    };

    runInNewContext(script("cookie-consent"), {
        document: { getElementById: id => elements[id] },
        window,
        crypto: { randomUUID: () => "event-" + (++postNumber) },
        FormData: class extends Map {
            constructor() {
                super([["__RequestVerificationToken", "token"], ["PolicyVersion", "1"]]);
            }
        },
        BroadcastChannel: class {
            postMessage(message) { messages.push(message); }
            addEventListener() {}
        },
        fetch: async (url, options) => {
            requests.push({ url, options });
            const { status, result } = replies.shift();
            return { status, ok: status === 200, json: async () => result };
        }
    });

    return {
        bannerVisible: () => visible.has("is-visible"),
        icon, modal, switches, requests, window, errors, messages,
        reloads: () => reloads,
        async click(action) {
            const button = element({ dataset: { cookieAction: action } });
            clickHandler({ target: { closest: () => button } });
            await new Promise(resolve => setImmediate(resolve));
        }
    };
}

test("fresh modal starts with optional switches off and submits analytics-only with an antiforgery token", async () => {
    const page = consentPage({ replies: [{ status: 200, result: { changed: true, analytics: true } }] });
    assert.equal(page.bannerVisible(), true);
    assert.equal(page.icon.hidden, true);

    await page.click("edit");
    assert.equal(page.bannerVisible(), false);
    assert.equal(page.modal.hidden, false);
    assert.deepEqual(page.switches.map(input => input.checked), [false, false, false]);
    page.switches[1].checked = true;
    await page.click("custom");

    const request = page.requests[0];
    assert.equal(request.url, "https://localhost/cookie/agree");
    assert.equal(request.options.credentials, "same-origin");
    assert.equal(request.options.body.get("__RequestVerificationToken"), "token");
    assert.equal(request.options.body.get("PolicyVersion"), "1");
    assert.equal(request.options.body.get("Action"), "custom");
    assert.equal(request.options.body.get("Functional"), "false");
    assert.equal(request.options.body.get("Analytics"), "true");
    assert.equal(request.options.body.get("Advertising"), "false");
    assert.equal(page.reloads(), 1);
});

test("withdrawal disables the current GA4 instance before refreshing the layout", async () => {
    const page = consentPage({
        saved: [true, true, true],
        replies: [{ status: 200, result: { changed: true, analytics: false } }]
    });
    assert.equal(page.bannerVisible(), false);
    assert.equal(page.icon.hidden, false);
    await page.click("edit");
    await page.click("reject");

    assert.equal(page.requests[0].options.body.get("Action"), "reject");
    assert.equal(page.requests[0].options.body.has("Analytics"), false);
    assert.equal(page.window["ga-disable-G-TEST"], true);
    assert.equal(page.messages[0].analytics, false);
    assert.equal(page.reloads(), 1);
});

test("failed saves keep the choice visible and stable request ID is reused on retry", async () => {
    const page = consentPage({
        replies: [{ status: 500 }, { status: 200, result: { changed: true, analytics: false } }]
    });
    await page.click("reject");
    assert.equal(page.bannerVisible(), true);
    assert.equal(page.errors[0].textContent, "Save failed");
    assert.equal(page.reloads(), 0);
    await page.click("reject");
    assert.equal(page.requests[0].options.body.get("EventId"), page.requests[1].options.body.get("EventId"));
    assert.equal(page.reloads(), 1);
});

test("unchanged choices close the editor without reloading or saving unsent switch edits", async () => {
    const page = consentPage({
        saved: [false, false, false],
        replies: [{ status: 200, result: { changed: false, analytics: false } }]
    });
    await page.click("edit");
    page.switches[1].checked = true;
    await page.click("reject");
    assert.equal(page.reloads(), 0);
    assert.equal(page.modal.hidden, true);
    assert.equal(page.icon.hidden, false);
    await page.click("edit");
    assert.equal(page.switches[1].checked, false);
});
