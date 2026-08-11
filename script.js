/* =========================================================
   نرخ طلا — اپلیکیشن نمایش قیمت طلا و محاسبه‌گر
   ساختار: تک صفحه (SPA) با مسیریابی مبتنی بر hash
   ========================================================= */

(function () {
  "use strict";

  var DATA = null;              // { meta, prices, products, consultArticles }
  var DATA_ERROR = false;       // خطای بارگذاری اولیه (بدون هیچ داده معتبری)
  var LAST_CHECK = null;        // زمان آخرین تلاش کاربر برای بررسی/بروزرسانی (سمت کلاینت)
  var LAST_CHECK_FAILED = false;
  var REFRESHING = false;

  var viewEl = document.getElementById("view");
  var topbarEl = document.getElementById("topbar");
  var bottomNavEl = document.getElementById("bottomNav");

  /* =========================================================
     نسخه پشتیبان داده (Fallback)
     =========================================================
     وقتی این فایل مستقیماً با دوبار کلیک (پروتکل file://) باز
     می‌شود، مرورگرها به دلایل امنیتی اجازه fetch کردن data.json
     را نمی‌دهند و برنامه با صفحه سفید یا خطا مواجه می‌شود.

     برای این‌که دموی این پروژه بدون نیاز به هیچ سروری هم کار
     کند، یک نسخه یکسان از همان داده‌های data.json در همین‌جا
     نگه‌داری می‌شود. برنامه ابتدا سعی می‌کند data.json را واکشی
     کند (روش استاندارد و توصیه‌شده وقتی از یک سرور اجرا می‌شود)
     و فقط اگر این واکشی ممکن نبود، از همین نسخه پشتیبان استفاده
     می‌کند. یعنی اگر data.json را ویرایش کنید و پروژه را با یک
     سرور محلی اجرا کنید، همان مقادیر ویرایش‌شده نمایش داده
     می‌شوند.
     ========================================================= */
  var FALLBACK_DATA = {
    "meta": {
      "isMock": true,
      "sourceLabel": "داده نمونه (Mock) — آماده اتصال به API واقعی",
      "lastUpdated": "1404/05/19 - 09:30",
      "currency": "تومان"
    },
    "prices": [
      { "id": "gold18", "title": "طلای ۱۸ عیار", "stamp": "750", "unit": "گرم", "price": 6850000, "previousPrice": 6800000, "change": 50000, "changePercent": 0.74, "gramBased": true, "karat": 18 },
      { "id": "gold24", "title": "طلای ۲۴ عیار", "stamp": "999", "unit": "گرم", "price": 9133000, "previousPrice": 9067000, "change": 66000, "changePercent": 0.73, "gramBased": true, "karat": 24 },
      { "id": "mesghal", "title": "مثقال طلا", "stamp": "18K", "unit": "مثقال (۴.۳۳۱۸ گرم)", "price": 29673000, "previousPrice": 29950000, "change": -277000, "changePercent": -0.92, "gramBased": false },
      { "id": "ounce", "title": "اونس جهانی طلا", "stamp": "999", "unit": "اونس (۳۱.۱ گرم)", "price": 284068000, "previousPrice": 281500000, "change": 2568000, "changePercent": 0.91, "gramBased": false }
    ],
    "products": [
      { "id": "prod-001", "name": "النگو طلا ۱۸ عیار ساده", "icon": "💫", "weight": 12.5, "karat": 18, "price": 85625000, "description": "النگوی ساده طلای ۱۸ عیار با طراحی کلاسیک، مناسب استفاده روزمره. قیمت شامل اجرت ساخت است.", "seller": { "name": "طلافروشی درخشان", "address": "تهران، بازار طلافروشان، پاساژ درخشان", "phone": "09121230099", "workHours": "شنبه تا پنج‌شنبه، ۱۰ تا ۱۹" }, "comments": [ { "author": "لیلا صادقی", "rating": 5, "text": "کیفیت ساخت خیلی خوب بود و وزن دقیقاً مطابق فاکتور بود.", "date": "1404/04/15" } ] },
      { "id": "prod-002", "name": "سکه تمام بهار آزادی", "icon": "🪙", "weight": 8.13, "karat": 21, "price": 62000000, "description": "سکه تمام بهار آزادی با عیار ۲۱ (۹۰۰)، مناسب سرمایه‌گذاری و هدیه. قیمت شامل حباب بازار سکه است و ممکن است با نرخ روز تفاوت داشته باشد.", "seller": { "name": "صرافی و طلافروشی مهر", "address": "تهران، خیابان فردوسی، نبش کوچه بانک ملی", "phone": "02133112233", "workHours": "شنبه تا چهارشنبه، ۹ تا ۱۸" }, "comments": [ { "author": "بهنام رضوی", "rating": 4, "text": "معامله شفاف بود ولی صف نسبتاً طولانی بود.", "date": "1404/03/30" } ] },
      { "id": "prod-003", "name": "گردنبند طلا ۱۸ عیار طرح برگ", "icon": "🍃", "weight": 6.2, "karat": 18, "price": 42470000, "description": "گردنبند سبک با طرح برگ، مناسب هدیه. زنجیر و آویز به‌صورت یکپارچه ساخته شده‌اند.", "seller": { "name": "طلافروشی درخشان", "address": "تهران، بازار طلافروشان، پاساژ درخشان", "phone": "09121230099", "workHours": "شنبه تا پنج‌شنبه، ۱۰ تا ۱۹" }, "comments": [ { "author": "نگین عباسی", "rating": 5, "text": "خیلی ظریف و شیک بود، دقیقاً همون چیزی که میخواستم.", "date": "1404/04/22" } ] },
      { "id": "prod-004", "name": "انگشتر طلا ۲۴ عیار آب‌شده", "icon": "💍", "weight": 3.8, "karat": 24, "price": 34705000, "description": "انگشتر ساده از طلای آب‌شده ۲۴ عیار، مناسب کسانی که به دنبال خلوص بالا هستند نه طراحی خاص.", "seller": { "name": "صرافی و طلافروشی مهر", "address": "تهران، خیابان فردوسی، نبش کوچه بانک ملی", "phone": "02133112233", "workHours": "شنبه تا چهارشنبه، ۹ تا ۱۸" }, "comments": [] }
    ],
    "consultArticles": [
      { "id": "art-1", "title": "عیار طلا یعنی چه؟", "body": "عیار نشان‌دهنده میزان خلوص طلا در یک قطعه است. طلای ۲۴ عیار تقریباً خالص است، در حالی که طلای ۱۸ عیار حدود ۷۵٪ طلای خالص و ۲۵٪ فلزات دیگر مانند مس یا نقره دارد. طلای ۱۸ عیار به دلیل استحکام بیشتر، پرکاربردترین عیار برای ساخت زیورآلات روزمره است." },
      { "id": "art-2", "title": "چطور وزن طلا را دقیق بسنجیم؟", "body": "برای وزن‌کشی دقیق طلا باید از ترازوی دیجیتال با دقت حداقل ۰.۰۱ گرم استفاده کرد. هنگام خرید، حتماً وزن‌کشی را در حضور خودتان و روی ترازوی طلافروشی انجام دهید و آن را با فاکتور مقایسه کنید." },
      { "id": "art-3", "title": "تفاوت اجرت، سود و مالیات در قیمت نهایی", "body": "قیمت نهایی طلای ساخته‌شده معمولاً از سه بخش تشکیل می‌شود: قیمت پایه طلا بر اساس وزن و عیار، اجرت ساخت که بابت طراحی و ساخت دریافت می‌شود، و سود و مالیات طلافروشی. این اجزا را جداگانه از فروشنده بخواهید تا قیمت شفاف باشد." },
      { "id": "art-4", "title": "چند نکته برای خرید مطمئن طلا", "body": "همیشه از طلافروشی‌های دارای مجوز خرید کنید، فاکتور رسمی دریافت کنید، مهر عیار روی قطعه را بررسی کنید و در صورت امکان قیمت را با چند طلافروشی مقایسه کنید تا از منصفانه بودن نرخ اجرت مطمئن شوید." }
    ]
  };

  /* =========================================================
     لایه داده — نقطه اتصال به منبع قیمت طلا
     =========================================================
     getGoldPrices() تنها تابعی است که مسئول دریافت قیمت طلاست.
     در نسخه فعلی، چون به API واقعی و رایگان و بدون کلید که از
     مرورگر قابل فراخوانی باشد دسترسی نداریم، این تابع تلاش
     می‌کند از فایل نمونه data.json بخواند و اگر ممکن نبود (مثلاً
     به دلیل باز بودن پروژه با file:// به‌جای یک سرور)، از نسخه
     پشتیبان داخلی همین فایل استفاده می‌کند. در هر دو حالت، این
     موضوع در رابط کاربری به‌صورت شفاف (برچسب «داده نمونه») به
     کاربر اعلام می‌شود.

     برای اتصال به API واقعی در آینده:
       ۱. این تابع را بازنویسی کنید تا به یک بک‌اند اختصاصی شما
          (مثلاً GET /api/gold-prices) درخواست بزند، نه مستقیم به
          سرویس‌دهنده API. کلید API هرگز نباید در کد فرانت‌اند
          (این فایل) قرار بگیرد.
       ۲. بک‌اند شما کلید API را به‌صورت امن (متغیر محیطی روی
          سرور) نگه می‌دارد و در پاسخ به مرورگر، فقط داده نهایی
          (بدون کلید) را برمی‌گرداند.
       ۳. خروجی تابع باید همان ساختار { meta, prices } را حفظ
          کند تا بقیه برنامه بدون هیچ تغییری کار کند.
     ========================================================= */
  function fetchDataFile() {
    if (!window.fetch || location.protocol === "file:") {
      // fetch روی file:// در اغلب مرورگرها مسدود می‌شود؛
      // مستقیماً به نسخه پشتیبان می‌رویم.
      return Promise.reject(new Error("file-protocol"));
    }
    return fetch("data.json", { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("fetch-failed");
      return res.json();
    });
  }

  function getGoldPrices() {
    return fetchDataFile()
      .catch(function () { return FALLBACK_DATA; })
      .then(function (json) {
        if (!json || !Array.isArray(json.prices) || !json.meta) {
          throw new Error("bad-shape");
        }
        return { meta: json.meta, prices: json.prices };
      });
  }

  // محصولات و مطالب مشاوره در این نسخه از همان منبع خوانده می‌شوند
  function getProductsAndArticles() {
    return fetchDataFile()
      .catch(function () { return FALLBACK_DATA; })
      .then(function (json) {
        if (!json || !Array.isArray(json.products)) throw new Error("bad-shape");
        return { products: json.products, consultArticles: json.consultArticles || [] };
      });
  }

  /* ---------------- Utilities ---------------- */

  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatToman(n) {
    try {
      return new Intl.NumberFormat("fa-IR").format(Math.round(n));
    } catch (e) {
      return String(Math.round(n));
    }
  }

  function nowLabel() {
    var d = LAST_CHECK || new Date();
    try {
      return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return d.toISOString();
    }
  }

  function findPrice(id) {
    if (!DATA) return null;
    for (var i = 0; i < DATA.prices.length; i++) {
      if (DATA.prices[i].id === id) return DATA.prices[i];
    }
    return null;
  }

  function findProduct(id) {
    if (!DATA || !DATA.products) return null;
    for (var i = 0; i < DATA.products.length; i++) {
      if (DATA.products[i].id === id) return DATA.products[i];
    }
    return null;
  }

  function changeChipHTML(item) {
    var isUp = item.change >= 0;
    var arrow = isUp ? "▲" : "▼";
    var sign = isUp ? "+" : "";
    return (
      '<span class="change-chip ' + (isUp ? "up" : "down") + '">' +
        arrow + " " + esc(sign + formatToman(item.change)) + " تومان" +
        " &nbsp;|&nbsp; " + esc(sign + item.changePercent.toFixed(2)) + "٪" +
      "</span>"
    );
  }

  /* ---------------- Router ---------------- */

  function navigate(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", init);

  function init() {
    bottomNavEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".nav-btn");
      if (!btn) return;
      navigate(btn.getAttribute("data-route"));
    });
    loadAll();
  }

  function loadAll() {
    viewEl.innerHTML = loadingSkeleton();
    Promise.all([getGoldPrices(), getProductsAndArticles()])
      .then(function (results) {
        DATA = {
          meta: results[0].meta,
          prices: results[0].prices,
          products: results[1].products,
          consultArticles: results[1].consultArticles
        };
        DATA_ERROR = false;
        LAST_CHECK = new Date();
        LAST_CHECK_FAILED = false;
        render();
      })
      .catch(function () {
        DATA_ERROR = true;
        render();
      });
  }

  function refreshPrices() {
    if (REFRESHING) return;
    REFRESHING = true;
    updateRefreshButtonState();
    getGoldPrices()
      .then(function (res) {
        DATA.meta = res.meta;
        DATA.prices = res.prices;
        LAST_CHECK = new Date();
        LAST_CHECK_FAILED = false;
      })
      .catch(function () {
        LAST_CHECK = new Date();
        LAST_CHECK_FAILED = true;
      })
      .then(function () {
        REFRESHING = false;
        render();
      });
  }

  function updateRefreshButtonState() {
    var btn = document.getElementById("refreshBtn");
    if (!btn) return;
    btn.disabled = REFRESHING;
    btn.classList.toggle("loading", REFRESHING);
  }

  function loadingSkeleton() {
    return (
      '<div style="padding:16px;">' +
        '<div class="skeleton" style="height:150px;border-radius:22px;margin-bottom:12px;"></div>' +
        '<div class="skeleton" style="height:60px;border-radius:14px;margin-bottom:10px;"></div>' +
        '<div class="skeleton" style="height:60px;border-radius:14px;"></div>' +
      "</div>"
    );
  }

  function render() {
    var hash = location.hash || "#/";
    setActiveNav(hash);

    if (DATA_ERROR) {
      renderTopbar("نرخ طلا", false);
      viewEl.innerHTML = fullErrorState();
      attachRetryHandler();
      return;
    }
    if (!DATA) return;

    var m;
    if (hash === "#/" || hash === "") {
      renderHome();
    } else if (hash === "#/prices") {
      renderPrices();
    } else if (hash === "#/calculator") {
      renderCalculator();
    } else if (hash === "#/products") {
      renderProducts();
    } else if ((m = hash.match(/^#\/product\/([^/]+)$/))) {
      renderProductDetail(decodeURIComponent(m[1]));
    } else if (hash === "#/consult") {
      renderConsult();
    } else {
      renderNotFound();
    }

    window.scrollTo(0, 0);
  }

  function setActiveNav(hash) {
    var current = hash.split("?")[0];
    bottomNavEl.querySelectorAll(".nav-btn").forEach(function (b) {
      var r = b.getAttribute("data-route");
      var isActive =
        (r === "#/" && (current === "#/" || current === "")) ||
        (r === "#/prices" && current === "#/prices") ||
        (r === "#/calculator" && current === "#/calculator") ||
        (r === "#/products" && (current === "#/products" || current.indexOf("#/product/") === 0)) ||
        (r === "#/consult" && current === "#/consult");
      b.classList.toggle("active", isActive);
    });
  }

  /* ---------------- Topbar ---------------- */

  function renderTopbar(title, showBack, backHash) {
    if (!showBack) {
      topbarEl.innerHTML =
        '<div class="brand-mark"><span class="dot"></span>' + esc(title) + "</div>" +
        '<span class="mock-pill">داده نمونه</span>';
    } else {
      topbarEl.innerHTML =
        '<button class="back-btn" id="backBtn" aria-label="بازگشت">→</button>' +
        "<h1>" + esc(title) + "</h1>";
      document.getElementById("backBtn").addEventListener("click", function () {
        if (backHash) navigate(backHash);
        else history.back();
      });
    }
  }

  /* ---------------- Error / not found states ---------------- */

  function fullErrorState() {
    return (
      '<div class="state-msg"><span class="big-ic">⚠️</span>' +
      "در حال حاضر دریافت قیمت امکان‌پذیر نیست. لطفاً دوباره تلاش کنید." +
      '<br><button class="btn btn-primary" style="margin-top:14px;display:inline-flex;max-width:170px;" id="retryBtn">تلاش دوباره</button>' +
      "</div>"
    );
  }

  function attachRetryHandler() {
    var btn = document.getElementById("retryBtn");
    if (btn) btn.addEventListener("click", loadAll);
  }

  function renderNotFound() {
    renderTopbar("یافت نشد", true, "#/");
    viewEl.innerHTML = '<div class="state-msg"><span class="big-ic">🔍</span>صفحه موردنظر پیدا نشد.</div>';
  }

  /* ---------------- Home ---------------- */

  function renderHome() {
    renderTopbar("نرخ طلا", false);
    var g18 = findPrice("gold18");
    var others = DATA.prices.filter(function (p) { return p.id !== "gold18"; });

    var html = "";

    if (g18) {
      html +=
        '<div class="price-hero">' +
          '<div class="price-hero-top">' +
            '<div><div class="price-hero-title">' + esc(g18.title) + " (هر " + esc(g18.unit) + ")</div>" +
            '<div class="price-hero-amount">' + esc(formatToman(g18.price)) + ' <span class="u">تومان</span></div>' +
            changeChipHTML(g18) + "</div>" +
            '<div class="stamp lg"><span>' + esc(g18.stamp) + "</span></div>" +
          "</div>" +
          '<div class="price-hero-meta">' +
            '<div class="times">آخرین به‌روزرسانی قیمت: ' + esc(DATA.meta.lastUpdated) + "<br>" +
            "آخرین بررسی شما: " + esc(nowLabel()) + "</div>" +
            '<button class="refresh-btn" id="refreshBtn"><span class="spin">⟳</span>بروزرسانی</button>' +
          "</div>" +
        "</div>";
    }

    html += '<div class="mock-banner">⚠️ ' + esc(DATA.meta.sourceLabel) + ' — این عدد قیمت واقعی و لحظه‌ای بازار نیست.</div>';

    if (LAST_CHECK_FAILED) {
      html += '<div class="error-banner">بروزرسانی اخیر ناموفق بود؛ آخرین قیمت معتبر (زمان: ' + esc(DATA.meta.lastUpdated) + ") نمایش داده شده است.</div>";
    }

    html +=
      '<div class="quick-actions">' +
        '<div class="qa-btn" data-route="#/calculator"><span class="ic">🧮</span>محاسبه</div>' +
        '<div class="qa-btn" data-route="#/prices"><span class="ic">💰</span>قیمت‌ها</div>' +
        '<div class="qa-btn" data-route="#/products"><span class="ic">💍</span>محصولات</div>' +
        '<div class="qa-btn" data-route="#/consult"><span class="ic">📖</span>مشاوره</div>' +
      "</div>" +

      '<div class="section-head"><h3>سایر قیمت‌ها</h3><a id="seeAllLink">مشاهده همه ←</a></div>' +
      '<div class="mini-strip" id="miniStrip">' +
        others.map(function (p) {
          var isUp = p.change >= 0;
          return (
            '<div class="mini-card" data-route="#/prices">' +
              '<div class="mc-title">' + esc(p.title) + "</div>" +
              '<div class="mc-amount">' + esc(formatToman(p.price)) + "</div>" +
              '<div class="mc-change" style="color:' + (isUp ? "var(--up)" : "var(--down)") + '">' +
                (isUp ? "▲" : "▼") + " " + esc(Math.abs(p.changePercent).toFixed(2)) + "٪" +
              "</div>" +
            "</div>"
          );
        }).join("") +
      "</div>";

    viewEl.innerHTML = html;

    var refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", refreshPrices);
    updateRefreshButtonState();

    document.getElementById("seeAllLink").addEventListener("click", function () { navigate("#/prices"); });
    viewEl.querySelectorAll("[data-route]").forEach(function (el) {
      el.addEventListener("click", function () { navigate(el.getAttribute("data-route")); });
    });
  }

  /* ---------------- Prices page ---------------- */

  function renderPrices() {
    renderTopbar("قیمت‌های طلا", true, "#/");

    var html =
      '<div class="mock-banner">⚠️ ' + esc(DATA.meta.sourceLabel) + "<br>آخرین به‌روزرسانی: " + esc(DATA.meta.lastUpdated) + "</div>";

    if (LAST_CHECK_FAILED) {
      html += '<div class="error-banner">بروزرسانی اخیر ناموفق بود؛ آخرین قیمت معتبر نمایش داده شده است.</div>';
    }

    html += '<div class="price-list">' + DATA.prices.map(function (p) {
      return (
        '<div class="price-card">' +
          '<div class="stamp"><span>' + esc(p.stamp) + "</span></div>" +
          '<div class="pc-info">' +
            '<div class="pc-title">' + esc(p.title) + "</div>" +
            '<div class="pc-unit">قیمت هر ' + esc(p.unit) + "</div>" +
            '<div class="pc-amount">' + esc(formatToman(p.price)) + ' <span class="u">تومان</span></div>' +
          "</div>" +
          changeChipHTML(p) +
        "</div>"
      );
    }).join("") + "</div>" +
    '<div class="action-row"><button class="btn btn-primary" id="goCalc">🧮 محاسبه قیمت طلای خودم</button></div>';

    viewEl.innerHTML = html;
    document.getElementById("goCalc").addEventListener("click", function () { navigate("#/calculator"); });
  }

  /* ---------------- Calculator ---------------- */

  function renderCalculator() {
    renderTopbar("محاسبه قیمت طلا", true, "#/");

    var gramOptions = DATA.prices.filter(function (p) { return p.gramBased; });

    var html =
      '<div class="calc-card">' +
        '<div class="field">' +
          '<label for="calcWeight">وزن طلا (گرم)</label>' +
          '<input type="number" id="calcWeight" min="0" step="0.01" inputmode="decimal" placeholder="مثلاً ۵.۲">' +
          '<div class="field-error" id="weightError" style="display:none;"></div>' +
        "</div>" +
        '<div class="field">' +
          '<label for="calcKarat">عیار طلا</label>' +
          '<select id="calcKarat">' +
            gramOptions.map(function (p) {
              return '<option value="' + esc(p.id) + '">' + esc(p.title) + "</option>";
            }).join("") +
          "</select>" +
        "</div>" +
        '<div class="calc-result" id="calcResult">' +
          '<div class="cr-label">قیمت تقریبی</div>' +
          '<div class="cr-amount">۰ <span class="u">تومان</span></div>' +
          '<div class="cr-sub">وزن را وارد کنید</div>' +
        "</div>" +
      "</div>";

    viewEl.innerHTML = html;

    var weightInput = document.getElementById("calcWeight");
    var karatSelect = document.getElementById("calcKarat");
    var errorEl = document.getElementById("weightError");
    var resultEl = document.getElementById("calcResult");

    function compute() {
      var weight = parseFloat(weightInput.value);
      var karatPrice = findPrice(karatSelect.value);
      errorEl.style.display = "none";

      if (!weightInput.value.trim()) {
        resultEl.innerHTML =
          '<div class="cr-label">قیمت تقریبی</div><div class="cr-amount">۰ <span class="u">تومان</span></div><div class="cr-sub">وزن را وارد کنید</div>';
        return;
      }
      if (isNaN(weight) || weight <= 0) {
        errorEl.textContent = "لطفاً یک عدد معتبر و بزرگ‌تر از صفر برای وزن وارد کنید.";
        errorEl.style.display = "block";
        resultEl.innerHTML =
          '<div class="cr-label">قیمت تقریبی</div><div class="cr-amount">۰ <span class="u">تومان</span></div><div class="cr-sub">وزن نامعتبر است</div>';
        return;
      }
      if (!karatPrice) return;

      var total = weight * karatPrice.price;
      resultEl.innerHTML =
        '<div class="cr-label">قیمت تقریبی (' + esc(weight) + " گرم، " + esc(karatPrice.title) + ')</div>' +
        '<div class="cr-amount">' + esc(formatToman(total)) + ' <span class="u">تومان</span></div>' +
        '<div class="cr-sub">بر اساس نرخ هر گرم: ' + esc(formatToman(karatPrice.price)) + " تومان — بدون احتساب اجرت ساخت</div>";
    }

    weightInput.addEventListener("input", compute);
    karatSelect.addEventListener("change", compute);
  }

  /* ---------------- Products ---------------- */

  function renderProducts() {
    renderTopbar("محصولات طلا", true, "#/");
    var products = DATA.products || [];

    var html;
    if (!products.length) {
      html = '<div class="state-msg"><span class="big-ic">💍</span>در حال حاضر محصولی ثبت نشده است.</div>';
    } else {
      html = '<div class="prod-grid">' + products.map(function (p) {
        return (
          '<div class="prod-card" data-id="' + esc(p.id) + '">' +
            '<div class="p-ic">' + esc(p.icon || "💍") + "</div>" +
            '<div class="p-name">' + esc(p.name) + "</div>" +
            '<div class="p-meta">' + esc(p.weight) + " گرم · عیار " + esc(p.karat) + "</div>" +
            '<div class="p-price">' + esc(formatToman(p.price)) + " تومان</div>" +
          "</div>"
        );
      }).join("") + "</div>";
    }

    viewEl.innerHTML = html;
    viewEl.querySelectorAll(".prod-card[data-id]").forEach(function (card) {
      card.addEventListener("click", function () {
        navigate("#/product/" + encodeURIComponent(card.getAttribute("data-id")));
      });
    });
  }

  /* ---------------- Product detail ---------------- */

  function renderProductDetail(id) {
    var p = findProduct(id);
    if (!p) {
      renderTopbar("یافت نشد", true, "#/products");
      viewEl.innerHTML = '<div class="state-msg"><span class="big-ic">🔍</span>این محصول پیدا نشد.</div>';
      return;
    }
    renderTopbar(p.name, true, "#/products");

    var phoneDigits = (p.seller && p.seller.phone || "").replace(/\D/g, "");
    var comments = p.comments || [];

    var commentsHTML = comments.length
      ? comments.map(function (c) {
          var stars = "";
          for (var i = 0; i < 5; i++) stars += i < Math.round(c.rating) ? "★" : "☆";
          return (
            '<div class="comment-item">' +
              '<div class="comment-head"><span class="comment-author">' + esc(c.author) + "</span>" +
              '<span class="comment-date">' + esc(c.date) + "</span></div>" +
              '<div class="comment-stars">' + stars + "</div>" +
              '<p class="comment-text">' + esc(c.text) + "</p>" +
            "</div>"
          );
        }).join("")
      : '<p style="font-size:12px;color:var(--muted);">هنوز نظری ثبت نشده است.</p>';

    var html =
      '<div class="detail-hero2">' +
        '<div class="d-ic">' + esc(p.icon || "💍") + "</div>" +
        "<h2>" + esc(p.name) + "</h2>" +
        '<div class="d-meta">وزن ' + esc(p.weight) + " گرم · عیار " + esc(p.karat) + "</div>" +
        '<div class="price-hero-amount" style="justify-content:center;margin-top:10px;">' +
          esc(formatToman(p.price)) + ' <span class="u">تومان</span>' +
        "</div>" +
      "</div>" +

      '<div class="block"><h4>توضیحات</h4><p>' + esc(p.description) + "</p></div>" +

      '<div class="block"><h4>فروشنده و ارتباط</h4>' +
        '<a class="contact-row" href="tel:' + esc(phoneDigits) + '"><span class="ic">📞</span>' +
          '<span><strong>' + esc(p.seller.name) + '</strong><small>تماس تلفنی: ' + esc(p.seller.phone) + "</small></span>" +
        "</a>" +
        '<a class="contact-row" href="sms:' + esc(phoneDigits) + '"><span class="ic">✉️</span>' +
          "<span><strong>ارسال پیامک</strong><small>" + esc(p.seller.phone) + "</small></span>" +
        "</a>" +
        '<div class="contact-row"><span class="ic">📍</span><span><strong>آدرس</strong><small>' + esc(p.seller.address) + "</small></span></div>" +
        '<div class="contact-row"><span class="ic">🕒</span><span><strong>ساعات کاری</strong><small>' + esc(p.seller.workHours) + "</small></span></div>" +
      "</div>" +

      '<div class="block"><h4>نظرات مشتریان</h4>' + commentsHTML + "</div>";

    viewEl.innerHTML = html;
  }

  /* ---------------- Consultation ---------------- */

  function renderConsult() {
    renderTopbar("مشاوره طلا", true, "#/");
    var articles = DATA.consultArticles || [];

    var html = articles.map(function (a, idx) {
      return (
        '<div class="accordion" style="margin-top:' + (idx === 0 ? "16px" : "0") + ';">' +
          '<div class="acc-head" data-idx="' + idx + '"><span>' + esc(a.title) + '</span><span class="chev">⌄</span></div>' +
          '<div class="acc-body" id="accBody' + idx + '"><div class="acc-body-inner">' + esc(a.body) + "</div></div>" +
        "</div>"
      );
    }).join("");

    if (!articles.length) {
      html = '<div class="state-msg"><span class="big-ic">📖</span>مطلبی برای نمایش وجود ندارد.</div>';
    }

    viewEl.innerHTML = html;

    viewEl.querySelectorAll(".acc-head").forEach(function (head) {
      head.addEventListener("click", function () {
        var idx = head.getAttribute("data-idx");
        var body = document.getElementById("accBody" + idx);
        var isOpen = head.classList.contains("open");
        if (isOpen) {
          head.classList.remove("open");
          body.style.maxHeight = "0px";
        } else {
          head.classList.add("open");
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    });
  }
})();
