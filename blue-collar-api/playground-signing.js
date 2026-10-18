// Makes "Try it" work with only the key id and the secret.
//
// The API wants three headers: x-api-key, x-timestamp and x-signature. The signature is an HMAC of the exact request,
// so a docs form cannot ask the reader to type it. The form asks for the two things the reader owns instead:
//   x-api-key     your key id   (VFN_TEST_… / VFN_LIVE_…)
//   x-secret-key  your secret   (VFN_SK_…)   <- exists only in this form; the API never receives it
// This script runs in the reader's browser, signs the request with the secret, adds x-timestamp and x-signature, and
// removes x-secret-key before the request is sent. The secret is never stored and never leaves the page.
//
// Mintlify loads every .js file in the docs folder on every page of the site, so this script only touches requests to
// the API hosts listed below; every other request is left exactly as it was. The playground sends its request with
// XMLHttpRequest (axios), so both XMLHttpRequest and fetch are wrapped. The playground must call the API directly
// (docs.json: api.playground.proxy = false), because a proxy would have to be given the secret.
(function () {
  if (window.__recordSigning) return;
  window.__recordSigning = true;

  var SECRET_HEADER = "x-secret-key";
  // The API, and a backend on this machine (for `build-openapi.mjs --local`). Add a staging host here to try it there.
  var API_HOSTS = ["api-bc.userecord.io", "localhost", "127.0.0.1"];

  function isApi(url) {
    try {
      return API_HOSTS.indexOf(new URL(String(url), window.location.href).hostname) > -1;
    } catch (e) {
      return false;
    }
  }

  var OPTIONAL_WHEN_EMPTY = ["idempotency-key", "x-on-behalf-of", "content-type"];

  function toHex(buffer) {
    return Array.prototype.map
      .call(new Uint8Array(buffer), function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  async function hmac(secret, text) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Signing needs a secure page. Open these docs over HTTPS (or http://localhost).");
    }
    var enc = new TextEncoder();
    var key = await window.crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return toHex(await window.crypto.subtle.sign("HMAC", key, enc.encode(text)));
  }

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return Date.now().toString(16) + "-" + Math.random().toString(16).slice(2);
  }

  // headers: { lower-case name: value }. Returns the headers to really send (no secret, with timestamp and signature).
  async function sign(method, url, headers, body) {
    var out = {};
    Object.keys(headers).forEach(function (name) {
      if (name === SECRET_HEADER) return;
      var value = String(headers[name]);
      // Empty optional fields are left out: an empty header is not "no header".
      if (OPTIONAL_WHEN_EMPTY.indexOf(name) > -1 && !value.trim()) return;
      out[name] = value;
    });
    var secret = String(headers[SECRET_HEADER] || "").trim();
    var apiKey = String(out["x-api-key"] || "").trim();
    if (apiKey) out["x-api-key"] = apiKey;

    // Every write takes an Idempotency-Key: make one when the field is empty.
    if (method !== "GET" && method !== "HEAD" && !out["idempotency-key"]) out["idempotency-key"] = uuid();
    if (body && !out["content-type"]) out["content-type"] = "application/json";

    // Missing key or secret: send it as is and let the API say what is missing (401).
    if (secret && apiKey) {
      var target = new URL(url, window.location.href);
      var timestamp = String(Date.now());
      out["x-timestamp"] = timestamp;
      out["x-signature"] = await hmac(secret, method + ":" + target.pathname + target.search + ":" + timestamp + ":" + body);
    }
    return out;
  }

  /* ── XMLHttpRequest (what the playground uses) ─────────────────────────── */
  var XHR = window.XMLHttpRequest;
  var nativeOpen = XHR.prototype.open;
  var nativeSetHeader = XHR.prototype.setRequestHeader;
  var nativeSend = XHR.prototype.send;

  XHR.prototype.open = function (method, url) {
    this.__rec = isApi(url) ? { method: String(method || "GET").toUpperCase(), url: String(url), headers: {} } : null;
    return nativeOpen.apply(this, arguments);
  };

  // Headers are held until send(): only then is it known whether a secret was typed.
  XHR.prototype.setRequestHeader = function (name, value) {
    if (!this.__rec) return nativeSetHeader.apply(this, arguments);
    this.__rec.headers[String(name).toLowerCase()] = value;
  };

  XHR.prototype.send = function (body) {
    var xhr = this;
    var rec = xhr.__rec;
    if (!rec) return nativeSend.apply(xhr, arguments);

    var apply = function (headers) {
      Object.keys(headers).forEach(function (name) { nativeSetHeader.call(xhr, name, headers[name]); });
    };

    // Not a Try it call with a secret: send it exactly as it was.
    if (!(SECRET_HEADER in rec.headers)) {
      apply(rec.headers);
      return nativeSend.apply(xhr, arguments);
    }

    sign(rec.method, rec.url, rec.headers, typeof body === "string" ? body : "").then(
      function (headers) {
        apply(headers);
        nativeSend.call(xhr, body);
      },
      function (error) {
        console.error("Could not sign the request:", error);
        xhr.abort();
        xhr.dispatchEvent(new Event("error"));
      },
    );
  };

  /* ── fetch (in case a page or a newer playground uses it) ──────────────── */
  var nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    var request = typeof Request !== "undefined" && input instanceof Request ? input : null;
    if (!isApi(request ? request.url : String(input))) return nativeFetch(input, init);
    var source = new Headers((init && init.headers) || (request && request.headers) || undefined);
    if (!source.has(SECRET_HEADER)) return nativeFetch(input, init);

    var headers = {};
    source.forEach(function (value, name) { headers[name.toLowerCase()] = value; });
    var method = String((init && init.method) || (request && request.method) || "GET").toUpperCase();
    var url = request ? request.url : String(input);
    var body = "";
    if (init && typeof init.body === "string") body = init.body;
    else if (!(init && init.body) && request && method !== "GET" && method !== "HEAD") body = await request.clone().text();

    var signed = await sign(method, url, headers, body);
    var next = Object.assign({}, init || {}, { method: method, headers: signed });
    if (request) return nativeFetch(new Request(request, next));
    return nativeFetch(input, next);
  };

  /* ── Friendly labels ───────────────────────────────────────────────────────
     The playground labels each auth field with its header name. For readers the two things they hold are an API key
     and a secret key, so show those names. Only the text on screen changes: the header names the request uses do not.
     Runs only on pages that have the secret-key field, so no other page is touched. */
  var LABELS = { "x-api-key": "API key", "x-secret-key": "Secret key" };

  function textNodes(root) {
    var found = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) found.push(walker.currentNode);
    return found;
  }

  function relabel() {
    var nodes = textNodes(document.body);
    // The page has the secret-key field, before or after it was relabelled.
    var onApiPage = nodes.some(function (n) { var v = n.nodeValue.trim(); return v === "x-secret-key" || v === LABELS["x-secret-key"]; }) ||
      !!document.querySelector('input[placeholder="enter x-secret-key"], input[placeholder="enter secret key"]');
    if (!onApiPage) return;
    nodes.forEach(function (n) {
      var label = LABELS[n.nodeValue.trim()];
      if (label) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), label);
    });
    dedupeLists();
    Array.prototype.forEach.call(document.querySelectorAll("input"), function (input) {
      var m = /^(enter )(x-api-key|x-secret-key)$/i.exec(input.getAttribute("placeholder") || "");
      if (m) input.setAttribute("placeholder", m[1] + LABELS[m[2].toLowerCase()].toLowerCase());
      var a = /^(enter )(x-api-key|x-secret-key)$/i.exec(input.getAttribute("aria-label") || "");
      if (a) input.setAttribute("aria-label", a[1] + LABELS[a[2].toLowerCase()].toLowerCase());
    });
  }


  /* ── Lists pick each value once ──────────────────────────────────────────
     A list of fixed values (default_methods, days, methods) cannot repeat an item: the API refuses a repeat. The form
     adds a dropdown per item, so grey out in each dropdown the values already chosen in the others of the same list. */
  function addButtonCount(node) {
    return Array.prototype.filter.call(node.querySelectorAll("button"), function (b) {
      return b.textContent.trim() === "Add an item";
    }).length;
  }

  function dedupeLists() {
    var buttons = Array.prototype.filter.call(document.querySelectorAll("button"), function (b) {
      return b.textContent.trim() === "Add an item";
    });
    buttons.forEach(function (button) {
      var node = button.parentElement;
      // The largest block that holds only this list's "Add an item" button: its items are in there too.
      while (node.parentElement && node.parentElement !== document.body && addButtonCount(node.parentElement) === 1) node = node.parentElement;
      var selects = Array.prototype.filter.call(node.querySelectorAll("select"), function (sel) {
        return sel.options.length && /^select option$/i.test(sel.options[0].text.trim());
      });
      if (selects.length < 2) {
        selects.forEach(function (sel) { Array.prototype.forEach.call(sel.options, function (o) { o.disabled = false; }); });
        return;
      }
      selects.forEach(function (sel) {
        var others = selects.filter(function (o) { return o !== sel && o.value; }).map(function (o) { return o.value; });
        Array.prototype.forEach.call(sel.options, function (option) {
          if (!option.value) return;
          option.disabled = others.indexOf(option.value) > -1;
        });
      });
    });
  }

  var pending = null;
  function scheduleRelabel() {
    if (pending) return;
    pending = setTimeout(function () { pending = null; relabel(); }, 120);
  }
  document.addEventListener("change", scheduleRelabel, true);
  if (document.body) {
    new MutationObserver(scheduleRelabel).observe(document.body, { childList: true, subtree: true });
    scheduleRelabel();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      new MutationObserver(scheduleRelabel).observe(document.body, { childList: true, subtree: true });
      scheduleRelabel();
    });
  }
})();
