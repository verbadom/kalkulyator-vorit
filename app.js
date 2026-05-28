const IS_TEST = new URLSearchParams(window.location.search).get('mode') === 'test';
const BASE_IMG = "https://images.prom.ua/";

const _leadTracker = {
  sessionCalcs: 0,
  warmNotified: false,
  WEBHOOK: "https://n8n.verbadom.com.ua/webhook/cardinal-lead",

  onCalculation(data) {
    this.sessionCalcs++;
    if (this.sessionCalcs >= 3 && !this.warmNotified) {
      this.warmNotified = true;
      this._send("warm", data, `🟡 Теплий лід — ${this.sessionCalcs} розрахунки за сесію`);
    }
  },

  onMessengerClick(messenger, data) {
    this._send("hot", data, `🔴 Гарячий лід — клік на ${messenger}`);
  },

  async _send(type, calcData, title) {
    try {
      await fetch(this.WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType: type,
          title,
          sessionCalcs: this.sessionCalcs,
          city: calcData.city || "",
          model: calcData.model || "",
          config: calcData.config || "",
          width: calcData.width || "",
          totalPrice: calcData.totalPrice || "",
          timestamp: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().replace("Z", "+03:00"),
        })
      });
    } catch (e) {}
  }
};

let _lastCalcData = {};

// Динамічні ціни з таблиці
let LOCK_PRICE = 1500;
let BOLTS_PRICE = 600;
let POST_DATA = {
  "775":  { label: "Нефарбований 80×60, стінка 2мм / висота 3м", price: 775 },
  "1120": { label: "Нефарбований 80×80, стінка 3мм / висота 3м", price: 1120 },
  "750":  { label: "Фарбований 60×60, стінка 2мм / висота 2м",   price: 750 },
  "1240": { label: "Фарбований 80×80, стінка 3мм / висота 2м",   price: 1240 },
  "950":  { label: "Фарбований 60×60, стінка 2мм / висота 2,4м", price: 950 },
  "1560": { label: "Фарбований 80×80, стінка 3мм / висота 2,4м", price: 1560 },
};

async function loadPricesFromSheet() {
  try {
    const response = await fetch("https://n8n.verbadom.com.ua/webhook/cardinal-prices");
    const data = await response.json();
    const prices = data[0];

    prices.forged.forEach(item => {
      const model = GATE_MODELS.forged.find(m => m.name === item.name);
      if (model) model.price = item.price;
    });
    prices.modern.forEach(item => {
      const model = GATE_MODELS.modern.find(m => m.name === item.name);
      if (model) model.price = item.price;
    });

    if (prices.lockPrice) LOCK_PRICE = prices.lockPrice;
    if (prices.boltsPrice) BOLTS_PRICE = prices.boltsPrice;

    if (prices.posts && prices.posts.length > 0) {
      POST_DATA = {};
      prices.posts.forEach((post, index) => {
        const key = String(index + 1);
        const label = `${post.name}, ${post.chars} / висота ${post.height}`;
        POST_DATA[key] = { label, price: post.price };
      });
      updatePostSelect();
    }

    if (prices.coatings && prices.coatings.length > 0) {
      window._COATINGS = prices.coatings;
    }

    console.log("✅ Ціни завантажено з таблиці", { LOCK_PRICE, BOLTS_PRICE, posts: Object.keys(POST_DATA).length });
  } catch (e) {
    console.warn("⚠️ Не вдалось завантажити ціни, використовуємо резервні");
  }
}

function updatePostSelect() {
  const postSelect = document.getElementById("post");
  if (!postSelect) return;
  const currentVal = postSelect.value;
  postSelect.innerHTML = '<option value="none">Без стовпів</option>';
  Object.entries(POST_DATA).forEach(([key, post]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = post.label;
    postSelect.appendChild(opt);
  });
  if (currentVal && POST_DATA[currentVal]) postSelect.value = currentVal;
}

const GATE_MODELS = {
  forged: [
    { name: "Стандарт",               price: 16500, img: "6556444322_kovani-rozpashni-vorota.jpg" },
    { name: "Стандарт (Полоса)",        price: 16500, img: "6725089051_kovani-rozpashni-vorota.jpg" },
    { name: "Стандарт 2",             price: 16500, img: "6556444631_kovani-rozpashni-vorota.jpg" },
    { name: "Стандарт 3",             price: 17500, img: "6556445150_kovani-rozpashni-vorota.jpg" },
    { name: "Модель №2",              price: 19900, img: "6556446957_kovani-rozpashni-vorota.jpg" },
    { name: "Модель №3",              price: 18500, img: "6556447183_kovani-rozpashni-vorota.jpg" },
    { name: "Модель №4",              price: 18100, img: "6556445475_kovani-rozpashni-vorota.jpg" },
    { name: "Модель №5",              price: 19500, img: "6556445762_kovani-rozpashni-vorota.jpg" },
    { name: "Модель №6 (Без металу)", price: 23800, img: "6556446086_kovani-rozpashni-vorota.jpg", noCoating: true },
    { name: "Модель №6 (З металом)",  price: 24100, img: "6556446262_kovani-rozpashni-vorota.jpg" },
    { name: "Модель №7",              price: 23800, img: "6556446468_kovani-rozpashni-vorota.jpg", noCoating: true },
    { name: "Модель №8",              price: 20500, img: "7180549778_kovani-rozpashni-vorota.jpg" },
  ],
  modern: [
    { name: "Профнастил Т-10, вертикаль",   price: 21800, img: "7182693069_w640_h640_raspashnye-vorota-i.jpg",    doubleSided: true  },
    { name: "Профнастил Т-14, вертикаль",   price: 21800, img: "7182687030_w640_h640_raspashnye-vorota-i.jpg",    doubleSided: true  },
    { name: "Профнастил Т-14, горизонталь", price: 21800, img: "7182684215_w640_h640_7182684215.jpg",             doubleSided: true  },
    { name: "Профнастил Т-20, вертикаль",   price: 21800, img: "7182677551_w640_h640_7182677551.jpg",             doubleSided: true  },
    { name: "Профнастил Т-20, горизонталь", price: 21800, img: "7182669689_w640_h640_7182669689.jpg",             doubleSided: true  },
    { name: "Металоштакетник, вертикаль",   price: 25300, img: "7182714399_w640_h640_r.jpg",                      doubleSided: false, note: "двосторонній у базі" },
    { name: "Металоштакетник, горизонталь", price: 25300, img: "7182740147_w640_h640_7182740147.jpg",             doubleSided: false, note: "двосторонній у базі" },
    { name: "Ранчо Ромб",   price: 30500, img: "7182772470_w640_h640_raspashnye-vo.jpg",       doubleSided: false },
    { name: "Ранчо Комбо",  price: 30000, img: "7182834593_w640_h640_raspashnye-.jpg",         doubleSided: false },
    { name: "Ранчо №1",     price: 26500, img: "7183001952_w640_h640_raspashnye-vorota-.jpg",  doubleSided: false },
    { name: "Ранчо №2",     price: 33450, img: "7182925017_w640_h640_raspashnye-vorota-.jpg",  doubleSided: false },
    { name: "Ранчо №3",     price: 30600, img: "7183023071_w640_h640_raspashnye-vorota-.jpg",  doubleSided: false },
    { name: "Жалюзі",       price: 29440, img: "7182793227_w640_h640_ra.jpg",                  doubleSided: false },
    { name: "Блок Хаус",    price: 22400, img: "7182760021_w640_h640_raspashnye-vorota-i.jpg", doubleSided: true  },
  ]
};

loadPricesFromSheet();

const INCLUDED_FORGED = `<strong>У вартість входить:</strong> петлі на ворота та хвіртку, тримач навісного замка`;
const INCLUDED_MODERN = `<strong>У вартість входить:</strong> електромеханічний замок на хвіртку, петлі, ручка на хвіртку, тримач навісного замка`;

let selectedCityName = "";
let selectedLat = null;
let selectedLng = null;
let _acDebounce = null;
let _acActiveIndex = -1;

window.initGoogleAutocomplete = function () {
  const input = document.getElementById("city");
  const dropdown = document.getElementById("city-dropdown");
  if (!input || !dropdown) return;

  input.addEventListener("input", function () {
    selectedLat = null;
    selectedLng = null;
    selectedCityName = "";
    input.classList.remove("has-selection");
    clearTimeout(_acDebounce);
    const q = input.value.trim();
    if (q.length < 2) { acClose(); return; }
    _acDebounce = setTimeout(() => acFetch(q), 350);
  });

  input.addEventListener("keydown", function (e) {
    const items = dropdown.querySelectorAll(".city-option");
    if (dropdown.style.display === "none" || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); acSetActive(Math.min(_acActiveIndex + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); acSetActive(Math.max(_acActiveIndex - 1, 0)); }
    else if (e.key === "Enter" && _acActiveIndex >= 0) { e.preventDefault(); items[_acActiveIndex].click(); }
    else if (e.key === "Escape") { acClose(); }
  });

  document.addEventListener("click", function (e) {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) acClose();
  });
};

async function acFetch(q) {
  try {
    const { AutocompleteSuggestion } = await google.maps.importLibrary("places");
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: q,
      includedPrimaryTypes: ["locality", "administrative_area_level_3"],
      includedRegionCodes: ["ua"],
      language: "uk",
    });
    acRender(suggestions);
  } catch (e) { acClose(); }
}

function acRender(suggestions) {
  const dropdown = document.getElementById("city-dropdown");
  _acActiveIndex = -1;
  dropdown.innerHTML = "";
  if (!suggestions || !suggestions.length) { acClose(); return; }
  suggestions.forEach(function (s, i) {
    const p = s.placePrediction;
    const main = p.mainText ? p.mainText.toString() : "";
    const secondary = p.secondaryText ? p.secondaryText.toString().replace(/, Україна$/, "") : "";
    const div = document.createElement("div");
    div.className = "city-option";
    div.innerHTML = '<div class="city-option-main">' + main + '</div>' +
      (secondary ? '<div class="city-option-sub">' + secondary + '</div>' : '');
    div.addEventListener("mouseenter", function () { acSetActive(i); });
    div.addEventListener("click", function () { acSelect(p, main, secondary); });
    dropdown.appendChild(div);
  });
  dropdown.style.display = "block";
}

async function acSelect(placePrediction, main, sub) {
  const input = document.getElementById("city");
  const label = sub ? main + ", " + sub : main;
  input.value = label;
  selectedCityName = label;
  input.classList.add("has-selection");
  acClose();
  try {
    const place = placePrediction.toPlace();
    await place.fetchFields({ fields: ["location"] });
    selectedLat = place.location.lat();
    selectedLng = place.location.lng();
    clearError(input);
  } catch (e) {}
}

function acSetActive(idx) {
  const dropdown = document.getElementById("city-dropdown");
  const items = dropdown.querySelectorAll(".city-option");
  items.forEach(function (el) { el.classList.remove("active"); });
  _acActiveIndex = idx;
  if (idx >= 0 && idx < items.length) items[idx].classList.add("active");
}

function acClose() {
  const dropdown = document.getElementById("city-dropdown");
  if (dropdown) dropdown.style.display = "none";
  _acActiveIndex = -1;
}

function calcGatePrice(type, price, config, width) {
  const std = type === "forged" ? 4.5 : 4.9;
  let gatePrice = 0;

  if (type === "forged") {
    if (config === "with_separate_wicket") {
      if (width < std)        gatePrice = price + 675;
      else if (width === std) gatePrice = price;
      else                    gatePrice = Math.round((price / 4.5 + 200) * width);
    } else if (config === "without_wicket") {
      gatePrice = Math.round((price / 4.5 + 338) * width);
    } else if (config === "with_builtin_wicket") {
      gatePrice = Math.round(price * 0.27778 * width);
    }
  }

  if (type === "modern") {
    if (config === "with_separate_wicket") {
      if (width < std)        gatePrice = Math.round((price / 4.9 + 150) * 4.5);
      else if (width === std) gatePrice = price;
      else                    gatePrice = Math.round((price / 4.9 + 200) * width);
    } else if (config === "without_wicket") {
      gatePrice = Math.round((price / 4.9 + 338) * width);
    } else if (config === "with_builtin_wicket") {
      gatePrice = Math.round(price * 0.25 * width);
    }
  }

  return Math.ceil(gatePrice / 100) * 100;
}

const gateTypeSelect  = document.getElementById("gateType");
const gateModelSelect = document.getElementById("gateModel");
const modelPhoto      = document.getElementById("modelPhoto");
const includedBlock   = document.getElementById("includedBlock");
const configSelect    = document.getElementById("configuration");
const widthInput      = document.getElementById("width");
const coatingSelect   = document.getElementById("coating");
const coatingNote     = document.getElementById("coatingNote");
const lockField       = document.getElementById("lockField");
const lockCheckbox    = document.getElementById("lock");
const postSelect      = document.getElementById("post");
const postQtyField    = document.getElementById("postQtyField");
const calculateBtn    = document.getElementById("calculateBtn");
const resetBtn        = document.getElementById("resetBtn");
const resultDiv       = document.getElementById("result");

function updateWidthHint() {
  const type   = gateTypeSelect.value;
  const config = configSelect.value;
  const rawW   = widthInput.value.replace(",", ".");
  const width  = parseFloat(rawW);
  const hint   = document.getElementById("widthHint");
  if (!hint) return;

  hint.style.display = "none";
  hint.textContent = "";

  if (!type || !config || isNaN(width)) return;
  if (config === "with_builtin_wicket") return;

  let msg = "";
  if (config === "with_separate_wicket") {
    if (type === "forged" && width !== 4.5) {
      msg = "💡 Якщо розмір ще не визначено — ширина 4,5 м (ворота 3,6 м + хвіртка 0,9 м) зазвичай найвигідніша";
    } else if (type === "modern" && width !== 4.9) {
      msg = "💡 Якщо розмір ще не визначено — ширина 4,9 м (ворота 4,0 м + хвіртка 0,9 м) зазвичай найвигідніша";
    }
  }
  if (config === "without_wicket") {
    if (type === "forged" && width !== 3.6) {
      msg = "💡 Якщо розмір ще не визначено — ширина 3,6 м зазвичай найвигідніша";
    } else if (type === "modern" && width !== 4.0) {
      msg = "💡 Якщо розмір ще не визначено — ширина 4,0 м зазвичай найвигідніша";
    }
  }

  if (msg) {
    hint.textContent = msg;
    hint.style.display = "block";
  }
}

widthInput.addEventListener("input", updateWidthHint);
configSelect.addEventListener("change", updateWidthHint);
gateTypeSelect.addEventListener("change", updateWidthHint);

gateTypeSelect.addEventListener("change", () => {
  const type = gateTypeSelect.value;
  gateModelSelect.innerHTML = "";
  modelPhoto.style.display = "none";
  includedBlock.style.display = "none";
  updateCoatingOptions();
  clearErrors();

  if (!type) {
    gateModelSelect.innerHTML = '<option value="">— Спочатку оберіть тип —</option>';
    gateModelSelect.disabled = true;
    lockField.style.display = "none";
    return;
  }

  gateModelSelect.disabled = false;
  gateModelSelect.innerHTML = '<option value="">— Оберіть модель —</option>';
  GATE_MODELS[type].forEach((model, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = model.name;
    gateModelSelect.appendChild(opt);
  });

  lockField.style.display = type === "forged" ? "block" : "none";
});

gateModelSelect.addEventListener("change", () => {
  const type = gateTypeSelect.value;
  const idx  = gateModelSelect.value;

  if (!type || idx === "") {
    modelPhoto.style.display = "none";
    includedBlock.style.display = "none";
    return;
  }

  const model = GATE_MODELS[type][idx];
  modelPhoto.src = BASE_IMG + model.img;
  modelPhoto.alt = model.name;
  modelPhoto.style.display = "block";
  includedBlock.innerHTML = type === "forged" ? INCLUDED_FORGED : INCLUDED_MODERN;
  includedBlock.style.display = "block";
  updateCoatingOptions();
  clearError(gateModelSelect);
});

function updateCoatingOptions() {
  const type = gateTypeSelect.value;
  const idx  = gateModelSelect.value;
  coatingSelect.innerHTML = "";
  coatingNote.textContent = "";

  if (type === "forged") {
    if (idx !== "") {
      const model = GATE_MODELS[type][idx];
      if (model.noCoating) {
        coatingSelect.innerHTML = `<option value="0">Без профнастилу — тільки ковані елементи</option>`;
        coatingSelect.disabled = true;
        return;
      }
    }
    coatingSelect.disabled = false;
    const c = window._COATINGS || [];
    const matoviy    = c.find(x => x.name && x.name.toLowerCase().includes('матов') && !x.name.toLowerCase().includes('двусторон')) || { surcharge: 300 };
    const dvustoron  = c.find(x => x.name && x.name.toLowerCase().includes('двусторон')) || { surcharge: 500 };
    const derevo     = c.find(x => x.name && x.name.toLowerCase().includes('дерево')) || { surcharge: 500 };
    coatingSelect.innerHTML = `
      <option value="" disabled selected>— Оберіть тип покриття —</option>
      <option value="0">Глянець 0,3 мм (базовий варіант)</option>
      <option value="${matoviy.surcharge}">Матовий односторонній 0,45 мм (+${matoviy.surcharge} грн)</option>
      <option value="${dvustoron.surcharge}_двусторон">Матовий двосторонній 0,45 мм (+${dvustoron.surcharge} грн) ⭐ обирають найчастіше</option>
      <option value="${derevo.surcharge}_wood">Під дерево / 3D Дерево 0,4 мм (+${derevo.surcharge} грн)</option>
    `;
    coatingNote.innerHTML = "Оберіть з 4 варіантів. <strong>Двосторонній</strong> — однаковий колір з обох боків, гарантія 10 років.";
    return;
  }

  if (type === "modern" && idx !== "") {
    const model = GATE_MODELS[type][idx];
    coatingSelect.disabled = false;

    if (model.note === "двосторонній у базі") {
      coatingSelect.innerHTML = `<option value="0">Матовий двосторонній 0,45 мм — входить у вартість</option>`;
      coatingNote.textContent = "Металоштакетник виготовляється з двостороннім кольоровим покриттям.";
      return;
    }

    if (model.doubleSided) {
      const cm = window._COATINGS || [];
      const dvustoronM = cm.find(x => x.name && x.name.toLowerCase().includes('двусторон')) || { surcharge: 500 };
      coatingSelect.innerHTML = `
        <option value="" disabled selected>— Оберіть тип покриття —</option>
        <option value="0">Матовий односторонній 0,45 мм (базовий варіант)</option>
        <option value="${dvustoronM.surcharge}_двусторон">Матовий двосторонній 0,45 мм (+${dvustoronM.surcharge} грн) ⭐ обирають найчастіше</option>
      `;
    } else {
      coatingSelect.innerHTML = `<option value="0">Матовий кольоровий 0,45 мм — входить у вартість</option>`;
      coatingNote.textContent = "Для цієї моделі зашивка кольорова з усіх сторін.";
    }
    return;
  }

  coatingSelect.disabled = false;
  coatingSelect.innerHTML = `<option value="" disabled selected>— Оберіть тип покриття —</option><option value="0">Глянець 0,3 мм (базовий варіант)</option>`;
}

postSelect.addEventListener("change", () => {
  postQtyField.style.display = postSelect.value !== "none" ? "block" : "none";
});

function setError(el) { el.classList.add("field-error"); }
function clearError(el) { el.classList.remove("field-error"); }
function clearErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.classList.remove("field-error"));
}

function validateForm() {
  let valid = true;
  const type   = gateTypeSelect.value;
  const idx    = gateModelSelect.value;
  const config = configSelect.value;
  const width  = widthInput.value.replace(",", ".");

  if (!type)   { setError(gateTypeSelect);  valid = false; }
  if (!idx)    { setError(gateModelSelect); valid = false; }
  if (!config) { setError(configSelect);    valid = false; }
  const widthNum = parseFloat(width);
  if (!width || isNaN(widthNum) || widthNum < 2.5 || widthNum > 6) {
    setError(widthInput); valid = false;
    if (widthNum > 6) {
      widthInput.setAttribute("data-error", "Максимальна ширина — 6 м. Для нестандартних розмірів зверніться до менеджера.");
    } else if (widthNum < 2.5) {
      widthInput.setAttribute("data-error", "Мінімальна ширина — 2,5 м. Для нестандартних розмірів зверніться до менеджера.");
    }
  }
  const coatingVal = coatingSelect.value;
  if (coatingVal === "" || coatingVal === null) {
    setError(coatingSelect);
    valid = false;
  }

  const cityVal = document.getElementById("city").value.trim();
  if (!cityVal) {
    setError(document.getElementById("city"));
    valid = false;
  }

  return valid;
}

resetBtn.addEventListener("click", () => {
  gateTypeSelect.value = "";
  gateModelSelect.innerHTML = '<option value="">— Спочатку оберіть тип —</option>';
  gateModelSelect.disabled = true;
  modelPhoto.style.display = "none";
  includedBlock.style.display = "none";
  widthInput.value = "";
  lockCheckbox.checked = false;
  lockField.style.display = "none";
  document.getElementById("bolts").checked = false;
  postSelect.value = "none";
  postQtyField.style.display = "none";
  document.getElementById("city").value = "";
  selectedCityName = "";
  selectedLat = null;
  selectedLng = null;
  resultDiv.classList.add("hidden");
  resultDiv.innerHTML = "";
  clearErrors();
  updateCoatingOptions();
  const hint = document.getElementById("widthHint");
  if (hint) hint.style.display = "none";
  document.getElementById("resetBtn").style.display = "none";
});

calculateBtn.addEventListener("click", async () => {
  clearErrors();
  if (!validateForm()) {
    const widthErr = widthInput.getAttribute("data-error");
    const errText = widthErr
      ? `⚠️ ${widthErr}`
      : "⚠️ Будь ласка, заповніть усі виділені поля.";
    widthInput.removeAttribute("data-error");
    showResult(`<p class="error-msg">${errText}</p>`, false);
    return;
  }

  const type      = gateTypeSelect.value;
  const modelIdx  = gateModelSelect.value;
  const config    = configSelect.value;
  const rawWidth  = widthInput.value.replace(",", ".");
  const width     = parseFloat(rawWidth);
  const coatingRaw= coatingSelect.value;
  const lock      = lockCheckbox.checked;
  const bolts     = document.getElementById("bolts").checked;
  const postVal   = postSelect.value;
  const postQty   = parseInt(document.getElementById("postQty").value) || 0;

  const model   = GATE_MODELS[type][modelIdx];
  let coating = 0;
  if (coatingRaw === "500wood" || coatingRaw.endsWith("_wood")) {
    coating = parseInt(coatingRaw);
  } else if (coatingRaw.endsWith("_двусторон")) {
    coating = parseInt(coatingRaw);
  } else {
    coating = parseInt(coatingRaw) || 0;
  }

  let gatePrice = calcGatePrice(type, model.price, config, width);
  gatePrice += coating;
  if (lock && type === "forged") gatePrice += LOCK_PRICE;
  if (bolts) gatePrice += BOLTS_PRICE;

  let postPrice = 0;
  let postInfo  = null;
  if (postVal !== "none") {
    postInfo  = POST_DATA[postVal];
    postPrice = postInfo.price * postQty;
  }

  calculateBtn.textContent = "⏳ Розраховуємо...";
  calculateBtn.disabled = true;
  showResult(`<p class="loading">⏳ Розраховуємо доставку...</p>`, false);

  let deliveryPrice  = null;
  let deliveryStatus = "";
  let meetOnRoad     = null;

  try {
    if (!selectedLat || !selectedLng) throw new Error("Місто не обрано зі списку підказок");

    const response = await fetch("https://n8n.verbadom.com.ua/webhook/cardinal-delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: selectedLat, lng: selectedLng, city: selectedCityName })
    });
    const data = await response.json();

    meetOnRoad = data.meetOnRoad || null;
    window._lastDeliveryData = data;

    if (data.status === "on_route") {
      deliveryStatus = "on_route";
    } else if (data.status === "deviation") {
      deliveryPrice  = data.price;
      deliveryStatus = "deviation";
    } else if (data.status === "nova_poshta") {
      deliveryPrice  = 4000;
      deliveryStatus = "nova_poshta";
    } else if (data.status === "clarify") {
      deliveryStatus = "clarify";
    }

  } catch (e) {
    deliveryStatus = "error";
  }

  calculateBtn.disabled = false;
  calculateBtn.textContent = "Розрахувати вартість";

  const showPosts = postVal !== "none" && deliveryStatus !== "nova_poshta";
  const totalPrice = gatePrice
    + (showPosts ? postPrice : 0)
    + (deliveryPrice || 0);

  const configLabels = {
    with_separate_wicket: "Брама + хвіртка окремо",
    without_wicket:       "Брама без хвіртки",
    with_builtin_wicket:  "Брама з хвірткою всередині (врізна)"
  };

  const coatingLabel = coatingSelect.options[coatingSelect.selectedIndex].text;
  const coatingLabelClean = coatingLabel.replace(" ⭐ обирають найчастіше", "").trim();
  const isPopularCoating = coatingLabel.includes("⭐");
  const showLockIncluded = type === "modern" && config === "with_separate_wicket";

  let html = `
    <h2>Результат розрахунку</h2>
    <p class="preliminary-note">⚠️ Попередній розрахунок. Точна ціна підтверджується менеджером.</p>
    <div class="result-section-title">Склад комплекту</div>
    <div class="result-row"><span>Модель</span><span>${model.name}</span></div>
    <div class="result-row"><span>Комплектація</span><span>${configLabels[config]}</span></div>
    <div class="result-row"><span>Ширина</span><span>${width} м</span></div>
    <div class="result-row"><span>Покриття</span><span>${coatingLabelClean}</span></div>
  `;

  if (isPopularCoating) {
    html += `<div class="result-row popular-badge-row"><span></span><span>⭐ Найпопулярніший вибір</span></div>`;
  }

  if (showLockIncluded) {
    html += `<div class="result-row"><span>Замок у хвіртку та тримач навісного замка</span><span style="color:#27ae60;">входять у вартість</span></div>`;
  }
  if (lock && type === "forged") {
    html += `<div class="result-row"><span>Замок у хвіртку з встановленням</span><span>+${LOCK_PRICE.toLocaleString("uk-UA")} грн</span></div>`;
  }
  if (bolts) {
    html += `<div class="result-row"><span>Засуви на створки (2 шт)</span><span>+${BOLTS_PRICE.toLocaleString("uk-UA")} грн</span></div>`;
  }

  if (showPosts) {
    html += `
      <div class="result-row">
        <span>Стовпи: ${postInfo.label}, ${postQty} шт × ${postInfo.price.toLocaleString("uk-UA")} грн</span>
        <span>${postPrice.toLocaleString("uk-UA")} грн</span>
      </div>
    `;
  }

  const totalComplex = gatePrice + (showPosts ? postPrice : 0);
  html += `<div class="result-row result-subtotal"><span>Ворота з комплектуючими</span><span>${totalComplex.toLocaleString("uk-UA")} грн</span></div>`;

  if (deliveryStatus === "on_route") {
    const minTotal = totalComplex + 500;
    const maxTotal = totalComplex + 900;
    html += `<div class="result-row"><span>Доставка</span><span>500–900 грн</span></div>`;
    html += `<p class="delivery-note-inline">Точна сума залежить від адреси доставки</p>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>від ${minTotal.toLocaleString("uk-UA")} до ${maxTotal.toLocaleString("uk-UA")} грн</span></div>`;
  } else if (deliveryStatus === "nova_poshta") {
    html += `<div class="result-row"><span>Доставка (Нова Пошта на вантажне відділення)</span><span>4 000 грн</span></div>`;
    if (postVal !== "none") {
      html += `<p class="error-msg">⚠️ Стовпи доставляються лише машиною заводу. При доставці Новою Поштою стовпи недоступні.</p>`;
    }
    html += `<div class="result-row total"><span>Разом до сплати</span><span>${totalPrice.toLocaleString("uk-UA")} грн</span></div>`;
  } else if (deliveryStatus === "deviation") {
    html += `<div class="result-row"><span>Доставка до вашого двору (${window._lastDeliveryData.zone})</span><span>${deliveryPrice.toLocaleString("uk-UA")} грн</span></div>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>${totalPrice.toLocaleString("uk-UA")} грн</span></div>`;
  } else if (deliveryStatus === "clarify") {
    html += `<div class="result-row"><span>Доставка</span><span class="clarify-badge">Уточнення у менеджера</span></div>`;
    html += `<p class="delivery-note">Відстань ${window._lastDeliveryData.distanceKm} км — можлива доставка машиною заводу, зазвичай вигідніше Нової Пошти і прямо до воріт</p>`;
  } else {
    html += `<div class="result-row"><span>Доставка</span><span>Уточніть у менеджера</span></div>`;
  }

  if (meetOnRoad && deliveryStatus !== "nova_poshta" && deliveryStatus !== "on_route") {
    html += `<div class="result-row alt-delivery-row"><span>💡 Альтернативна доставка: ${meetOnRoad.note}</span><span>${meetOnRoad.price} грн</span></div>`;
  }

  html += `
    <div class="contacts">
      📞 Зв'яжіться з нами:<br>
      <a href="tel:+380673990560">+38 (067) 399-05-60</a><br>
      <div class="messenger-btns">
        <a href="viber://chat?number=%2B380673990560" class="msg-btn viber">Viber</a>
        <a href="https://t.me/+380673990560" class="msg-btn telegram">Telegram</a>
        <a href="https://wa.me/380673990560" class="msg-btn whatsapp">WhatsApp</a>
      </div>
    </div>
    <p class="watermark">Розрахунок: <a href="https://verbadom.com.ua" target="_blank">verbadom.com.ua</a></p>
    <div class="promo-block">
      <div class="promo-text">Потрібен калькулятор для вашого бізнесу?</div>
      <a href="mailto:buildertools.pro@gmail.com" class="promo-link">buildertools.pro@gmail.com</a>
    </div>
  `;

  showResult(html, true);

  _lastCalcData = {
    city: selectedCityName,
    model: model.name,
    config: configLabels[config],
    width: width + " м",
    totalPrice: totalPrice > 0 ? totalPrice.toLocaleString("uk-UA") + " грн" : "уточнення",
  };
  _leadTracker.onCalculation(_lastCalcData);
  track('calculate', selectedCityName);
});

function showResult(html, showShareBtns) {
  resultDiv.innerHTML = html;
  resultDiv.classList.remove("hidden");

  resultDiv.querySelectorAll(".msg-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const messenger = this.classList.contains("viber") ? "Viber"
        : this.classList.contains("telegram") ? "Telegram"
        : "WhatsApp";
      _leadTracker.onMessengerClick(messenger, _lastCalcData);
      track('contact', selectedCityName);
    });
  });

  if (showShareBtns) {
    const btnBlock = document.createElement("div");
    btnBlock.className = "share-btns";
    const pdfBtn = document.createElement("button");
    pdfBtn.className = "share-btn pdf-btn";
    pdfBtn.innerHTML = "📄 Завантажити розрахунок PDF";
    pdfBtn.addEventListener("click", () => generatePDF());
    btnBlock.appendChild(pdfBtn);
    resultDiv.appendChild(btnBlock);
  }

  resultDiv.scrollIntoView({ behavior: "smooth" });
  document.getElementById("resetBtn").style.display = "block";
}

async function generatePDF() {
  track('pdf_download', selectedCityName);
  const { jsPDF } = window.jspdf;
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  const pdfDiv = document.createElement("div");
  pdfDiv.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: ${isMobile ? 420 : 595}px; background: #fff; padding: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1a1a2e; font-size: ${isMobile ? 11 : 13}px; line-height: 1.5;
  `;

  const now = new Date();
  const dateStr = now.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });

  const rows = document.querySelectorAll("#result .result-row");
  let rowsHTML = "";
  rows.forEach(row => {
    const spans = row.querySelectorAll("span");
    if (spans.length < 2) return;
    const label = spans[0].innerText.trim();
    const value = spans[spans.length - 1].innerText.trim();
    const isTotal    = row.classList.contains("total");
    const isSubtotal = row.classList.contains("result-subtotal");
    const isPopular  = row.classList.contains("popular-badge-row");

    const pad   = isMobile ? "7px 10px" : "10px 12px";
    const padSm = isMobile ? "5px 10px" : "8px 12px";

    if (isPopular) {
      rowsHTML += `<tr><td colspan="2" style="padding:${isMobile ? '2px 10px 6px' : '2px 12px 8px'};color:#b07800;font-size:${isMobile ? 10 : 11}px;">⭐ Найпопулярніший вибір</td></tr>`;
    } else if (isTotal) {
      rowsHTML += `<tr style="background:#1a2a5e;">
        <td style="padding:${pad};color:#fff;font-weight:700;font-size:${isMobile ? 13 : 15}px;">${label}</td>
        <td style="padding:${pad};color:#fff;font-weight:700;font-size:${isMobile ? 13 : 15}px;text-align:right;">${value}</td>
      </tr>`;
    } else if (isSubtotal) {
      rowsHTML += `<tr style="background:#eef2ff;">
        <td style="padding:${padSm};font-weight:600;color:#1a2a5e;">${label}</td>
        <td style="padding:${padSm};font-weight:600;color:#1a2a5e;text-align:right;">${value}</td>
      </tr>`;
    } else {
      rowsHTML += `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:${isMobile ? '5px 10px' : '7px 12px'};color:#444;">${label}</td>
        <td style="padding:${isMobile ? '5px 10px' : '7px 12px'};color:#1a2a5e;font-weight:600;text-align:right;">${value}</td>
      </tr>`;
    }
  });

  const delivNoteInline = document.querySelector("#result .delivery-note-inline");
  const delivNoteHTML = delivNoteInline
    ? `<p style="font-size:${isMobile ? 10 : 11}px;color:#555;margin:4px ${isMobile ? 10 : 12}px 8px;">${delivNoteInline.innerText}</p>`
    : "";

  const errMsg = document.querySelector("#result .error-msg");
  const errHTML = errMsg
    ? `<p style="font-size:${isMobile ? 10 : 11}px;color:#c0392b;margin:6px ${isMobile ? 10 : 12}px 0;">⚠️ ${errMsg.innerText.replace('⚠️','').trim()}</p>`
    : "";

  const p  = isMobile ? "14px 16px 12px" : "20px 24px 16px";
  const p2 = isMobile ? "10px 16px 6px"  : "14px 24px 8px";
  const p3 = isMobile ? "0 16px"         : "0 24px";
  const p4 = isMobile ? "8px 16px"       : "12px 24px";
  const p5 = isMobile ? "0 16px 16px"    : "0 24px 24px";

  pdfDiv.innerHTML = `
    <div style="border-top:4px solid #1a2a5e;padding:${p};border-bottom:1px solid #e8ecf4;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:${isMobile ? 17 : 22}px;font-weight:900;color:#1a2a5e;letter-spacing:2px;">VERBADOM</div>
          <div style="font-size:${isMobile ? 10 : 11}px;color:#888;margin-top:2px;">Рішення для воріт, парканів та будинку</div>
          <div style="font-size:${isMobile ? 10 : 11}px;color:#888;">verbadom.com.ua</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:${isMobile ? 10 : 11}px;color:#888;">Розрахунок від</div>
          <div style="font-size:${isMobile ? 12 : 13}px;font-weight:600;color:#1a2a5e;">${dateStr}</div>
          <div style="font-size:${isMobile ? 10 : 11}px;color:#888;margin-top:3px;">+38 (067) 399-05-60</div>
        </div>
      </div>
    </div>
    <div style="padding:${p2};">
      <div style="font-size:${isMobile ? 13 : 16}px;font-weight:700;color:#1a2a5e;">Попередній розрахунок вартості воріт</div>
    </div>
    <div style="padding:${p3};">
      <table style="width:100%;border-collapse:collapse;font-size:${isMobile ? 11 : 13}px;">
        ${rowsHTML}
      </table>
      ${delivNoteHTML}
      ${errHTML}
    </div>
    <div style="margin:${p4};padding:7px 10px;background:#fff8e1;border-radius:6px;border-left:3px solid #f0a030;">
      <span style="font-size:${isMobile ? 10 : 11}px;color:#b07a00;">⚠️ Попередній розрахунок. Точна ціна підтверджується менеджером.</span>
    </div>
    <div style="margin:${p5};padding:${isMobile ? '10px 12px' : '14px 16px'};background:#f4f6fb;border-radius:8px;border:1px solid #e0e6f0;">
      <div style="font-size:${isMobile ? 11 : 12}px;font-weight:700;color:#1a2a5e;margin-bottom:8px;">Зв'яжіться з нами:</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-size:${isMobile ? 12 : 13}px;font-weight:700;color:#1a2a5e;">📞 +38 (067) 399-05-60</div>
        <a href="viber://chat?number=%2B380673990560" style="display:inline-block;padding:5px 12px;background:#7360f2;color:#fff;border-radius:20px;text-decoration:none;font-size:${isMobile ? 10 : 11}px;font-weight:600;">Viber</a>
        <a href="https://t.me/+380673990560" style="display:inline-block;padding:5px 12px;background:#2aabee;color:#fff;border-radius:20px;text-decoration:none;font-size:${isMobile ? 10 : 11}px;font-weight:600;">Telegram</a>
      </div>
    </div>
    <div style="border-top:1px solid #eee;padding:8px ${isMobile ? 16 : 24}px;text-align:right;">
      <span style="font-size:${isMobile ? 9 : 10}px;color:#bbb;">Розрахунок: verbadom.com.ua</span>
    </div>
  `;

  document.body.appendChild(pdfDiv);

  try {
    const canvas = await html2canvas(pdfDiv, { scale: 4, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pageW = 100;
    const pageH = (canvas.height * pageW) / canvas.width;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageW, pageH] });
    doc.addImage(imgData, "PNG", 0, 0, pageW, pageH);

    const filename = `Ворота_Verbadom_${dateStr.replace(/\./g, "-")}.pdf`;
    const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (navigator.share && isMobileDevice) {
      const blob = doc.output("blob");
      const file = new File([blob], filename, { type: "application/pdf" });
      try {
        await navigator.share({ files: [file], title: "Розрахунок воріт — Verbadom" });
      } catch (e) {
        doc.save(filename);
      }
    } else {
      doc.save(filename);
    }
  } finally {
    document.body.removeChild(pdfDiv);
  }
}

// Аналітика
function getUserId() {
  let id = localStorage.getItem('vb_uid');
  if (!id) {
    id = 'u' + Date.now() + Math.random().toString(36).slice(2,6);
    localStorage.setItem('vb_uid', id);
  }
  return id;
}

const USER_ID = getUserId();
const ANALYTICS_URL = 'https://n8n.verbadom.com.ua/webhook/analytics';

function track(eventName, city) {
  if (IS_TEST) return;
  fetch(ANALYTICS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id:   USER_ID,
      event:     eventName,
      timestamp: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().replace("Z", "+03:00"),
      city:      city || ''
    })
  }).catch(() => {});
}

track('page_view');
