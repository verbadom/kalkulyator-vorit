/* ============================================================
   CARDINAL CALCULATOR v2 — app.js
   ============================================================ */

const IS_TEST = new URLSearchParams(window.location.search).get('mode') === 'test';
const BASE_IMG = "https://images.prom.ua/";

/* ============================================================
   LEAD TRACKER
   ============================================================ */
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

/* ============================================================
   ДИНАМІЧНІ ЦІНИ З ТАБЛИЦІ
   ============================================================ */
let LOCK_PRICE          = 1500;
let BOLTS_PRICE         = 600;
let HINGE_PRICE_PER_UNIT= 150;

let POST_DATA = [
  { key: "1", name: "Нефарбований 80×60", chars: "2 мм стінка", height: "3.0 м", price: 775,  painted: false },
  { key: "2", name: "Нефарбований 80×80", chars: "3 мм стінка", height: "3.0 м", price: 1120, painted: false },
  { key: "3", name: "Фарбований 60×60",   chars: "2 мм стінка", height: "2.0 м", price: 750,  painted: true  },
  { key: "4", name: "Фарбований 80×80",   chars: "3 мм стінка", height: "2.0 м", price: 1300, painted: true  },
  { key: "5", name: "Фарбований 60×60",   chars: "2 мм стінка", height: "2.4 м", price: 1000, painted: true  },
  { key: "6", name: "Фарбований 80×80",   chars: "3 мм стінка", height: "2.4 м", price: 1600, painted: true  },
];

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

    if (prices.lockPrice)           LOCK_PRICE           = prices.lockPrice;
    if (prices.boltsPrice)          BOLTS_PRICE          = prices.boltsPrice;
    if (prices.hingePricePerUnit)   HINGE_PRICE_PER_UNIT = prices.hingePricePerUnit;

    if (prices.posts && prices.posts.length > 0) {
      POST_DATA = prices.posts.map((p, i) => ({
        key: String(i + 1),
        name: p.name,
        chars: p.chars,
        height: p.height,
        price: p.price,
        painted: !p.name.toLowerCase().includes('нефарб') && !p.name.toLowerCase().includes('некраш'),
      }));
    }

    if (prices.coatings && prices.coatings.length > 0) {
      window._COATINGS = prices.coatings.map(c => ({
        ...c,
        name: c.name ? c.name.replace(/⭐/g, '').trim() : c.name
      }));
    }

    const boltLabel = document.getElementById('boltsPriceLabel');
    if (boltLabel) boltLabel.textContent = BOLTS_PRICE.toLocaleString('uk-UA');

    console.log("✅ Ціни завантажено", { LOCK_PRICE, BOLTS_PRICE, HINGE_PRICE_PER_UNIT });
  } catch (e) {
    console.warn("⚠️ Резервні ціни");
  }
}

/* ============================================================
   МОДЕЛІ ВОРІТ
   ============================================================ */
const GATE_MODELS = {
  forged: [
    { name: "Стандарт",               price: 16500, img: "6556444322_kovani-rozpashni-vorota.jpg" },
    { name: "Стандарт (Полоса)",       price: 16500, img: "6725089051_kovani-rozpashni-vorota.jpg" },
    { name: "Стандарт 2",             price: 16500, img: "6556444631_kovani-rozpashni-vorota.jpg" },
    { name: "Стандарт 3",             price: 17500, img: "6556445150_kovani-rozpashni-vorota.jpg" },
    { name: "№2",                     price: 19900, img: "6556446957_kovani-rozpashni-vorota.jpg" },
    { name: "№3",                     price: 18500, img: "6556447183_kovani-rozpashni-vorota.jpg" },
    { name: "№4",                     price: 18100, img: "6556445475_kovani-rozpashni-vorota.jpg" },
    { name: "№5",                     price: 19500, img: "6556445762_kovani-rozpashni-vorota.jpg" },
    { name: "№6 (Без металу)",        price: 23800, img: "6556446086_kovani-rozpashni-vorota.jpg", noCoating: true },
    { name: "№6 (З металом)",         price: 24100, img: "6556446262_kovani-rozpashni-vorota.jpg" },
    { name: "№7",                     price: 23800, img: "6556446468_kovani-rozpashni-vorota.jpg", noCoating: true },
    { name: "№8",                     price: 20500, img: "7180549778_kovani-rozpashni-vorota.jpg" },
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

/* ============================================================
   СТАН ФОРМИ
   ============================================================ */
let selectedType     = "";
let selectedModelIdx = null;
let selectedConfig   = "";
let selectedCoating  = null;
let boltsChecked     = false;
let hingesChecked    = false;
let selectedPostKey  = null;
let postQty          = 2;
let selectedCityName = "";
let selectedLat      = null;
let selectedLng      = null;
let _acDebounce      = null;
let _acActiveIndex   = -1;
let selectedDeliveryChoice = null;
let deliveryFirstData = null;

/* ============================================================
   ПРОГРЕСИВНЕ РОЗКРИТТЯ
   ============================================================ */
function showField(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden-field');
}

function hideField(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden-field');
}

/* ============================================================
   ТИП ВОРІТ
   ============================================================ */
function selectGateType(type) {
  selectedType     = type;
  selectedModelIdx = null;
  selectedConfig   = "";
  selectedCoating  = null;
  boltsChecked     = false;
  hingesChecked    = false;
  selectedPostKey  = null;
  postQty          = 2;

  document.getElementById('btnForged').classList.toggle('active', type === 'forged');
  document.getElementById('btnModern').classList.toggle('active', type === 'modern');

  document.getElementById('includedBlock').style.display = 'none';

  const gallery = document.getElementById('modelGallery');
  gallery.innerHTML = '';
  GATE_MODELS[type].forEach((model, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'model-card';
    card.dataset.modelIndex = String(i);
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => selectModel(i));

    const image = document.createElement('img');
    image.className = 'model-card__image';
    image.src = BASE_IMG + model.img;
    image.alt = 'Ворота ' + model.name;
    image.loading = 'lazy';
    image.decoding = 'async';

    const name = document.createElement('span');
    name.className = 'model-card__name';
    name.textContent = model.name;

    const selected = document.createElement('span');
    selected.className = 'model-card__selected';
    selected.textContent = '✓ Обрано';

    card.append(image, name, selected);
    gallery.appendChild(card);
  });

  showField('fieldGateModel');

  hideField('fieldConfig');
  hideField('fieldWidth');
  hideField('fieldCoating');
  document.getElementById('fieldLock').innerHTML = '';
  hideField('fieldBolts');
  hideField('fieldPosts');
  resetRadioGroup('configGroup');
  resetPostSteps();
  document.getElementById('postQtyWrap').style.display = 'none';
  document.getElementById('fieldHinges').style.display = 'none';

  clearErrors();
  checkReadyMsg();
}

/* ============================================================
   ВИБІР МОДЕЛІ
   ============================================================ */
function selectModel(idx) {
  selectedModelIdx = idx;

  document.querySelectorAll('#modelGallery .model-card').forEach(card => {
    const isSelected = Number(card.dataset.modelIndex) === idx;
    card.classList.toggle('selected', isSelected);
    card.classList.remove('field-error');
    card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });

  const incl = document.getElementById('includedBlock');
  incl.innerHTML = '';
  incl.style.display = 'none';

  showField('fieldConfig');
  showField('fieldWidth');
  showField('fieldCoating');
  showField('fieldBolts');
  hideField('fieldPosts');

  buildCoatingOptions();
  buildLockField();

  checkReadyMsg();
}

/* ============================================================
   "У ВАРТІСТЬ ВХОДИТЬ"
   ============================================================ */
function buildIncludedText(type, config) {
  if (type === 'forged') {
    if (config === 'without_wicket') {
      return '✅ <strong>У вартість вже входить:</strong> Петлі на ворота · Тримач навісного замка';
    }
    return '✅ <strong>У вартість вже входить:</strong> Петлі на ворота та хвіртку · Тримач навісного замка';
  }
  if (type === 'modern') {
    if (config === 'without_wicket') {
      return '✅ <strong>У вартість вже входить:</strong> Петлі на ворота · Тримач навісного замка';
    }
    if (config === 'with_builtin_wicket') {
      return '✅ <strong>У вартість вже входить:</strong> Врізний механічний замок · Ручки з обох боків хвіртки · Петлі · Тримач навісного замка';
    }
    return '✅ <strong>У вартість вже входить:</strong> Врізний механічний замок · Ручки з обох боків хвіртки · Петлі · Тримач навісного замка';
  }
  return '';
}

/* ============================================================
   RADIO-ГРУПА
   ============================================================ */
function selectRadio(groupId, el, stateVar) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected', 'field-error'));
  el.classList.add('selected');

  if (stateVar === 'selectedConfig') {
    selectedConfig = el.dataset.value;

    if (selectedModelIdx !== null) {
      const incl = document.getElementById('includedBlock');
      incl.innerHTML = buildIncludedText(selectedType, selectedConfig);
      incl.style.display = 'block';
    }

    updateWidthHint();
    buildLockField();
  }

  clearErrors();
  checkReadyMsg();
}

function resetRadioGroup(groupId) {
  const group = document.getElementById(groupId);
  if (group) group.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected', 'field-error'));
}

/* ============================================================
   ПІДКАЗКА ШИРИНА
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const widthInput = document.getElementById('width');
  if (widthInput) {
    widthInput.addEventListener('input', updateWidthHint);
  }
});

function updateWidthHint() {
  const hint = document.getElementById('widthHint');
  const separator = document.getElementById('widthHintSeparator');
  if (!hint) return;

  hint.style.display = 'none';
  hint.innerHTML = '';
  if (separator) separator.style.display = 'none';

  if (!selectedType || !selectedConfig || selectedConfig === 'with_builtin_wicket') return;

  const rawW = document.getElementById('width').value.replace(',', '.').trim();
  if (!rawW) return;
  const width = parseFloat(rawW);
  if (isNaN(width)) return;

  let msg = '';
  if (selectedConfig === 'with_separate_wicket') {
    msg = selectedType === 'forged'
      ? 'Якщо розмір ще не визначено — ширина 4,5 м (ворота 3,6 м + хвіртка 0,9 м) зазвичай найвигідніша'
      : 'Якщо розмір ще не визначено — ширина 4,9 м (ворота 4,0 м + хвіртка 0,9 м) зазвичай найвигідніша';
  } else if (selectedConfig === 'without_wicket') {
    msg = selectedType === 'forged'
      ? 'Якщо розмір ще не визначено — ширина 3,6 м зазвичай найвигідніша'
      : 'Якщо розмір ще не визначено — ширина 4,0 м зазвичай найвигідніша';
  }

  if (msg) {
    hint.innerHTML = `<span style="font-size:14px;color:#2E9B3F;margin-right:6px;">★</span>${msg}`;
    hint.style.display = 'block';
    if (separator) separator.style.display = 'block';
  }
}

/* ============================================================
   ПОКРИТТЯ
   ============================================================ */
function buildCoatingOptions() {
  const group = document.getElementById('coatingGroup');
  group.innerHTML = '';
  selectedCoating = null;

  if (selectedModelIdx === null) return;
  const model = GATE_MODELS[selectedType][selectedModelIdx];
  const c = window._COATINGS || [];

  const matoviy   = c.find(x => x.name && x.name.toLowerCase().includes('матов') && !x.name.toLowerCase().includes('двусторон') && !x.name.toLowerCase().includes('двосторон')) || { surcharge: 300 };
  const dvustoron = c.find(x => x.name && (x.name.toLowerCase().includes('двусторон') || x.name.toLowerCase().includes('двосторон'))) || { surcharge: 500 };
  const derevo    = c.find(x => x.name && x.name.toLowerCase().includes('дерево')) || { surcharge: 500 };

  let options = [];

  if (selectedType === 'forged') {
    if (model.noCoating) {
      options = [{ value: 0, label: 'Без профнастилу — тільки ковані елементи', surcharge: 0, fixed: true }];
    } else {
      options = [
        { value: 0,                   label: 'Базовий — глянець',                                        surcharge: 0 },
        { value: matoviy.surcharge,   label: `Матовий з одного боку +${matoviy.surcharge} грн`,          surcharge: matoviy.surcharge },
        { value: dvustoron.surcharge, label: `Матовий з обох боків +${dvustoron.surcharge} грн`,         surcharge: dvustoron.surcharge, badge: '⭐ Обирають найчастіше' },
        { value: derevo.surcharge,    label: `Під дерево (з одного боку) +${derevo.surcharge} грн`,      surcharge: derevo.surcharge },
      ];
    }
  }

  if (selectedType === 'modern') {
    if (model.note === 'двосторонній у базі') {
      options = [{ value: 0, label: 'Матовий двосторонній 0,45 мм — входить у вартість', surcharge: 0, fixed: true }];
    } else if (model.doubleSided) {
      options = [
        { value: 0,                   label: 'Базовий — матовий односторонній',                     surcharge: 0 },
        { value: dvustoron.surcharge, label: `Матовий з обох боків +${dvustoron.surcharge} грн`,   surcharge: dvustoron.surcharge, badge: '⭐ Обирають найчастіше' },
      ];
    } else {
      options = [{ value: 0, label: 'Матовий кольоровий — входить у вартість', surcharge: 0, fixed: true }];
    }
  }

  options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'radio-option';
    div.dataset.idx = i;

    const badge = opt.badge ? `<span class="radio-badge"><span class="badge-star">⭐</span> Обирають найчастіше</span>` : '';

    div.innerHTML = `
      <div class="radio-dot"></div>
      <div class="radio-text">
        ${opt.label}
        ${badge}
      </div>
    `;

    if (opt.fixed) {
      div.classList.add('selected');
      selectedCoating = opt;
    }

    div.addEventListener('click', () => {
      group.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected', 'field-error'));
      div.classList.add('selected');
      selectedCoating = opt;
      checkReadyMsg();
    });

    group.appendChild(div);
  });

  if (options.length === 1 && options[0].fixed) {
    selectedCoating = options[0];
  }

  checkReadyMsg();
}

/* ============================================================
   ЗАМОК
   ============================================================ */
function buildLockField() {
  const field = document.getElementById('fieldLock');
  field.innerHTML = '';

  if (selectedType === 'forged') {
    if (selectedConfig === 'without_wicket') {
      field.innerHTML = '';
      return;
    }
    field.innerHTML = `
      <div class="checkbox-option" id="lockOption" onclick="toggleCheckbox('lockOption', 'lockChecked')">
        <div class="checkbox-box"></div>
        <div class="checkbox-text">
          Замок у хвіртку з встановленням
          <span class="checkbox-sub">Тільки для кованих воріт · +${LOCK_PRICE.toLocaleString('uk-UA')} грн</span>
        </div>
      </div>
    `;
  } else if (selectedType === 'modern') {
    if (selectedConfig === 'without_wicket') {
      field.innerHTML = '';
      return;
    }
    field.innerHTML = `
      <div class="lock-included-note">
        Врізний механічний замок і ручки з обох боків хвіртки вже включені у вартість
      </div>
    `;
  }
}

/* ============================================================
   ЧЕКБОКСИ
   ============================================================ */
function toggleCheckbox(optionId, stateVar) {
  const el = document.getElementById(optionId);
  if (!el) return;
  const isChecked = el.classList.toggle('checked');

  if (stateVar === 'boltsChecked')  boltsChecked  = isChecked;
  if (stateVar === 'hingesChecked') hingesChecked = isChecked;
}

/* ============================================================
   СТОВПИ — ПОКРОКОВИЙ ВИБІР
   ============================================================ */
let _postType   = null;
let _postHeight = null;

function resetPostSteps() {
  _postType      = null;
  _postHeight    = null;
  selectedPostKey= null;

  document.querySelectorAll('#postStep1 .step-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('postStep2').style.display = 'none';
  document.getElementById('postStep2').innerHTML = '';
  document.getElementById('postStep3').style.display = 'none';
  document.getElementById('postStep3').innerHTML = '';
  document.getElementById('postQtyWrap').style.display = 'none';
  document.getElementById('fieldHinges').style.display = 'none';
  hingesChecked = false;
  const ho = document.getElementById('hingesOption');
  if (ho) ho.classList.remove('checked');
}

function selectPostType(type) {
  _postType = type;
  _postHeight = null;
  selectedPostKey = null;

  document.querySelectorAll('#postStep1 .step-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  document.getElementById('postStep2').style.display = 'none';
  document.getElementById('postStep2').innerHTML = '';
  document.getElementById('postStep3').style.display = 'none';
  document.getElementById('postStep3').innerHTML = '';
  document.getElementById('postQtyWrap').style.display = 'none';
  document.getElementById('fieldHinges').style.display = 'none';
  hingesChecked = false;
  const ho = document.getElementById('hingesOption');
  if (ho) ho.classList.remove('checked');

  if (type === 'none') {
    document.getElementById('postQtyWrap').style.display = 'none';
    document.getElementById('fieldHinges').style.display = 'none';
    return;
  }

  if (type === 'unpainted') {
    const unpainted = POST_DATA.filter(p => !p.painted);
    renderPostCards('postStep2', unpainted);
    document.getElementById('postStep2').style.display = 'block';
  }

  if (type === 'painted') {
    renderPostHeightStep('postStep2');
    document.getElementById('postStep2').style.display = 'block';
  }
}

function renderPostHeightStep(stepId) {
  const step = document.getElementById(stepId);
  step.innerHTML = `
    <div class="posts-step" style="margin-top:10px;">
      <div class="step-btns">
        <button class="step-btn" onclick="selectPostHeight('2.0м')">2,0 м</button>
        <button class="step-btn" onclick="selectPostHeight('2.4м')">2,4 м</button>
      </div>
    </div>
  `;
}

function selectPostHeight(height) {
  _postHeight = height;

  document.getElementById('postStep3').style.display = 'none';
  document.getElementById('postStep3').innerHTML = '';
  document.getElementById('postQtyWrap').style.display = 'none';
  document.getElementById('fieldHinges').style.display = 'none';
  selectedPostKey = null;

  document.querySelectorAll('#postStep2 .step-btn').forEach(b => {
    b.classList.remove('active');
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(height)) {
      b.classList.add('active');
    }
  });

  const heightWithSpace = height.replace('м', ' м');
  const filtered = POST_DATA.filter(p => p.painted && p.height === heightWithSpace);
  renderPostCards('postStep3', filtered);
  document.getElementById('postStep3').style.display = 'block';
}

function renderPostCards(stepId, posts) {
  const step = document.getElementById(stepId);
  step.innerHTML = `
    <div class="posts-step" style="margin-top:10px;">
      <div class="step-btns">
        ${posts.map(p => `
          <button class="step-btn" onclick="selectPostFinal('${p.key}')">
            ${p.name.replace('Нефарбований ', '').replace('Фарбований ', '').replace('Некрашеный ', '').replace('Крашеный ', '')}
            <span class="step-btn-sub">${p.chars} · висота ${p.height} · ${p.price.toLocaleString('uk-UA')} грн</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function selectPostFinal(key) {
  selectedPostKey = key;

  document.querySelectorAll('#postStep2 .step-btn, #postStep3 .step-btn').forEach(b => {
    const onc = b.getAttribute('onclick') || '';
    if (onc.startsWith('selectPostFinal')) {
      b.classList.remove('active');
      if (onc.includes(`'${key}'`)) b.classList.add('active');
    }
  });

  document.getElementById('postQtyWrap').style.display = 'flex';

  const post = POST_DATA.find(p => p.key === key);
  const fieldHinges = document.getElementById('fieldHinges');
  const hingesOption = document.getElementById('hingesOption');
  if (post && fieldHinges && hingesOption) {
    const subText = post.painted
      ? 'Заводська зварка + порошкове фарбування разом зі стовпами · +150 грн/шт'
      : 'Заводська зварка · +150 грн/шт';
    hingesOption.querySelector('.checkbox-sub').textContent = subText;
    fieldHinges.style.display = 'block';
  }
}

function changeQty(delta) {
  postQty = Math.max(1, Math.min(5, postQty + delta));
  document.getElementById('postQtyVal').textContent = postQty;
}

/* ============================================================
   МІСТО — АВТОДОПОВНЕННЯ
   ============================================================ */
window.initGoogleAutocomplete = function () {
  const input    = document.getElementById('city');
  const dropdown = document.getElementById('city-dropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', function () {
    selectedLat = null;
    selectedLng = null;
    selectedCityName = '';
    input.classList.remove('has-selection');
    resetDeliveryFirstResult();
    clearTimeout(_acDebounce);
    const q = input.value.trim();
    if (q.length < 2) { acClose(); return; }
    _acDebounce = setTimeout(() => acFetch(q), 350);
  });

  input.addEventListener('keydown', function (e) {
    const items = dropdown.querySelectorAll('.city-option');
    if (dropdown.style.display === 'none' || !items.length) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); acSetActive(Math.min(_acActiveIndex + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); acSetActive(Math.max(_acActiveIndex - 1, 0)); }
    else if (e.key === 'Enter' && _acActiveIndex >= 0) { e.preventDefault(); items[_acActiveIndex].click(); }
    else if (e.key === 'Escape') { acClose(); }
  });

  document.addEventListener('click', function (e) {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) acClose();
  });
};

async function acFetch(q) {
  try {
    const { AutocompleteSuggestion } = await google.maps.importLibrary('places');
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: q,
      includedPrimaryTypes: ['locality', 'administrative_area_level_3'],
      includedRegionCodes: ['ua'],
      language: 'uk',
    });
    const filtered = (suggestions || []).filter(s => {
      const main = s.placePrediction.mainText ? s.placePrediction.mainText.toString() : '';
      return main.length > 0 && !main.toLowerCase().includes('область') && !main.toLowerCase().includes('район');
    });
    acRender(filtered);
  } catch (e) { acClose(); }
}

function acRender(suggestions) {
  const dropdown = document.getElementById('city-dropdown');
  _acActiveIndex = -1;
  dropdown.innerHTML = '';
  if (!suggestions || !suggestions.length) { acClose(); return; }
  suggestions.forEach(function (s, i) {
    const p         = s.placePrediction;
    const main      = p.mainText ? p.mainText.toString() : '';
    const secondary = p.secondaryText ? p.secondaryText.toString().replace(/, Україна$/, '') : '';
    const div       = document.createElement('div');
    div.className   = 'city-option';
    div.innerHTML   =
      '<div class="city-option-main">' + main + '</div>' +
      (secondary ? '<div class="city-option-sub">' + secondary + '</div>' : '');
    div.addEventListener('mouseenter', () => acSetActive(i));
    div.addEventListener('click', () => acSelect(p, main, secondary));
    dropdown.appendChild(div);
  });
  dropdown.style.display = 'block';
}

async function acSelect(placePrediction, main, sub) {
  const input = document.getElementById('city');
  const label = sub ? main + ', ' + sub : main;
  input.value      = label;
  selectedCityName = label;
  input.classList.add('has-selection');
  acClose();
  try {
    const place = placePrediction.toPlace();
    await place.fetchFields({ fields: ['location'] });
    selectedLat = place.location.lat();
    selectedLng = place.location.lng();
    clearError('city');
    checkReadyMsg();
  } catch (e) {}
}

function acSetActive(idx) {
  const dropdown = document.getElementById('city-dropdown');
  const items    = dropdown.querySelectorAll('.city-option');
  items.forEach(el => el.classList.remove('active'));
  _acActiveIndex = idx;
  if (idx >= 0 && idx < items.length) items[idx].classList.add('active');
}

function acClose() {
  const dropdown = document.getElementById('city-dropdown');
  if (dropdown) dropdown.style.display = 'none';
  _acActiveIndex = -1;
}


/* ============================================================
   ТЕСТОВИЙ СЦЕНАРІЙ: СПОЧАТКУ ДОСТАВКА
   ============================================================ */
function escapeDeliveryText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resetDeliveryFirstResult() {
  selectedDeliveryChoice = null;
  deliveryFirstData = null;
  window._lastDeliveryData = null;

  const result = document.getElementById('deliveryFirstResult');
  if (result) {
    result.classList.add('hidden');
    result.innerHTML = '';
  }

  const gateFlow = document.getElementById('gateCalculatorFlow');
  if (gateFlow) gateFlow.classList.add('gate-flow--hidden');

  const finalResult = document.getElementById('result');
  if (finalResult) {
    finalResult.classList.add('hidden');
    finalResult.innerHTML = '';
  }
}

function deliveryOption(mode, title, description, priceLabel, price, status) {
  return { mode, title, description, priceLabel, price, status };
}

function buildDeliveryFirstOptions(data) {
  const options = [];
  const isKyiv = selectedCityName.toLowerCase().includes('київ') ||
    selectedCityName.toLowerCase().includes('киев');

  if (data.status === 'on_route') {
    options.push(deliveryOption(
      'address',
      'Адресна доставка до вашого дому',
      '',
      isKyiv ? '900 грн' : '500–900 грн',
      isKyiv ? 900 : null,
      'on_route'
    ));
  }

  if (data.status === 'deviation') {
    options.push(deliveryOption(
      'address',
      'Адресна доставка до вашого дому',
      '',
      Number(data.price).toLocaleString('uk-UA') + ' грн',
      Number(data.price),
      'deviation'
    ));
  }

  if (data.status === 'clarify' || data.status === 'clarify_extended') {
    options.push(deliveryOption(
      'clarify',
      'Адресна доставка до вашого дому',
      '',
      'Потребує уточнення',
      null,
      data.status
    ));
  }

  if (data.status === 'nova_poshta' || data.status === 'clarify' || data.status === 'clarify_extended') {
    const novaPrice = Number(data.novaPoshtaPrice || 4000);
    options.push(deliveryOption(
      'nova_poshta',
      'Нова Пошта',
      '',
      novaPrice.toLocaleString('uk-UA') + ' грн',
      novaPrice,
      'nova_poshta'
    ));
  }

  return options;
}

function renderDeliveryFirstResult(data) {
  const result = document.getElementById('deliveryFirstResult');
  const options = buildDeliveryFirstOptions(data);
  window._deliveryFirstOptions = options;

  if (!options.length) {
    result.innerHTML = '<p class="error-msg">Не вдалося визначити вартість доставки. Спробуйте ще раз або зверніться до менеджера.</p>';
    result.classList.remove('hidden');
    return;
  }

  const city = escapeDeliveryText(selectedCityName.split(',')[0].trim());
  const optionHtml = options.map(function (option) {
    const descriptionHtml = option.description
      ? '<small>' + escapeDeliveryText(option.description) + '</small>'
      : '';
    return '<button type="button" class="delivery-option-card" data-mode="' + escapeDeliveryText(option.mode) +
      '" onclick="selectDeliveryFirstOption(\'' + escapeDeliveryText(option.mode) + '\')">' +
      '<span class="delivery-option-radio" aria-hidden="true"></span>' +
      '<span class="delivery-option-copy"><strong>' + escapeDeliveryText(option.title) + '</strong>' +
      descriptionHtml + '</span>' +
      '<span class="delivery-option-price">' + escapeDeliveryText(option.priceLabel) + '</span></button>';
  }).join('');

  result.innerHTML =
    '<div class="delivery-first-result-title">Доставка у ' + city + '</div>' +
    '<p class="delivery-first-result-note">Оберіть зручний варіант:</p>' +
    '<div class="delivery-option-list">' + optionHtml + '</div>' +
    '<button id="continueToGatesBtn" type="button" class="continue-to-gates-btn" ' +
    'onclick="proceedToGateCalculator()" disabled>' +
    'Перейти до вибору воріт</button>';

  result.classList.remove('hidden');
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectDeliveryFirstOption(mode) {
  const options = window._deliveryFirstOptions || [];
  const option = options.find(item => item.mode === mode);
  if (!option) return;

  selectedDeliveryChoice = option;

  hideField('fieldPosts');
  resetPostSteps();
  const calculateBtn = document.getElementById('calculateBtn');
  if (calculateBtn) calculateBtn.textContent = 'Показати загальну вартість';

  const finalResult = document.getElementById('result');
  if (finalResult) {
    finalResult.classList.add('hidden');
    finalResult.innerHTML = '';
  }

  document.querySelectorAll('.delivery-option-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.mode === mode);
  });

  const continueBtn = document.getElementById('continueToGatesBtn');
  if (continueBtn) continueBtn.disabled = false;
}

function proceedToGateCalculator() {
  if (!selectedDeliveryChoice) return;
  const gateFlow = document.getElementById('gateCalculatorFlow');
  gateFlow.classList.remove('gate-flow--hidden');
  gateFlow.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeDeliverySelection() {
  const card = document.getElementById('deliveryFirstCard');
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function isFactoryAddressDelivery() {
  return Boolean(
    selectedDeliveryChoice &&
    selectedDeliveryChoice.mode === 'address' &&
    (selectedDeliveryChoice.status === 'on_route' || selectedDeliveryChoice.status === 'deviation')
  );
}

function offerPostsAfterCalculation() {
  if (!isFactoryAddressDelivery()) return;
  showField('fieldPosts');
  const calculateBtn = document.getElementById('calculateBtn');
  if (calculateBtn) calculateBtn.textContent = 'Перерахувати загальну вартість';
  const postsField = document.getElementById('fieldPosts');
  if (postsField) postsField.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.getElementById('deliveryCalculateBtn').addEventListener('click', async () => {
  clearError('city');
  if (!selectedLat || !selectedLng || !selectedCityName) {
    setError('city');
    const result = document.getElementById('deliveryFirstResult');
    result.innerHTML = '<p class="error-msg">Оберіть населений пункт зі списку, щоб ми правильно визначили відстань.</p>';
    result.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('deliveryCalculateBtn');
  const result = document.getElementById('deliveryFirstResult');
  resetDeliveryFirstResult();
  btn.disabled = true;
  btn.textContent = 'Розраховуємо...';
  result.innerHTML = '<p class="loading">⏳ Перевіряємо маршрут і доступні способи доставки...</p>';
  result.classList.remove('hidden');

  try {
    const response = await fetch('https://n8n.verbadom.com.ua/webhook/cardinal-delivery-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: selectedLat, lng: selectedLng, city: selectedCityName })
    });
    if (!response.ok) throw new Error('delivery request failed');
    const data = await response.json();
    deliveryFirstData = data;
    window._lastDeliveryData = data;
    selectedDeliveryChoice = null;
    renderDeliveryFirstResult(data);
  } catch (e) {
    result.innerHTML = '<p class="error-msg">Не вдалося розрахувати доставку. Перевірте інтернет-з’єднання та спробуйте ще раз.</p>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Розрахувати доставку';
  }
});


/* ============================================================
   ПЕРЕВІРКА "ГОТОВО"
   ============================================================ */
function checkReadyMsg() {
  const msg = document.getElementById('calcReadyMsg');
  if (!msg) return;
  const ready = selectedType && selectedModelIdx !== null && selectedConfig && selectedCoating !== null && selectedLat && selectedLng && isWidthValid();
  msg.style.display = ready ? 'block' : 'none';
}

function isWidthValid() {
  const raw = document.getElementById('width');
  if (!raw) return false;
  const w = parseFloat(raw.value.replace(',', '.'));
  return !isNaN(w) && w >= 2.5 && w <= 6;
}

/* ============================================================
   ФОРМУЛА РОЗРАХУНКУ ЦІНИ
   ============================================================ */
function calcGatePrice(type, price, config, width) {
  const std = type === 'forged' ? 4.5 : 4.9;
  let gatePrice = 0;

  if (type === 'forged') {
    if (config === 'with_separate_wicket') {
      if (width < std)        gatePrice = price + 675;
      else if (width === std) gatePrice = price;
      else                    gatePrice = Math.round((price / 4.5 + 200) * width);
    } else if (config === 'without_wicket') {
      gatePrice = Math.round((price / 4.5 + 338) * width);
    } else if (config === 'with_builtin_wicket') {
      gatePrice = Math.round(price * 0.27778 * width);
    }
  }

  if (type === 'modern') {
    if (config === 'with_separate_wicket') {
      if (width < std)        gatePrice = Math.round((price / 4.9 + 150) * 4.5);
      else if (width === std) gatePrice = price;
      else                    gatePrice = Math.round((price / 4.9 + 200) * width);
    } else if (config === 'without_wicket') {
      gatePrice = Math.round((price / 4.9 + 338) * width);
    } else if (config === 'with_builtin_wicket') {
      gatePrice = Math.round(price * 0.25 * width);
    }
  }

  return Math.ceil(gatePrice / 100) * 100;
}

/* ============================================================
   ВАЛІДАЦІЯ
   ============================================================ */
function setError(id)   { const el = document.getElementById(id); if (el) el.classList.add('field-error'); }
function clearError(id) { const el = document.getElementById(id); if (el) el.classList.remove('field-error'); }
function clearErrors()  { document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error')); }

function validateForm() {
  let valid = true;

  if (!selectedType) {
    document.getElementById('btnForged').classList.add('field-error');
    document.getElementById('btnModern').classList.add('field-error');
    valid = false;
  }

  if (selectedModelIdx === null) {
    document.querySelectorAll('#modelGallery .model-card').forEach(card => card.classList.add('field-error'));
    valid = false;
  }

  if (!selectedConfig) {
    document.querySelectorAll('#configGroup .radio-option').forEach(o => o.classList.add('field-error'));
    valid = false;
  }

  const rawW = document.getElementById('width').value.replace(',', '.');
  const widthNum = parseFloat(rawW);
  if (!rawW || isNaN(widthNum) || widthNum < 2.5 || widthNum > 6) {
    setError('width'); valid = false;
  }

  if (!selectedCoating) {
    document.querySelectorAll('#coatingGroup .radio-option').forEach(o => o.classList.add('field-error'));
    valid = false;
  }

  const cityVal = document.getElementById('city').value.trim();
  if (!cityVal || !selectedLat) {
    setError('city'); valid = false;
  }

  return valid;
}

/* ============================================================
   РОЗРАХУНОК
   ============================================================ */
document.getElementById('calculateBtn').addEventListener('click', async () => {
  clearErrors();
  if (!validateForm()) {
    const widthNum = parseFloat(document.getElementById('width').value.replace(',', '.'));
    let errText = '⚠️ Будь ласка, заповніть усі виділені поля.';
    if (!isNaN(widthNum)) {
      if (widthNum < 2.5) errText = '⚠️ Ми робимо ворота від 2,5 до 6 м. Введіть інший розмір або зателефонуйте нам.';
      if (widthNum > 6)   errText = '⚠️ Ми робимо ворота від 2,5 до 6 м. Введіть інший розмір або зателефонуйте нам.';
    }
    showResult(`<p class="error-msg">${errText}</p>`, false);
    return;
  }

  const model  = GATE_MODELS[selectedType][selectedModelIdx];
  const width  = parseFloat(document.getElementById('width').value.replace(',', '.'));
  const lockEl = document.getElementById('lockOption');
  const lockChecked = lockEl ? lockEl.classList.contains('checked') : false;

  let gatePrice = calcGatePrice(selectedType, model.price, selectedConfig, width);
  gatePrice += (selectedCoating ? selectedCoating.surcharge : 0);
  if (lockChecked && selectedType === 'forged' && selectedConfig !== 'without_wicket') gatePrice += LOCK_PRICE;
  if (boltsChecked) gatePrice += BOLTS_PRICE;

  let postPrice = 0;
  let postInfo  = null;
  if (selectedPostKey && _postType !== 'none') {
    postInfo  = POST_DATA.find(p => p.key === selectedPostKey);
    if (postInfo) postPrice = postInfo.price * postQty;
  }

  let hingePrice = 0;
  let hingeCount = 0;
  if (hingesChecked && postInfo) {
    if (selectedConfig === 'without_wicket') { hingeCount = 4; }
    else { hingeCount = 6; }
    hingePrice = hingeCount * HINGE_PRICE_PER_UNIT;
  }

  const btn = document.getElementById('calculateBtn');
  btn.textContent = '⏳ Розраховуємо...';
  btn.disabled = true;
  showResult(`<p class="loading">⏳ Формуємо загальний розрахунок...</p>`, false);

  let deliveryPrice  = null;
  let deliveryStatus = 'error';
  const data = deliveryFirstData || window._lastDeliveryData;

  if (data && selectedDeliveryChoice) {
    if (selectedDeliveryChoice.mode === 'address') {
      deliveryStatus = data.status;
      deliveryPrice = data.status === 'deviation' ? Number(data.price) : selectedDeliveryChoice.price;
    } else if (selectedDeliveryChoice.mode === 'nova_poshta') {
      deliveryStatus = 'nova_poshta';
      deliveryPrice = selectedDeliveryChoice.price;
    } else if (selectedDeliveryChoice.mode === 'clarify') {
      deliveryStatus = data.status;
    }
  }

  btn.disabled = false;
  btn.textContent = selectedPostKey ? 'Перерахувати загальну вартість' : 'Показати загальну вартість';

  const showPosts    = postInfo && isFactoryAddressDelivery();
  const totalComplex = gatePrice + (showPosts ? postPrice : 0) + (showPosts ? hingePrice : 0);
  const totalPrice   = totalComplex + (deliveryPrice || 0);

  const configLabels = {
    with_separate_wicket: 'Ворота + хвіртка окремо',
    without_wicket:       'Тільки ворота',
    with_builtin_wicket:  'Ворота з хвірткою всередині',
  };

  const coatingLabel = selectedCoating ? selectedCoating.label.replace(' ⭐', '').trim() : '';
  const isPopular    = selectedCoating && selectedCoating.badge;
  const showLockIncluded = selectedType === 'modern' && selectedConfig !== 'without_wicket';
  const settlementName = selectedCityName.split(',')[0].trim();

  let html = `
    <div class="result-title">✅ Ваш розрахунок готовий!</div>
    <div class="result-section-title">Склад комплекту</div>
    <div class="result-row"><span>Модель</span><span>${model.name}</span></div>
    <div class="result-row"><span>Комплектація</span><span>${configLabels[selectedConfig]}</span></div>
    <div class="result-row"><span>Ширина</span><span>${width} м</span></div>
    <div class="result-row"><span>Покриття</span><span>${coatingLabel}</span></div>
  `;

  if (isPopular) {
    html += `<div class="result-row popular-badge-row"><span></span><span>⭐ Найпопулярніший вибір</span></div>`;
  }

  if (showLockIncluded) {
    html += `<div class="result-row"><span>Врізний механічний замок і ручки з обох боків хвіртки</span><span style="color:var(--green);">входять у вартість</span></div>`;
  }
  if (lockChecked && selectedType === 'forged' && selectedConfig !== 'without_wicket') {
    html += `<div class="result-row"><span>Замок у хвіртку з встановленням</span><span>+${LOCK_PRICE.toLocaleString('uk-UA')} грн</span></div>`;
  }
  if (boltsChecked) {
    html += `<div class="result-row"><span>Фіксатори створок (2 шт)</span><span>+${BOLTS_PRICE.toLocaleString('uk-UA')} грн</span></div>`;
  }

  if (showPosts && postInfo) {
    html += `<div class="result-row"><span>Стовп: ${postInfo.name}, ${postInfo.height} — ${postQty} шт × ${postInfo.price.toLocaleString('uk-UA')} грн</span><span>${postPrice.toLocaleString('uk-UA')} грн</span></div>`;
    if (hingesChecked && hingeCount > 0) {
      html += `<div class="result-row"><span>Заводська зварка петель — ${hingeCount} шт × ${HINGE_PRICE_PER_UNIT.toLocaleString('uk-UA')} грн</span><span>${hingePrice.toLocaleString('uk-UA')} грн</span></div>`;
    }
  }

  html += `<div class="result-row result-subtotal"><span>Ворота з комплектуючими</span><span>${totalComplex.toLocaleString('uk-UA')} грн</span></div>`;

  if (deliveryStatus === 'on_route') {
    const isKyiv = selectedCityName.toLowerCase().includes('київ') || selectedCityName.toLowerCase().includes('киев');
    if (isKyiv) {
      const kyivTotal = totalComplex + 900;
      html += `<div class="result-row"><span>Адресна доставка: ${settlementName}</span><span>900 грн</span></div>`;
      html += `<div class="result-row total"><span>Разом до сплати</span><span>${kyivTotal.toLocaleString('uk-UA')} грн</span></div>`;
    } else {
      const minT = totalComplex + 500;
      const maxT = totalComplex + 900;
      html += `<div class="result-row"><span>Адресна доставка: ${settlementName}</span><span>500–900 грн</span></div>`;
      html += `<p class="delivery-note-inline delivery-note-export">Точна сума залежить від адреси доставки</p>`;
      html += `<div class="result-row total"><span>Разом до сплати</span><span>від ${minT.toLocaleString('uk-UA')} до ${maxT.toLocaleString('uk-UA')} грн</span></div>`;
    }
  } else if (deliveryStatus === 'nova_poshta') {
    html += `<div class="result-row"><span>Нова Пошта — на обране вантажне відділення</span><span>${deliveryPrice.toLocaleString('uk-UA')} грн</span></div>`;
    html += `<p class="delivery-note delivery-note-export">Ви можете обрати зручне вантажне відділення у своєму або найближчому населеному пункті.</p>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>${totalPrice.toLocaleString('uk-UA')} грн</span></div>`;
  } else if (deliveryStatus === 'deviation') {
    const zone = window._lastDeliveryData ? window._lastDeliveryData.zone : '';
    html += `<div class="result-row"><span>Адресна доставка: ${settlementName}</span><span>${deliveryPrice.toLocaleString('uk-UA')} грн</span></div>`;
    if (zone) {
      html += `<p class="delivery-note-inline delivery-note-export">${zone}</p>`;
    }
    html += `<div class="result-row total"><span>Разом до сплати</span><span>${totalPrice.toLocaleString('uk-UA')} грн</span></div>`;
  } else if (deliveryStatus === 'clarify') {
    const distKm = window._lastDeliveryData ? window._lastDeliveryData.distanceKm : '';
    html += `<div class="result-row"><span>Доставка: ${settlementName}</span><span><span class="clarify-badge">Уточнюємо з менеджером</span></span></div>`;
    html += `<p class="delivery-note delivery-note-export">Відстань від маршруту — ${distKm} км. Можливість адресної доставки перевірить менеджер. Також можна обрати доставку Новою Поштою на вантажне відділення.</p>`;
    html += `<p class="delivery-note delivery-note-export">Ви можете обрати зручне вантажне відділення у своєму або найближчому населеному пункті.</p>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>уточнення</span></div>`;
  } else if (deliveryStatus === 'clarify_extended') {
    const d = window._lastDeliveryData;
    const novaPrice = d.novaPoshtaPrice || 4000;
    html += `<div class="result-row"><span>Доставка: ${settlementName}</span><span><span class="clarify-badge">Потребує уточнення у логіста</span></span></div>`;
    html += `<p class="delivery-note delivery-note-export">Відстань від маршруту — ${d.distanceKm} км. Можливість адресної доставки перевірить логіст. Доставка Новою Поштою на вантажне відділення — ${novaPrice.toLocaleString('uk-UA')} грн.</p>`;
    html += `<p class="delivery-note delivery-note-export">Ви можете обрати зручне вантажне відділення у своєму або найближчому населеному пункті.</p>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>уточнить логіст</span></div>`;
  } else {
    html += `<div class="result-row"><span>Доставка</span><span>Уточніть у менеджера</span></div>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>уточнення</span></div>`;
  }

  if (isFactoryAddressDelivery() && !postInfo) {
    html += `
      <div class="posts-offer">
        <div class="posts-offer__title">Додати стовпи до замовлення?</div>
        <button type="button" class="posts-offer__button" onclick="offerPostsAfterCalculation()">Обрати стовпи</button>
      </div>
    `;
  }

  html += `<p class="preliminary-note">Орієнтовна ціна. Менеджер уточнить деталі при замовленні 👍</p>`;

  html += `
    <div class="contacts-block">
      <a href="tel:+380673990560" class="btn-call" onclick="track('phone_click', selectedCityName)">📞 Зателефонувати нам</a>
      <div class="phone-under">+38 (067) 399-05-60</div>
      <button class="btn-messenger" onclick="toggleMessengerList()">💬 Написати в месенджер</button>
      <div class="messenger-list" id="messengerList">
        <a href="viber://chat?number=%2B380673990560" class="msg-btn viber" onclick="_leadTracker.onMessengerClick('Viber', _lastCalcData); track('contact', selectedCityName);">Viber</a>
        <a href="https://t.me/+380673990560" class="msg-btn telegram" onclick="_leadTracker.onMessengerClick('Telegram', _lastCalcData); track('contact', selectedCityName);">Telegram</a>
        <a href="https://wa.me/380673990560" class="msg-btn whatsapp" onclick="_leadTracker.onMessengerClick('WhatsApp', _lastCalcData); track('contact', selectedCityName);">WhatsApp</a>
      </div>
      <button class="btn-pdf" onclick="toggleSaveOptions(); track('save_options', selectedCityName);">💾 Зберегти розрахунок</button>
      <div class="save-options-menu" id="saveOptionsMenu">
        <button class="save-option-item" onclick="copyCalcText(); track('copy_text', selectedCityName);">
          <span class="save-option-item-icon">📋</span>
          <div>
            <div>Скопіювати текст</div>
            <div class="save-option-item-desc">Вставити в будь-який месенджер або SMS</div>
          </div>
        </button>
        <button class="save-option-item" onclick="generatePDF(); track('pdf_download', selectedCityName);">
          <span class="save-option-item-icon">📄</span>
          <div>
            <div>Зберегти як документ</div>
            <div class="save-option-item-desc">Файл PDF з логотипом та датою</div>
          </div>
        </button>
      </div>
      <div class="save-options-toast" id="saveOptionsToast"></div>
      <a class="share-banner-wrap" onclick="sharePage(); track('share', selectedCityName);" style="cursor:pointer;">
        <img src="../v2/banner-share.png" alt="Поділитися калькулятором" />
      </a>
      <div class="bottom-btns">
        <a class="btn-secondary" href="https://verbadom.com.ua/ua/g140836156-vorota-kalitkoj-raspashnye" target="_blank">Всі ворота на сайті</a>
        <button class="btn-secondary" onclick="document.getElementById('resetBtn').click()">↺ Новий розрахунок</button>
      </div>
      <p class="promo-line">Потрібен калькулятор для вашого бізнесу? <a href="mailto:buildertools.pro@gmail.com" class="promo-email">buildertools.pro@gmail.com</a></p>
    </div>
  `;

  showResult(html, false);

  _lastCalcData = {
    city: selectedCityName,
    model: model.name,
    config: configLabels[selectedConfig],
    width: width + ' м',
    totalPrice: totalPrice > 0 ? totalPrice.toLocaleString('uk-UA') + ' грн' : 'уточнення',
  };
  _leadTracker.onCalculation(_lastCalcData);
  track('calculate', selectedCityName);
});

function toggleMessengerList() {
  const list = document.getElementById('messengerList');
  if (list) list.classList.toggle('open');
}

async function sharePage() {
  try {
    await navigator.share({ url: window.location.href, title: 'Калькулятор воріт — Verbadom' });
  } catch (e) {}
}

/* ============================================================
   ПОКАЗ РЕЗУЛЬТАТУ
   ============================================================ */
function showResult(html, showReset) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = html;
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth' });
  if (showReset) document.getElementById('resetBtn').style.display = 'block';
}

/* ============================================================
   СКИДАННЯ ФОРМИ
   ============================================================ */
document.getElementById('resetBtn').addEventListener('click', () => {
  selectedType     = '';
  selectedModelIdx = null;
  selectedConfig   = '';
  selectedCoating  = null;
  boltsChecked     = false;
  hingesChecked    = false;
  selectedPostKey  = null;
  postQty          = 2;
  selectedCityName = '';
  selectedLat      = null;
  selectedLng      = null;
  selectedDeliveryChoice = null;
  deliveryFirstData = null;
  window._lastDeliveryData = null;

  document.getElementById('btnForged').classList.remove('active', 'field-error');
  document.getElementById('btnModern').classList.remove('active', 'field-error');

  document.getElementById('modelGallery').innerHTML = '';
  document.getElementById('includedBlock').style.display = 'none';

  document.getElementById('width').value = '';
  document.getElementById('city').value  = '';
  document.getElementById('city').classList.remove('has-selection');

  document.getElementById('result').classList.add('hidden');
  document.getElementById('result').innerHTML = '';
  document.getElementById('resetBtn').style.display = 'none';
  const calculateBtn = document.getElementById('calculateBtn');
  if (calculateBtn) calculateBtn.textContent = 'Показати загальну вартість';

  resetPostSteps();
  document.getElementById('postQtyVal').textContent = '2';
  postQty = 2;

  const boltsOpt = document.getElementById('boltsOption');
  if (boltsOpt) boltsOpt.classList.remove('checked');

  hideField('fieldGateModel');
  hideField('fieldConfig');
  hideField('fieldWidth');
  hideField('fieldCoating');
  document.getElementById('fieldLock').innerHTML = '';
  hideField('fieldBolts');
  hideField('fieldPosts');

  resetDeliveryFirstResult();
  const gateFlow = document.getElementById('gateCalculatorFlow');
  if (gateFlow) gateFlow.classList.add('gate-flow--hidden');

  clearErrors();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   ШТОРКА PDF — ІНІЦІАЛІЗАЦІЯ
   ============================================================ */
(function initPdfSheet() {
  const style = document.createElement('style');
  style.textContent = `
    .pdf-sheet-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0);
      z-index: 500; pointer-events: none;
      transition: background 0.3s ease;
    }
    .pdf-sheet-overlay.open {
      background: rgba(0,0,0,0.5);
      pointer-events: all;
    }
    .pdf-sheet {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #fff;
      border-radius: 20px 20px 0 0;
      border-top: 1px solid #DDE1E8;
      z-index: 501;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(.32,.72,0,1);
      max-height: 92vh; overflow-y: auto;
      padding: 0 0 32px;
      font-family: 'Nunito', sans-serif;
    }
    .pdf-sheet.open { transform: translateY(0); }
    .pdf-sheet-handle {
      width: 36px; height: 4px;
      background: #DDE1E8; border-radius: 2px;
      margin: 12px auto 0;
    }
    .pdf-sheet-close {
      position: absolute; top: 14px; right: 18px;
      width: 30px; height: 30px;
      background: #F5F6F8; border: none; border-radius: 50%;
      font-size: 18px; color: #888; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .pdf-sheet-close:hover { background: #E8E9EC; }
    .pdf-sheet-inner { padding: 16px 20px 0; }
    .pdf-sheet-receipt {
      background: #fff; border: 1px solid #DDE1E8;
      border-radius: 12px; overflow: hidden; margin-bottom: 14px;
    }
    .pdf-sheet-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 14px 16px 12px; border-bottom: 1px solid #EEF1F5;
    }
    .pdf-sheet-logo { font-size: 18px; font-weight: 800; color: #2E9B3F; letter-spacing: 1px; }
    .pdf-sheet-site { font-size: 12px; color: #888; margin-top: 2px; }
    .pdf-sheet-date-lbl { font-size: 11px; color: #888; text-align: right; }
    .pdf-sheet-date-val { font-size: 13px; font-weight: 700; color: #1A1A2E; text-align: right; margin-top: 2px; }
    .pdf-sheet-phone { font-size: 12px; color: #888; text-align: right; margin-top: 2px; }
    .pdf-sheet-rows { padding: 0 16px 10px; }
    .pdf-sheet-section {
      font-size: 11px; font-weight: 700; color: #888;
      text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 0 5px;
    }
    .pdf-sheet-row {
      display: flex; justify-content: space-between;
      font-size: 15px; color: #1A1A2E;
      padding: 5px 0; border-bottom: 1px solid #F0F4F0; gap: 10px;
    }
    .pdf-sheet-row:last-child { border-bottom: none; }
    .pdf-sheet-row-lbl { color: #555; flex: 0 0 55%; max-width: 55%; line-height: 1.4; }
    .pdf-sheet-row-val { font-weight: 700; text-align: right; flex: 0 0 45%; max-width: 45%; }
    .pdf-sheet-subtotal { background: #E8F5EB; padding: 12px 16px; }
    .pdf-sheet-subtotal-lbl { font-size: 12px; color: #888; margin-bottom: 2px; }
    .pdf-sheet-subtotal-val { font-size: 26px; font-weight: 800; color: #1A6B28; }
    .pdf-sheet-total { background: #2E9B3F; padding: 14px 16px; }
    .pdf-sheet-total-lbl { font-size: 13px; color: rgba(255,255,255,0.85); margin-bottom: 3px; }
    .pdf-sheet-total-val { font-size: 30px; font-weight: 800; color: #fff; }
    .pdf-sheet-note { font-size: 12px; color: #888; text-align: center; padding: 10px 16px 4px; }
    .pdf-sheet-btn-share {
      width: 100%; padding: 16px;
      background: #2E9B3F; border: none; border-radius: 12px;
      font-family: 'Nunito', sans-serif; font-size: 17px; font-weight: 800;
      color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-sizing: border-box; margin-bottom: 10px;
    }
    .pdf-sheet-btn-share:hover { background: #1A6B28; }
    .pdf-sheet-btn-share:disabled { background: #A8D9B0; cursor: not-allowed; }
    .pdf-sheet-btn-save {
      width: 100%; padding: 13px;
      background: #fff; border: 1.5px solid #DDE1E8; border-radius: 10px;
      font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700;
      color: #555; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-sizing: border-box; margin-bottom: 10px;
    }
    .pdf-sheet-btn-save:hover { background: #F5F6F8; }
    .pdf-sheet-status { font-size: 13px; color: #888; text-align: center; min-height: 18px; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'pdf-sheet-overlay';
  overlay.id = 'pdfSheetOverlay';
  overlay.addEventListener('click', closePdfSheet);

  const sheet = document.createElement('div');
  sheet.className = 'pdf-sheet';
  sheet.id = 'pdfSheet';
  sheet.innerHTML = `
    <div class="pdf-sheet-handle"></div>
    <button class="pdf-sheet-close" onclick="closePdfSheet()" aria-label="Закрити">×</button>
    <div class="pdf-sheet-inner">
      <div class="pdf-sheet-receipt" id="pdfSheetReceipt"></div>
      <button class="pdf-sheet-btn-share" id="pdfSheetShareBtn" onclick="sharePdf()" style="display:none;">📤 Поділитися</button>
      <button class="pdf-sheet-btn-save" id="pdfSheetSaveBtn" onclick="savePdf()" style="display:none;">📄 Скачати PDF</button>
      <div class="pdf-sheet-status" id="pdfSheetStatus"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sheet);
})();

/* ============================================================
   ШТОРКА PDF — ВІДКРИТИ / ЗАКРИТИ
   ============================================================ */
let _pdfDocCached = null;
let _pdfFilenameCached = '';

function openPdfSheet() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  _pdfDocCached = null;

  const rows = document.querySelectorAll('#result .result-row');
  let rowsHTML = '';
  let subtotalHTML = '';
  let totalHTML = '';

  rows.forEach(row => {
    const spans = row.querySelectorAll('span');
    if (spans.length < 2) return;
    const label = spans[0].innerText.trim();
    const value = spans[spans.length - 1].innerText.trim();
    const isTotal    = row.classList.contains('total');
    const isSubtotal = row.classList.contains('result-subtotal');
    const isPopular  = row.classList.contains('popular-badge-row');
    if (isPopular) return;
    if (isTotal) {
      totalHTML = `<div class="pdf-sheet-total"><div class="pdf-sheet-total-lbl">${label}</div><div class="pdf-sheet-total-val">${value}</div></div>`;
    } else if (isSubtotal) {
      subtotalHTML = `<div class="pdf-sheet-subtotal"><div class="pdf-sheet-subtotal-lbl">${label}</div><div class="pdf-sheet-subtotal-val">${value}</div></div>`;
    } else {
      rowsHTML += `<div class="pdf-sheet-row"><div class="pdf-sheet-row-lbl">${label}</div><div class="pdf-sheet-row-val">${value}</div></div>`;
    }
  });

  document.getElementById('pdfSheetReceipt').innerHTML = `
    <div class="pdf-sheet-head">
      <div>
        <div class="pdf-sheet-logo">🌿 VERBADOM</div>
        <div class="pdf-sheet-site">verbadom.com.ua</div>
      </div>
      <div>
        <div class="pdf-sheet-date-lbl">Розрахунок від</div>
        <div class="pdf-sheet-date-val">${dateStr}</div>
        <div class="pdf-sheet-phone">+38 (067) 399-05-60</div>
      </div>
    </div>
    <div class="pdf-sheet-rows">
      <div class="pdf-sheet-section">Склад замовлення</div>
      ${rowsHTML}
    </div>
    ${subtotalHTML}
    ${totalHTML}
    <div class="pdf-sheet-note">Орієнтовна ціна · Менеджер уточнить деталі при замовленні</div>
  `;

  document.getElementById('pdfSheetStatus').textContent = '';

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (navigator.share && isMobile) {
    document.getElementById('pdfSheetShareBtn').style.display = 'flex';
    document.getElementById('pdfSheetSaveBtn').style.display = 'none';
  } else {
    document.getElementById('pdfSheetShareBtn').style.display = 'none';
    document.getElementById('pdfSheetSaveBtn').style.display = 'flex';
  }

  document.getElementById('pdfSheetOverlay').classList.add('open');
  document.getElementById('pdfSheet').classList.add('open');
}

function closePdfSheet() {
  document.getElementById('pdfSheetOverlay').classList.remove('open');
  document.getElementById('pdfSheet').classList.remove('open');
  document.getElementById('pdfSheetStatus').textContent = '';
}

async function _buildPdfBlob() {
  const { jsPDF } = window.jspdf;
  const now = new Date();
  const dateStr = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  _pdfFilenameCached = `Ворота_Verbadom_${dateStr.replace(/\./g, '-')}.pdf`;

  const pdfDiv = document.createElement('div');
  pdfDiv.style.cssText = `position:fixed;left:-9999px;top:0;width:595px;background:#fff;padding:0;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;font-size:16px;line-height:1.7;`;

  const rows = document.querySelectorAll('#result .result-row');
  let verticalRowsHTML = '';
  rows.forEach(row => {
    const spans = row.querySelectorAll('span');
    if (spans.length < 2) return;
    const label      = spans[0].innerText.trim();
    const value      = spans[spans.length - 1].innerText.trim();
    const isTotal    = row.classList.contains('total');
    const isSubtotal = row.classList.contains('result-subtotal');
    const isPopular  = row.classList.contains('popular-badge-row');
    if (isPopular) {
      verticalRowsHTML += `<div style="padding:2px 32px 10px;color:#856404;font-size:22px;">⭐ Найпопулярніший вибір</div>`;
    } else if (isTotal) {
      verticalRowsHTML += `<div style="background:#2E9B3F;padding:22px 32px;margin:14px 0 0;"><div style="color:#fff;font-size:24px;font-weight:600;opacity:0.85;">${label}</div><div style="color:#fff;font-weight:800;font-size:44px;margin-top:4px;">${value}</div></div>`;
    } else if (isSubtotal) {
      verticalRowsHTML += `<div style="background:#E8F5EB;padding:18px 32px;margin:10px 0;"><div style="color:#888;font-size:20px;">${label}</div><div style="color:#1A6B28;font-weight:700;font-size:36px;margin-top:4px;">${value}</div></div>`;
    } else {
      verticalRowsHTML += `<div style="padding:18px 32px;border-bottom:1px solid #eee;"><div style="color:#888;font-size:20px;">${label}</div><div style="color:#1a1a2e;font-weight:600;font-size:30px;margin-top:4px;">${value}</div></div>`;
    }
  });

  const deliveryNotes = document.querySelectorAll('#result .delivery-note-export');
  const delivNoteHTML = Array.from(deliveryNotes)
    .map(note => `<p style="font-size:11px;color:#555;margin:4px 32px 8px;white-space:pre-line;">${note.innerText}</p>`)
    .join('');
  const errMsg = document.querySelector('#result .error-msg');
  const errHTML = errMsg ? `<p style="font-size:11px;color:#c0392b;margin:6px 32px 0;">⚠️ ${errMsg.innerText.replace('⚠️','').trim()}</p>` : '';

  pdfDiv.innerHTML = `
    <div style="border-top:4px solid #2E9B3F;padding:20px 32px 16px;border-bottom:1px solid #e8ecf4;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div><div style="font-size:36px;font-weight:900;color:#2E9B3F;letter-spacing:2px;">🌿 VERBADOM</div><div style="font-size:18px;color:#888;margin-top:2px;">Ворота з доставкою по всій Україні</div><div style="font-size:18px;color:#888;">verbadom.com.ua</div></div>
        <div style="text-align:right;"><div style="font-size:18px;color:#888;">Розрахунок від</div><div style="font-size:22px;font-weight:600;color:#1A6B28;">${dateStr}</div><div style="font-size:18px;color:#888;margin-top:3px;">+38 (067) 399-05-60</div></div>
      </div>
    </div>
    <div style="padding:20px 32px 12px;"><div style="font-size:26px;font-weight:700;color:#1A6B28;">Попередній розрахунок вартості воріт</div></div>
    <div style="padding:0 0 8px;">${verticalRowsHTML}${delivNoteHTML}${errHTML}</div>
    <div style="margin:14px 32px;padding:12px 16px;background:#fff8e1;border-radius:6px;border-left:3px solid #EF9F27;"><span style="font-size:20px;color:#7A5800;">⚠️ Орієнтовна ціна. Менеджер уточнить деталі при замовленні.</span></div>
    <div style="margin:0 32px 24px;padding:18px 20px;background:#E8F5EB;border-radius:8px;border:1px solid #A8D9B0;">
      <div style="font-size:22px;font-weight:700;color:#1A6B28;margin-bottom:10px;">Зв'яжіться з нами:</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-size:26px;font-weight:700;color:#1A6B28;">📞 +38 (067) 399-05-60</div>
        <a href="viber://chat?number=%2B380673990560" style="display:inline-block;padding:8px 18px;background:#7360f2;color:#fff;border-radius:20px;text-decoration:none;font-size:20px;font-weight:600;">Viber</a>
        <a href="https://t.me/+380673990560" style="display:inline-block;padding:8px 18px;background:#2aabee;color:#fff;border-radius:20px;text-decoration:none;font-size:20px;font-weight:600;">Telegram</a>
        <a href="https://wa.me/380673990560" style="display:inline-block;padding:8px 18px;background:#25d366;color:#fff;border-radius:20px;text-decoration:none;font-size:20px;font-weight:600;">WhatsApp</a>
      </div>
    </div>
    <div style="border-top:1px solid #eee;padding:10px 32px;text-align:center;"><span style="font-size:18px;color:#bbb;">Розрахунок: verbadom.com.ua</span></div>
  `;

  document.body.appendChild(pdfDiv);
  const canvas  = await html2canvas(pdfDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/jpeg', 0.85);
  const pageW   = 100;
  const pageH   = (canvas.height * pageW) / canvas.width;
  const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageW, pageH] });
  doc.addImage(imgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');
  document.body.removeChild(pdfDiv);
  _pdfDocCached = doc;
  return doc;
}

async function sharePdf() {
  const btn = document.getElementById('pdfSheetShareBtn');
  const status = document.getElementById('pdfSheetStatus');
  btn.disabled = true;
  btn.textContent = '⏳ Готуємо PDF...';
  status.textContent = '';
  try {
    const doc = await _buildPdfBlob();
    const blob = doc.output('blob');
    const file = new File([blob], _pdfFilenameCached, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Розрахунок воріт — Verbadom' });
    } else {
      doc.save(_pdfFilenameCached);
      status.textContent = '✅ PDF збережено';
    }
  } catch (e) {
    if (e.name !== 'AbortError') status.textContent = '⚠️ Не вдалося. Спробуйте ще раз.';
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Поділитися';
  }
}

async function savePdf() {
  const btn = document.getElementById('pdfSheetSaveBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Готуємо...';
  try {
    const doc = _pdfDocCached || await _buildPdfBlob();
    doc.save(_pdfFilenameCached);
  } finally {
    btn.disabled = false;
    btn.textContent = '📄 Скачати PDF';
  }
}

/* ============================================================
   ЗБЕРЕГТИ РОЗРАХУНОК — МЕНЮ ВИБОРУ
   ============================================================ */
(function injectSaveOptionsStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .save-options-menu {
      display: none;
      border: 1.5px solid #DDE1E8;
      border-radius: 10px;
      overflow: hidden;
      margin-top: -4px;
    }
    .save-options-menu.open { display: block; }
    .save-option-item {
      width: 100%; padding: 14px 16px;
      background: #fff; border: none;
      border-bottom: 1px solid #EEF1F5;
      font-family: 'Nunito', sans-serif;
      font-size: 15px; font-weight: 600;
      color: #1A1A2E; cursor: pointer;
      text-align: left;
      display: flex; align-items: center; gap: 10px;
      box-sizing: border-box;
    }
    .save-option-item:last-child { border-bottom: none; }
    .save-option-item:hover { background: #F5F6F8; }
    .save-option-item:active { background: #E8F5EB; }
    .save-option-item-icon { font-size: 20px; flex-shrink: 0; }
    .save-option-item-desc {
      font-size: 12px; color: #888;
      font-weight: 400; margin-top: 2px;
    }
    .save-options-toast {
      font-size: 13px; color: #1A6B28;
      text-align: center; min-height: 16px;
    }
  `;
  document.head.appendChild(style);
})();

function toggleSaveOptions() {
  const menu = document.getElementById('saveOptionsMenu');
  if (menu) menu.classList.toggle('open');
}

function copyCalcText() {
  const menu = document.getElementById('saveOptionsMenu');
  const toast = document.getElementById('saveOptionsToast');
  if (menu) menu.classList.remove('open');

  const rows = document.querySelectorAll('#result .result-row');
  let lines = ['🌿 VERBADOM — Розрахунок воріт', ''];
  rows.forEach(row => {
    const spans = row.querySelectorAll('span');
    if (spans.length < 2) return;
    const label = spans[0].innerText.trim();
    const value = spans[spans.length - 1].innerText.trim();
    const isPopular = row.classList.contains('popular-badge-row');
    if (isPopular) return;

    const isDeliveryLabel =
      label.startsWith('Адресна доставка:') ||
      label.startsWith('Доставка:');
    const resultLine = isDeliveryLabel
      ? `${label} — ${value}`
      : `${label}: ${value}`;

    if (row.classList.contains('result-subtotal') || row.classList.contains('total')) {
      lines.push('');
      lines.push(resultLine);
    } else {
      lines.push(resultLine);
    }
  });
  document.querySelectorAll('#result .delivery-note-export').forEach(note => {
    lines.push('');
    lines.push(note.innerText.trim());
  });
  lines.push('');
  lines.push('Орієнтовна ціна. Менеджер уточнить деталі при замовленні.');
  lines.push('📞 +38 (067) 399-05-60');
  lines.push('verbadom.com.ua');

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    if (toast) {
      toast.textContent = '✅ Скопійовано! Вставте в будь-який месенджер.';
      setTimeout(() => { toast.textContent = ''; }, 3000);
    }
  }).catch(() => {
    if (toast) toast.textContent = '⚠️ Не вдалося скопіювати';
  });
}

/* ============================================================
   PDF — функція збереження
   ============================================================ */
async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const isMobile  = /Mobi|Android/i.test(navigator.userAgent);

  const pdfDiv = document.createElement('div');
  pdfDiv.style.cssText = `
    position:fixed; left:-9999px; top:0;
    width:595px; background:#fff; padding:0;
    font-family:'Segoe UI',Arial,sans-serif;
    color:#1a1a2e; font-size:16px; line-height:1.7;
  `;

  const now     = new Date();
  const dateStr = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const rows = document.querySelectorAll('#result .result-row');
  let verticalRowsHTML = '';

  rows.forEach(row => {
    const spans = row.querySelectorAll('span');
    if (spans.length < 2) return;
    const label      = spans[0].innerText.trim();
    const value      = spans[spans.length - 1].innerText.trim();
    const isTotal    = row.classList.contains('total');
    const isSubtotal = row.classList.contains('result-subtotal');
    const isPopular  = row.classList.contains('popular-badge-row');

    if (isPopular) {
      verticalRowsHTML += `<div style="padding:2px 32px 10px;color:#856404;font-size:22px;">⭐ Найпопулярніший вибір</div>`;
    } else if (isTotal) {
      verticalRowsHTML += `
        <div style="background:#2E9B3F;padding:22px 32px;margin:14px 0 0;">
          <div style="color:#fff;font-size:24px;font-weight:600;opacity:0.85;">${label}</div>
          <div style="color:#fff;font-weight:800;font-size:44px;margin-top:4px;">${value}</div>
        </div>`;
    } else if (isSubtotal) {
      verticalRowsHTML += `
        <div style="background:#E8F5EB;padding:18px 32px;margin:10px 0;">
          <div style="color:#888;font-size:20px;">${label}</div>
          <div style="color:#1A6B28;font-weight:700;font-size:36px;margin-top:4px;">${value}</div>
        </div>`;
    } else {
      verticalRowsHTML += `
        <div style="padding:18px 32px;border-bottom:1px solid #eee;">
          <div style="color:#888;font-size:20px;">${label}</div>
          <div style="color:#1a1a2e;font-weight:600;font-size:30px;margin-top:4px;">${value}</div>
        </div>`;
    }
  });

  const deliveryNotes = document.querySelectorAll('#result .delivery-note-export');
  const delivNoteHTML = Array.from(deliveryNotes)
    .map(note => `<p style="font-size:${isMobile ? 10 : 11}px;color:#555;margin:4px 12px 8px;white-space:pre-line;">${note.innerText}</p>`)
    .join('');

  const errMsg  = document.querySelector('#result .error-msg');
  const errHTML = errMsg
    ? `<p style="font-size:${isMobile ? 10 : 11}px;color:#c0392b;margin:6px 12px 0;">⚠️ ${errMsg.innerText.replace('⚠️','').trim()}</p>`
    : '';

  pdfDiv.innerHTML = `
    <div style="border-top:4px solid #2E9B3F;padding:20px 32px 16px;border-bottom:1px solid #e8ecf4;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:36px;font-weight:900;color:#2E9B3F;letter-spacing:2px;">🌿 VERBADOM</div>
          <div style="font-size:18px;color:#888;margin-top:2px;">Ворота з доставкою по всій Україні</div>
          <div style="font-size:18px;color:#888;">verbadom.com.ua</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px;color:#888;">Розрахунок від</div>
          <div style="font-size:22px;font-weight:600;color:#1A6B28;">${dateStr}</div>
          <div style="font-size:18px;color:#888;margin-top:3px;">+38 (067) 399-05-60</div>
        </div>
      </div>
    </div>
    <div style="padding:20px 32px 12px;">
      <div style="font-size:26px;font-weight:700;color:#1A6B28;">Попередній розрахунок вартості воріт</div>
    </div>
    <div style="padding:0 0 8px;">
      ${verticalRowsHTML}
      ${delivNoteHTML}
      ${errHTML}
    </div>
    <div style="margin:14px 32px;padding:12px 16px;background:#fff8e1;border-radius:6px;border-left:3px solid #EF9F27;">
      <span style="font-size:20px;color:#7A5800;">⚠️ Орієнтовна ціна. Менеджер уточнить деталі при замовленні.</span>
    </div>
    <div style="margin:0 32px 24px;padding:18px 20px;background:#E8F5EB;border-radius:8px;border:1px solid #A8D9B0;">
      <div style="font-size:22px;font-weight:700;color:#1A6B28;margin-bottom:10px;">Зв'яжіться з нами:</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-size:26px;font-weight:700;color:#1A6B28;">📞 +38 (067) 399-05-60</div>
        <a href="viber://chat?number=%2B380673990560" style="display:inline-block;padding:8px 18px;background:#7360f2;color:#fff;border-radius:20px;text-decoration:none;font-size:20px;font-weight:600;">Viber</a>
        <a href="https://t.me/+380673990560" style="display:inline-block;padding:8px 18px;background:#2aabee;color:#fff;border-radius:20px;text-decoration:none;font-size:20px;font-weight:600;">Telegram</a>
        <a href="https://wa.me/380673990560" style="display:inline-block;padding:8px 18px;background:#25d366;color:#fff;border-radius:20px;text-decoration:none;font-size:20px;font-weight:600;">WhatsApp</a>
      </div>
    </div>
    <div style="border-top:1px solid #eee;padding:10px 32px;text-align:center;">
      <span style="font-size:18px;color:#bbb;">Розрахунок: verbadom.com.ua</span>
    </div>
  `;

  document.body.appendChild(pdfDiv);

  try {
    const canvas  = await html2canvas(pdfDiv, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pageW   = 100;
    const pageH   = (canvas.height * pageW) / canvas.width;
    const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageW, pageH] });
    doc.addImage(imgData, 'JPEG', 0, 0, pageW, pageH, undefined, 'FAST');

    const filename = `Ворота_Verbadom_${dateStr.replace(/\./g, '-')}.pdf`;
    const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (navigator.share && isMobileDevice) {
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      try {
        await navigator.share({ files: [file], title: 'Розрахунок воріт — Verbadom' });
      } catch (e) { doc.save(filename); }
    } else {
      doc.save(filename);
    }
  } finally {
    document.body.removeChild(pdfDiv);
  }
}

/* ============================================================
   АНАЛІТИКА
   ============================================================ */
function getUserId() {
  let id = localStorage.getItem('vb_uid');
  if (!id) {
    id = 'u' + Date.now() + Math.random().toString(36).slice(2, 6);
    localStorage.setItem('vb_uid', id);
  }
  return id;
}

const USER_ID       = getUserId();
const ANALYTICS_URL = 'https://n8n.verbadom.com.ua/webhook/analytics';

function track(eventName, city) {
  if (IS_TEST) return;
  fetch(ANALYTICS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id:   USER_ID,
      event:     eventName,
      timestamp: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().replace('Z', '+03:00'),
      city:      city || '',
    })
  }).catch(() => {});
}

track('page_view');

/* ============================================================
   ТЕСТ PDF
   ============================================================ */
function testPDF() {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <div class="result-title">✅ Ваш розрахунок готовий!</div>
    <div class="result-section-title">Склад комплекту</div>
    <div class="result-row"><span>Модель</span><span>Профнастил Т-10, вертикаль</span></div>
    <div class="result-row"><span>Комплектація</span><span>Ворота + хвіртка окремо</span></div>
    <div class="result-row"><span>Ширина</span><span>4.9 м</span></div>
    <div class="result-row"><span>Покриття</span><span>Матовий з обох боків +500 грн</span></div>
    <div class="result-row popular-badge-row"><span></span><span>⭐ Найпопулярніший вибір</span></div>
    <div class="result-row"><span>Врізний механічний замок і ручки з обох боків хвіртки</span><span style="color:var(--green);">входять у вартість</span></div>
    <div class="result-row"><span>Фіксатори створок (2 шт)</span><span>+600 грн</span></div>
    <div class="result-row result-subtotal"><span>Ворота з комплектуючими</span><span>28 000 грн</span></div>
    <div class="result-row"><span>Доставка до вашого двору</span><span>900 грн</span></div>
    <div class="result-row total"><span>Разом до сплати</span><span>28 900 грн</span></div>
    <p class="preliminary-note">Орієнтовна ціна. Менеджер уточнить деталі при замовленні 👍</p>
  `;
  resultDiv.classList.remove('hidden');
  generatePDF();
}
