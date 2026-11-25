/* YIXIN MACHINERY — shared LP behaviour. Depends on assets/config.js */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var PLACEHOLDER_RE =
    /YOUR_FORM_ENDPOINT_HERE|formspree\.io\/f\/xxxx|example\.com|placeholder|CHANGE_ME|xxxx/i;
  var ADS_PLACEHOLDER_RE = /CONVERSION_ID|CONVERSION_LABEL|^AW-$/i;

  function get(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && acc[key] != null ? acc[key] : "";
    }, obj);
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function isPlaceholderEndpoint(url) {
    return !url || PLACEHOLDER_RE.test(String(url));
  }

  function isAdsPlaceholder() {
    var id = get(cfg, "ads.conversionId");
    var label = get(cfg, "ads.conversionLabel");
    return !id || !label || ADS_PLACEHOLDER_RE.test(id) || ADS_PLACEHOLDER_RE.test(label);
  }

  function waDigits() {
    var digits = get(cfg, "contact.whatsappDigits");
    if (digits) return String(digits).replace(/\D/g, "");
    return String(get(cfg, "contact.whatsapp") || "").replace(/\D/g, "");
  }

  function waUrl(extra) {
    var text = get(cfg, "whatsappPrefill") || "Hello Yixin, I need a quotation. ";
    if (extra) text += extra;
    return "https://wa.me/" + waDigits() + "?text=" + encodeURIComponent(text);
  }

  function bindText() {
    qsa("[data-bind]").forEach(function (el) {
      var val = get(cfg, el.getAttribute("data-bind"));
      if (val) el.textContent = val;
    });
    qsa("[data-bind-href]").forEach(function (el) {
      var val = get(cfg, el.getAttribute("data-bind-href"));
      if (val) el.setAttribute("href", val);
    });
    qsa("[data-mailto]").forEach(function (el) {
      var email = get(cfg, "contact.email");
      if (email) el.setAttribute("href", "mailto:" + email);
    });
    qsa("[data-whatsapp]").forEach(function (el) {
      var extra = el.getAttribute("data-whatsapp") || "";
      el.setAttribute("href", waUrl(extra));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });
    qsa("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function captureAttribution() {
    var params = new URLSearchParams(window.location.search);
    var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gad_source"];
    var stored = {};
    try {
      stored = JSON.parse(sessionStorage.getItem("yx_attr") || "{}");
    } catch (e) {
      stored = {};
    }
    keys.forEach(function (k) {
      var v = params.get(k);
      if (v) stored[k] = v;
    });
    stored.landingPage = stored.landingPage || window.location.pathname;
    try {
      sessionStorage.setItem("yx_attr", JSON.stringify(stored));
    } catch (e) {}
    return stored;
  }

  function fillHiddenFields(form, attr) {
    var map = {
      page_url: window.location.href,
      page_path: window.location.pathname,
      product_line: form.getAttribute("data-product") || "",
      utm_source: attr.utm_source || "",
      utm_medium: attr.utm_medium || "",
      utm_campaign: attr.utm_campaign || "",
      gclid: attr.gclid || "",
    };
    Object.keys(map).forEach(function (name) {
      var input = form.querySelector('[name="' + name + '"]');
      if (input) input.value = map[name];
    });
  }

  function emailOk(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function requiredFields(form) {
    return [
      { name: "name", label: "Name", test: function (v) { return v.length >= 2; } },
      { name: "email", label: "Work email", test: emailOk },
      { name: "phone", label: "WhatsApp / phone", test: function (v) { return v.replace(/\s/g, "").length >= 7; } },
      { name: "product", label: "Target product / material", test: function (v) { return v.length >= 2; } },
      { name: "capacity", label: "Required capacity", test: function (v) { return v.length >= 1; } },
      { name: "country", label: "Country", test: function (v) { return v.length >= 2; } },
    ];
  }

  function showErrors(form, errors) {
    qsa(".field-error", form).forEach(function (n) {
      n.textContent = "";
    });
    qsa(".is-invalid", form).forEach(function (n) {
      n.classList.remove("is-invalid");
    });
    errors.forEach(function (err) {
      var field = form.querySelector('[name="' + err.name + '"]');
      if (!field) return;
      field.classList.add("is-invalid");
      var box = field.parentNode.querySelector(".field-error");
      if (box) box.textContent = err.message;
    });
  }

  function serialize(form) {
    var data = {};
    qsa("input, select, textarea", form).forEach(function (el) {
      if (!el.name || el.type === "submit") return;
      if (el.type === "checkbox") data[el.name] = el.checked;
      else data[el.name] = (el.value || "").trim();
    });
    data.brand = get(cfg, "brand.legalName");
    data.submittedAt = new Date().toISOString();
    /* Map fields to ll-knit UniCloud /b2b-inquiry schema */
    data.company = data.company || (data.country ? data.country + " B2B Inquiry" : "Yixin LP Inquiry");
    data.whatsapp = data.phone || "";
    data.category = data.product_line || "yixin-machinery";
    data.moq = data.capacity || "";
    data.message =
      "[Yixin LP] Target: " +
      (data.product || "") +
      " | Capacity: " +
      (data.capacity || "") +
      " | Line: " +
      (data.product_line || "") +
      (data.notes ? " | Notes: " + data.notes : "");
    data.website_url = "";
    data.source = "yixin-machinery-lp";
    data.pageUrl = data.page_url || window.location.href;
    return data;
  }

  function banner(form, type, html) {
    var el = form.querySelector(".form-banner") || form.parentNode.querySelector(".form-banner");
    if (!el) {
      el = document.createElement("div");
      el.className = "form-banner";
      form.insertBefore(el, form.firstChild);
    }
    el.className = "form-banner is-" + type;
    el.innerHTML = html;
    el.hidden = false;
  }

  function placeholderNoticeHtml() {
    var email = get(cfg, "contact.email") || "ll-knit@ll-knit.com";
    return (
      "<strong>Form endpoint is still a placeholder.</strong> " +
      "This inquiry was <em>not</em> delivered to the factory. " +
      "Set <code>SITE_CONFIG.form.endpoint</code> in <code>assets/config.js</code> " +
      "to a Formspree / Cloudflare Worker / webhook URL. " +
      "Meanwhile email <a href=\"mailto:" + email + "\">" + email + "</a> " +
      "or use WhatsApp."
    );
  }

  function mailtoDraft(data) {
    var email = get(cfg, "contact.email");
    var subject = encodeURIComponent(
      "RFQ — " + (data.product_line || "equipment") + " — " + (data.country || "")
    );
    var body = encodeURIComponent(
      [
        "Name: " + data.name,
        "Work email: " + data.email,
        "WhatsApp / phone: " + data.phone,
        "Product / material: " + data.product,
        "Required capacity: " + data.capacity,
        "Country: " + data.country,
        data.notes ? "Notes: " + data.notes : "",
        "Page: " + data.page_url,
      ]
        .filter(Boolean)
        .join("\n")
    );
    return "mailto:" + email + "?subject=" + subject + "&body=" + body;
  }

  function goThanks() {
    window.location.href = "thanks.html" + (window.location.search || "");
  }

  function handleSubmit(ev) {
    var form = ev.target;
    ev.preventDefault();
    var attr = captureAttribution();
    fillHiddenFields(form, attr);

    var errors = [];
    requiredFields(form).forEach(function (spec) {
      var field = form.querySelector('[name="' + spec.name + '"]');
      var val = field ? String(field.value || "").trim() : "";
      if (!spec.test(val)) {
        errors.push({ name: spec.name, message: spec.label + " is required." });
      }
    });
    var consent = form.querySelector('[name="consent"]');
    if (consent && !consent.checked) {
      errors.push({ name: "consent", message: "Please confirm we may contact you about this RFQ." });
    }
    showErrors(form, errors);
    if (errors.length) {
      var first = form.querySelector(".is-invalid");
      if (first) first.focus();
      return;
    }

    var data = serialize(form);
    try {
      sessionStorage.setItem("yx_last_rfq", JSON.stringify(data));
    } catch (e) {}

    var endpoint = get(cfg, "form.endpoint");
    var btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.dataset.label = btn.dataset.label || btn.textContent;
      btn.textContent = "Sending…";
    }

    function restoreBtn() {
      if (btn) {
        btn.disabled = false;
        btn.textContent = btn.dataset.label || "Request quotation";
      }
    }

    if (isPlaceholderEndpoint(endpoint)) {
      console.warn(
        "[YIXIN] form.endpoint is still a placeholder. RFQ was NOT sent.",
        "Edit assets/config.js → SITE_CONFIG.form.endpoint"
      );
      banner(
        form,
        "warn",
        placeholderNoticeHtml() +
          ' <span class="banner-actions">' +
          '<a class="btn btn-amber btn-sm" href="' +
          mailtoDraft(data) +
          '">Email this RFQ</a> ' +
          '<a class="btn btn-ghost btn-sm" href="thanks.html">Preview thank-you page</a>' +
          "</span>"
      );
      restoreBtn();
      return;
    }

    fetch(endpoint, {
      method: get(cfg, "form.method") || "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        goThanks();
      })
      .catch(function (err) {
        console.error("[YIXIN] RFQ submit failed:", err);
        banner(
          form,
          "error",
          "<strong>Could not reach the form endpoint.</strong> " +
            "Check the webhook URL in <code>assets/config.js</code>, then retry. " +
            'Or <a href="' +
            mailtoDraft(data) +
            '">email this RFQ</a> / ' +
            '<a data-whatsapp="' +
            (data.product || "") +
            '" href="' +
            waUrl(data.product || "") +
            '">WhatsApp sales</a>.'
        );
        restoreBtn();
      });
  }

  function wireForms() {
    var attr = captureAttribution();
    qsa("form.js-rfq").forEach(function (form) {
      fillHiddenFields(form, attr);
      form.addEventListener("submit", handleSubmit);
      if (isPlaceholderEndpoint(get(cfg, "form.endpoint"))) {
        var hint = form.querySelector(".endpoint-hint");
        if (hint) hint.hidden = false;
      }
    });
  }

  function wireFaq() {
    qsa(".faq-item").forEach(function (item) {
      var btn = qs("button, .faq-q", item);
      if (!btn) return;
      btn.addEventListener("click", function () {
        var open = item.classList.contains("is-open");
        qsa(".faq-item.is-open").forEach(function (other) {
          other.classList.remove("is-open");
          var b = qs("button, .faq-q", other);
          if (b) b.setAttribute("aria-expanded", "false");
        });
        if (!open) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function fireAdsConversion() {
    if (isAdsPlaceholder()) {
      console.info(
        "[YIXIN] Google Ads conversion IDs are placeholders. No gtag fired.",
        "Set SITE_CONFIG.ads.conversionId / conversionLabel in assets/config.js"
      );
      var note = qs("[data-ads-placeholder]");
      if (note) note.hidden = false;
      return;
    }
    var id = get(cfg, "ads.conversionId");
    var label = get(cfg, "ads.conversionLabel");
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = window.gtag || gtag;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    s.onload = function () {
      gtag("js", new Date());
      gtag("config", id);
      gtag("event", "conversion", {
        send_to: id + "/" + label,
      });
    };
    document.head.appendChild(s);
  }

  function thanksPage() {
    if (!document.body || document.body.getAttribute("data-page") !== "thanks") return;
    fireAdsConversion();
    var last = null;
    try {
      last = JSON.parse(sessionStorage.getItem("yx_last_rfq") || "null");
    } catch (e) {}
    var box = qs("[data-rfq-summary]");
    if (box && last) {
      box.hidden = false;
      box.innerHTML =
        "<dt>Product</dt><dd>" +
        escapeHtml(last.product || last.product_line || "—") +
        "</dd>" +
        "<dt>Capacity</dt><dd>" +
        escapeHtml(last.capacity || "—") +
        "</dd>" +
        "<dt>Country</dt><dd>" +
        escapeHtml(last.country || "—") +
        "</dd>";
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function jsonLd() {
    if (qs("#org-jsonld")) return;
    var data = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: get(cfg, "brand.legalName") || "Guangzhou Yixin Intelligent Equipment Co., Ltd.",
      alternateName: get(cfg, "brand.shortName"),
      email: get(cfg, "contact.email"),
      telephone: get(cfg, "contact.phoneDisplay"),
      address: {
        "@type": "PostalAddress",
        addressLocality: "Guangzhou",
        addressRegion: "Guangdong",
        addressCountry: "CN",
      },
    };
    var s = document.createElement("script");
    s.id = "org-jsonld";
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindText();
    captureAttribution();
    wireForms();
    wireFaq();
    thanksPage();
    jsonLd();
  });
})();
