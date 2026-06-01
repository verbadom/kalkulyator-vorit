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
        painted: p.name.toLowerCase().includes('фарб'),
      }));
    }

    if (prices.coatings && prices.coatings.length > 0) {
      window._COATINGS = prices.coatings;
    }

    // Оновити лейбл ціни фіксаторів
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
let selectedCoating  = null;   // { value: 0, label: "...", surcharge: 0 }
let boltsChecked     = false;
let hingesChecked    = false;
let selectedPostKey  = null;   // ключ в POST_DATA
let postQty          = 2;
let selectedCityName = "";
let selectedLat      = null;
let selectedLng      = null;
let _acDebounce      = null;
let _acActiveIndex   = -1;

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

  // Скинути модель
  document.getElementById('modelSelectText').textContent = '— Оберіть модель —';
  document.getElementById('modelSelectBtn').classList.add('placeholder');
  document.getElementById('modelSelectBtn').classList.remove('field-error');
  document.getElementById('modelPhoto').style.display = 'none';
  document.getElementById('includedBlock').style.display = 'none';

  // Заповнити дропдаун моделей
  const dropdown = document.getElementById('modelDropdown');
  dropdown.innerHTML = '';
  GATE_MODELS[type].forEach((model, i) => {
    const opt = document.createElement('div');
    opt.className = 'custom-select-option';
    opt.textContent = model.name;
    opt.addEventListener('click', () => selectModel(i));
    dropdown.appendChild(opt);
  });

  // Показати поле моделі
  showField('fieldGateModel');

  // Скинути решту
  hideField('fieldConfig');
  hideField('fieldWidth');
  hideField('fieldCoating');
  document.getElementById('fieldLock').innerHTML = '';
  hideField('fieldBolts');
  hideField('fieldPosts');
  hideField('fieldCity');

  // Скинути radio
  resetRadioGroup('configGroup');
  resetPostSteps();
  document.getElementById('postQtyWrap').style.display = 'none';
  document.getElementById('fieldHinges').style.display = 'none';

  clearErrors();
  checkReadyMsg();
}

/* ============================================================
   КАСТОМНИЙ DROPDOWN
   ============================================================ */
function toggleDropdown(dropdownId, btnId) {
  const dropdown = document.getElementById(dropdownId);
  const btn      = document.getElementById(btnId);
  const isOpen   = dropdown.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) {
    dropdown.classList.add('open');
    btn.classList.add('open');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.custom-select-dropdown.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.custom-select-btn.open').forEach(b => b.classList.remove('open'));
}

document.addEventListener('click', e => {
  if (!e.target.closest('.custom-select-wrap')) closeAllDropdowns();
});

/* ============================================================
   ВИБІР МОДЕЛІ
   ============================================================ */
function selectModel(idx) {
  selectedModelIdx = idx;
  const model = GATE_MODELS[selectedType][idx];

  document.getElementById('modelSelectText').textContent = model.name;
  document.getElementById('modelSelectBtn').classList.remove('placeholder', 'field-error');
  closeAllDropdowns();

  // Фото
  const photo = document.getElementById('modelPhoto');
  photo.src = BASE_IMG + model.img;
  photo.alt = model.name;
  photo.style.display = 'block';

  // Блок "входить у вартість"
  const incl = document.getElementById('includedBlock');
  incl.innerHTML = buildIncludedText(selectedType, selectedConfig);
  incl.style.display = 'block';

  // Показати решту полів
  showField('fieldConfig');
  showField('fieldWidth');
  showField('fieldCoating');
  showField('fieldBolts');
  showField('fieldPosts');
  showField('fieldCity');

  // Покриття
  buildCoatingOptions();

  // Замок
  buildLockField();

  clearError('modelSelectBtn');
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
      return '✅ <strong>У вартість вже входить:</strong> Електромеханічний замок · Петлі на ворота та хвіртку · Ручка на хвіртку · Тримач навісного замка';
    }
    return '✅ <strong>У вартість вже входить:</strong> Електромеханічний замок на хвіртку · Петлі · Ручка на хвіртку · Тримач навісного замка';
  }
  return '';
}

/* ============================================================
   RADIO-ГРУПА (КОМПЛЕКТАЦІЯ, ПОКРИТТЯ)
   ============================================================ */
function selectRadio(groupId, el, stateVar) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected', 'field-error'));
  el.classList.add('selected');

  if (stateVar === 'selectedConfig') {
    selectedConfig = el.dataset.value;

    // Оновити "входить у вартість"
    if (selectedModelIdx !== null) {
      const incl = document.getElementById('includedBlock');
      incl.innerHTML = buildIncludedText(selectedType, selectedConfig);
    }

    // Підказка "найдешевший варіант"
    updateConfigHint();

    // Оновити замок
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
   ПІДКАЗКА "НАЙДЕШЕВШИЙ ВАРІАНТ"
   ============================================================ */
function updateConfigHint() {
  const hint = document.getElementById('configHint');
  if (!hint) return;
  hint.style.display = 'none';
  hint.textContent = '';

  if (!selectedType || !selectedConfig || selectedConfig === 'with_builtin_wicket') return;

  let msg = '';
  if (selectedConfig === 'with_separate_wicket') {
    msg = selectedType === 'forged'
      ? '💡 Найдешевший варіант: ворота 3,6 м + хвіртка 0,9 м = 4,5 м'
      : '💡 Найдешевший варіант: ворота 4,0 м + хвіртка 0,9 м = 4,9 м';
  } else if (selectedConfig === 'without_wicket') {
    msg = selectedType === 'forged'
      ? '💡 Найдешевший варіант — ширина 3,6 м'
      : '💡 Найдешевший варіант — ширина 4,0 м';
  }

  if (msg) {
    hint.textContent = msg;
    hint.style.display = 'block';
  }
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
  if (!hint) return;
  hint.style.display = 'none';
  hint.textContent = '';

  if (!selectedType || !selectedConfig || selectedConfig === 'with_builtin_wicket') return;

  const rawW = document.getElementById('width').value.replace(',', '.');
  const width = parseFloat(rawW);
  if (isNaN(width)) return;

  const std = selectedType === 'forged' ? 4.5 : 4.9;
  if (width === std) return;

  let msg = '';
  if (selectedConfig === 'with_separate_wicket') {
    msg = selectedType === 'forged'
      ? '💡 Якщо розмір ще не визначено — ширина 4,5 м (ворота 3,6 м + хвіртка 0,9 м) зазвичай найвигідніша'
      : '💡 Якщо розмір ще не визначено — ширина 4,9 м (ворота 4,0 м + хвіртка 0,9 м) зазвичай найвигідніша';
  } else if (selectedConfig === 'without_wicket') {
    msg = selectedType === 'forged'
      ? '💡 Якщо розмір ще не визначено — ширина 3,6 м зазвичай найвигідніша'
      : '💡 Якщо розмір ще не визначено — ширина 4,0 м зазвичай найвигідніша';
  }

  if (msg) {
    hint.textContent = msg;
    hint.style.display = 'block';
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

  const matoviy   = c.find(x => x.name && x.name.toLowerCase().includes('матов') && !x.name.toLowerCase().includes('двусторон')) || { surcharge: 300 };
  const dvustoron = c.find(x => x.name && x.name.toLowerCase().includes('двусторон')) || { surcharge: 500 };
  const derevo    = c.find(x => x.name && x.name.toLowerCase().includes('дерево')) || { surcharge: 500 };

  let options = [];

  if (selectedType === 'forged') {
    if (model.noCoating) {
      options = [{ value: 0, label: 'Без профнастилу — тільки ковані елементи', surcharge: 0, fixed: true }];
    } else {
      options = [
        { value: 0,                  label: 'Базовий — глянець',                  surcharge: 0,                sub: '' },
        { value: matoviy.surcharge,  label: `Кращий — матовий +${matoviy.surcharge} грн`,  surcharge: matoviy.surcharge,  sub: '' },
        { value: dvustoron.surcharge, label: `Матовий з обох боків ⭐ +${dvustoron.surcharge} грн`, surcharge: dvustoron.surcharge, badge: '⭐ Обирають найчастіше' },
        { value: derevo.surcharge,   label: `Під дерево / 3D +${derevo.surcharge} грн`,    surcharge: derevo.surcharge,   sub: '' },
      ];
    }
  }

  if (selectedType === 'modern') {
    if (model.note === 'двосторонній у базі') {
      options = [{ value: 0, label: 'Матовий двосторонній 0,45 мм — входить у вартість', surcharge: 0, fixed: true }];
    } else if (model.doubleSided) {
      options = [
        { value: 0,                   label: 'Базовий — матовий односторонній',               surcharge: 0 },
        { value: dvustoron.surcharge, label: `Матовий з обох боків ⭐ +${dvustoron.surcharge} грн`, surcharge: dvustoron.surcharge, badge: '⭐ Обирають найчастіше' },
      ];
    } else {
      options = [{ value: 0, label: 'Матовий кольоровий — входить у вартість', surcharge: 0, fixed: true }];
    }
  }

  options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'radio-option';
    div.dataset.idx = i;

    const badge = opt.badge ? `<span class="radio-badge">${opt.badge}</span>` : '';

    div.innerHTML = `
      <div class="radio-dot"></div>
      <div class="radio-text">
        ${opt.label}
        ${badge}
      </div>
    `;

    if (opt.fixed) {
      // Автоматично вибрати фіксований варіант
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

  // Якщо фіксований — один варіант вже обрано
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
    // Чекбокс замка для кованих
    field.innerHTML = `
      <div class="checkbox-option" id="lockOption" onclick="toggleCheckbox('lockOption', 'lockChecked')">
        <div class="checkbox-box"></div>
        <div class="checkbox-text">
          Замок у хвіртку з встановленням
          <span class="checkbox-sub">Тільки для кованих воріт · +${LOCK_PRICE.toLocaleString('uk-UA')} грн</span>
        </div>
      </div>
    `;
    // Показувати тільки якщо комплектація НЕ "тільки ворота"
    if (selectedConfig === 'without_wicket') {
      document.getElementById('fieldLock').innerHTML = '';
    }
  } else if (selectedType === 'modern') {
    // Замок вже включено
    field.innerHTML = `
      <div class="lock-included-note">
        ✅ Замок вже включено у вартість
      </div>
    `;
    if (selectedConfig === 'without_wicket') {
      document.getElementById('fieldLock').innerHTML = '';
    }
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
  if (stateVar === 'lockChecked')   {}  // зберігається через DOM
}

/* ============================================================
   СТОВПИ — ПОКРОКОВИЙ ВИБІР
   ============================================================ */
let _postType   = null;  // 'painted' | 'unpainted' | 'none'
let _postHeight = null;  // '2.0' | '2.4'

function resetPostSteps() {
  _postType      = null;
  _postHeight    = null;
  selectedPostKey= null;

  // Скинути активні кнопки кроку 1
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

  // Активна кнопка
  document.querySelectorAll('#postStep1 .step-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  // Скинути кроки 2/3
  document.getElementById('postStep2').style.display = 'none';
  document.getElementById('postStep2').innerHTML = '';
  document.getElementById('postStep3').style.display = 'none';
  document.getElementById('postStep3').innerHTML = '';
  document.getElementById('postQtyWrap').style.display = 'none';
  document.getElementById('fieldHinges').style.display = 'none';
  hingesChecked = false;
  const ho = document.getElementById('hingesOption');
  if (ho) ho.classList.remove('checked');

  if (type === 'none') return;

  if (type === 'unpainted') {
    // Нефарбовані — одразу розмір (висота завжди 3.0 м)
    const unpainted = POST_DATA.filter(p => !p.painted);
    renderPostSizeStep('postStep2', unpainted);
    document.getElementById('postStep2').style.display = 'block';
  }

  if (type === 'painted') {
    // Фарбовані — спочатку висота
    renderPostHeightStep('postStep2');
    document.getElementById('postStep2').style.display = 'block';
  }
}

function renderPostHeightStep(stepId) {
  const step = document.getElementById(stepId);
  step.innerHTML = `
    <div class="posts-step" style="margin-top:10px;">
      <div class="posts-step-label">Крок 2 — Висота стовпа</div>
      <div class="step-btns">
        <button class="step-btn" onclick="selectPostHeight('2.0 м')">2,0 м</button>
        <button class="step-btn" onclick="selectPostHeight('2.4 м')">2,4 м</button>
      </div>
    </div>
  `;
}

function selectPostHeight(height) {
  _postHeight = height;

  // Активна кнопка висоти
  document.querySelectorAll('#postStep2 .step-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().replace(',', '.') === height.replace(',', '.').replace(' м', ',0 м') || b.textContent.trim() === height.replace('.', ','));
  });
  // Простіше — знайти кнопку з текстом що містить висоту
  document.querySelectorAll('#postStep2 .step-btn').forEach(b => {
    const h = b.textContent.trim();
    b.classList.toggle('active', height.includes(h.replace(',', '.')));
  });

  // Показати крок 3 — розмір для даної висоти
  const filtered = POST_DATA.filter(p => p.painted && p.height === height);
  renderPostSizeStep('postStep3', filtered);
  document.getElementById('postStep3').style.display = 'block';
}

function renderPostSizeStep(stepId, posts) {
  const step = document.getElementById(stepId);
  const stepNum = stepId === 'postStep2' ? 2 : 3;
  step.innerHTML = `
    <div class="posts-step" style="margin-top:10px;">
      <div class="posts-step-label">Крок ${stepNum} — Розмір перерізу</div>
      <div class="step-btns">
        ${posts.map(p => `
          <button class="step-btn" onclick="selectPostFinal('${p.key}')">
            ${p.name.replace('Нефарбований ', '').replace('Фарбований ', '')}
            <span class="step-btn-sub">${p.chars} · висота ${p.height} · ${p.price.toLocaleString('uk-UA')} грн</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function selectPostFinal(key) {
  selectedPostKey = key;

  // Активна кнопка
  const allBtns = document.querySelectorAll('#postStep2 .step-btn, #postStep3 .step-btn');
  allBtns.forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(key)) {
      b.classList.add('active');
    }
  });

  // Показати лічильник і петлі
  document.getElementById('postQtyWrap').style.display = 'flex';
  document.getElementById('fieldHinges').style.display = 'block';
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
    // Фільтр: тільки з назвою міста/села (не просто область)
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
   ПЕРЕВІРКА "ГОТОВО" — ФРАЗА НАД КНОПКОЮ
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
    setError('modelSelectBtn'); valid = false;
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

  // Ціна воріт
  let gatePrice = calcGatePrice(selectedType, model.price, selectedConfig, width);
  gatePrice += (selectedCoating ? selectedCoating.surcharge : 0);
  if (lockChecked && selectedType === 'forged' && selectedConfig !== 'without_wicket') gatePrice += LOCK_PRICE;
  if (boltsChecked) gatePrice += BOLTS_PRICE;

  // Стовпи
  let postPrice = 0;
  let postInfo  = null;
  if (selectedPostKey && _postType !== 'none') {
    postInfo  = POST_DATA.find(p => p.key === selectedPostKey);
    if (postInfo) postPrice = postInfo.price * postQty;
  }

  // Петлі
  let hingePrice = 0;
  let hingeCount = 0;
  if (hingesChecked && postInfo) {
    if (selectedConfig === 'without_wicket') { hingeCount = 4; }
    else { hingeCount = 6; }
    hingePrice = hingeCount * HINGE_PRICE_PER_UNIT;
  }

  // Кнопка — стан завантаження
  const btn = document.getElementById('calculateBtn');
  btn.textContent = '⏳ Розраховуємо...';
  btn.disabled = true;
  showResult(`<p class="loading">⏳ Розраховуємо доставку...</p>`, false);

  // Доставка
  let deliveryPrice  = null;
  let deliveryStatus = '';
  let meetOnRoad     = null;

  try {
    if (!selectedLat || !selectedLng) throw new Error('no coords');
    const response = await fetch('https://n8n.verbadom.com.ua/webhook/cardinal-delivery-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: selectedLat, lng: selectedLng, city: selectedCityName })
    });
    const data = await response.json();
    meetOnRoad = data.meetOnRoad || null;
    window._lastDeliveryData = data;

    if (data.status === 'on_route')      deliveryStatus = 'on_route';
    else if (data.status === 'deviation') { deliveryPrice = data.price; deliveryStatus = 'deviation'; }
    else if (data.status === 'nova_poshta') { deliveryPrice = 4000; deliveryStatus = 'nova_poshta'; }
    else if (data.status === 'clarify')  deliveryStatus = 'clarify';
    else if (data.status === 'clarify_extended') deliveryStatus = 'clarify_extended';
  } catch (e) {
    deliveryStatus = 'error';
  }

  btn.disabled = false;
  btn.textContent = 'Показати мою ціну →';

  const showPosts   = postInfo && deliveryStatus !== 'nova_poshta';
  const totalComplex = gatePrice + (showPosts ? postPrice : 0) + (showPosts ? hingePrice : 0);
  const totalPrice  = totalComplex + (deliveryPrice || 0);

  const configLabels = {
    with_separate_wicket: 'Ворота + хвіртка окремо',
    without_wicket:       'Тільки ворота',
    with_builtin_wicket:  'Ворота з хвірткою всередині',
  };

  const coatingLabel = selectedCoating ? selectedCoating.label.replace(' ⭐', '').trim() : '';
  const isPopular    = selectedCoating && selectedCoating.badge;
  const showLockIncluded = selectedType === 'modern' && selectedConfig !== 'without_wicket';

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
    html += `<div class="result-row"><span>Замок у хвіртку</span><span style="color:var(--green);">входить у вартість</span></div>`;
  }
  if (lockChecked && selectedType === 'forged' && selectedConfig !== 'without_wicket') {
    html += `<div class="result-row"><span>Замок у хвіртку з встановленням</span><span>+${LOCK_PRICE.toLocaleString('uk-UA')} грн</span></div>`;
  }
  if (boltsChecked) {
    html += `<div class="result-row"><span>Фіксатори створок (2 шт)</span><span>+${BOLTS_PRICE.toLocaleString('uk-UA')} грн</span></div>`;
  }

  if (showPosts && postInfo) {
    html += `<div class="result-row"><span>${postInfo.name}, ${postInfo.height} — ${postQty} шт × ${postInfo.price.toLocaleString('uk-UA')} грн</span><span>${postPrice.toLocaleString('uk-UA')} грн</span></div>`;
    if (hingesChecked && hingeCount > 0) {
      html += `<div class="result-row"><span>Петлі на заводі — ${hingeCount} шт × ${HINGE_PRICE_PER_UNIT.toLocaleString('uk-UA')} грн</span><span>${hingePrice.toLocaleString('uk-UA')} грн</span></div>`;
    }
  }

  html += `<div class="result-row result-subtotal"><span>Ворота з комплектуючими</span><span>${totalComplex.toLocaleString('uk-UA')} грн</span></div>`;

  // Доставка
  if (deliveryStatus === 'on_route') {
    const minT = totalComplex + 500;
    const maxT = totalComplex + 900;
    html += `<div class="result-row"><span>Доставка</span><span>500–900 грн</span></div>`;
    html += `<p class="delivery-note-inline">Точна сума залежить від адреси доставки</p>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>від ${minT.toLocaleString('uk-UA')} до ${maxT.toLocaleString('uk-UA')} грн</span></div>`;
  } else if (deliveryStatus === 'nova_poshta') {
    html += `<div class="result-row"><span>Доставка (Нова Пошта на вантажне відділення)</span><span>4 000 грн</span></div>`;
    if (postInfo) {
      html += `<p class="error-msg">⚠️ Стовпи доставляємо лише разом з воротами машиною заводу. Нова Пошта такі вироби не приймає.</p>`;
    }
    html += `<div class="result-row total"><span>Разом до сплати</span><span>${totalPrice.toLocaleString('uk-UA')} грн</span></div>`;
  } else if (deliveryStatus === 'deviation') {
    const zone = window._lastDeliveryData ? window._lastDeliveryData.zone : '';
    html += `<div class="result-row"><span>Доставка до вашого двору${zone ? ' (' + zone + ')' : ''}</span><span>${deliveryPrice.toLocaleString('uk-UA')} грн</span></div>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>${totalPrice.toLocaleString('uk-UA')} грн</span></div>`;
  } else if (deliveryStatus === 'clarify') {
    const distKm = window._lastDeliveryData ? window._lastDeliveryData.distanceKm : '';
    html += `<div class="result-row"><span>Доставка</span><span><span class="clarify-badge">Уточнюємо з менеджером</span></span></div>`;
    html += `<p class="delivery-note">Відстань від маршруту — ${distKm} км. Зазвичай машина заводу робить адресну доставку до 40 км від маршруту. Ваш випадок — нестандартний, але іноді завод іде назустріч. Зателефонуйте нам — уточнимо, чи можлива доставка машиною і скільки це коштуватиме.<br><br>Можливі варіанти:<br>• Зустріч на трасі (забираєте самостійно) — 350 грн<br>• Нова Пошта на вантажне відділення — 4 000 грн</p>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>уточнення</span></div>`;
  } else if (deliveryStatus === 'clarify_extended') {
    const d = window._lastDeliveryData;
    const minDelivery = d.minDeliveryPrice || 0;
    const novaPrice = d.novaPoshtaPrice || 4000;
    const minTotal = totalComplex + minDelivery;
    const maxTotal = totalComplex + novaPrice;
    html += `<div class="result-row"><span>Доставка</span><span><span class="clarify-badge">Потребує уточнення у логіста</span></span></div>`;
    html += `<p class="delivery-note">Відстань від маршруту — ${d.distanceKm} км. Зазвичай машина заводу робить адресну доставку до 40 км від маршруту. Ваш випадок — нестандартний, але іноді завод іде назустріч. Зателефонуйте нам — уточнимо, чи можлива доставка машиною і скільки це коштуватиме.<br><br>Альтернативи:<br>• Зустріч на трасі (забираєте самостійно) — 350 грн<br>• Нова Пошта на вантажне відділення — ${novaPrice.toLocaleString('uk-UA')} грн</p>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>від ${minTotal.toLocaleString('uk-UA')} до ${maxTotal.toLocaleString('uk-UA')} грн</span></div>`;
  } else {
    html += `<div class="result-row"><span>Доставка</span><span>Уточніть у менеджера</span></div>`;
    html += `<div class="result-row total"><span>Разом до сплати</span><span>уточнення</span></div>`;
  }

  if (meetOnRoad && deliveryStatus !== 'nova_poshta' && deliveryStatus !== 'on_route') {
    html += `<div class="result-row alt-delivery-row"><span>💡 Альтернатива: ${meetOnRoad.note}</span><span>${meetOnRoad.price} грн</span></div>`;
  }

  // Попередження
  html += `<p class="preliminary-note">Орієнтовна ціна. Менеджер уточнить деталі при замовленні 👍</p>`;

  // Контакти
  html += `
    <div class="contacts-block">
      <a href="tel:+380673990560" class="btn-call" id="btnCall" onclick="track('phone_click', selectedCityName)">📞 Зателефонувати нам</a>
      <div class="phone-under">+38 (067) 399-05-60</div>
      <button class="btn-messenger" onclick="toggleMessengerList()">💬 Написати в месенджер</button>
      <div class="messenger-list" id="messengerList">
        <a href="viber://chat?number=%2B380673990560" class="msg-btn viber" onclick="_leadTracker.onMessengerClick('Viber', _lastCalcData); track('contact', selectedCityName);">Viber</a>
        <a href="https://t.me/+380673990560" class="msg-btn telegram" onclick="_leadTracker.onMessengerClick('Telegram', _lastCalcData); track('contact', selectedCityName);">Telegram</a>
        <a href="https://wa.me/380673990560" class="msg-btn whatsapp" onclick="_leadTracker.onMessengerClick('WhatsApp', _lastCalcData); track('contact', selectedCityName);">WhatsApp</a>
      </div>
      <button class="btn-pdf" onclick="generatePDF(); track('pdf_download', selectedCityName);">📄 Зберегти розрахунок PDF</button>
      <a class="share-banner-wrap" onclick="sharePage(); track('share', selectedCityName);" style="cursor:pointer;">
        <img src="banner-share.png" alt="Поділитися калькулятором" />
      </a>
      <div class="bottom-btns">
        <a class="btn-secondary" href="https://verbadom.com.ua/ua/g140836156-vorota-kalitkoj-raspashnye" target="_blank">Всі ворота на сайті →</a>
      </div>
      <p class="promo-line">Потрібен калькулятор для вашого бізнесу? <a href="mailto:buildertools.pro@gmail.com">buildertools.pro@gmail.com</a></p>
    </div>
  `;

  showResult(html, true);

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

  document.getElementById('btnForged').classList.remove('active', 'field-error');
  document.getElementById('btnModern').classList.remove('active', 'field-error');

  document.getElementById('modelSelectText').textContent = '— Оберіть модель —';
  document.getElementById('modelSelectBtn').classList.add('placeholder');
  document.getElementById('modelPhoto').style.display = 'none';
  document.getElementById('includedBlock').style.display = 'none';

  document.getElementById('width').value = '';
  document.getElementById('city').value  = '';
  document.getElementById('city').classList.remove('has-selection');

  document.getElementById('result').classList.add('hidden');
  document.getElementById('result').innerHTML = '';
  document.getElementById('resetBtn').style.display = 'none';
  document.getElementById('calcReadyMsg').style.display = 'none';

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
  hideField('fieldCity');

  clearErrors();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   PDF
   ============================================================ */
async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const isMobile  = /Mobi|Android/i.test(navigator.userAgent);

  const pdfDiv = document.createElement('div');
  pdfDiv.style.cssText = `
    position:fixed; left:-9999px; top:0;
    width:${isMobile ? 420 : 595}px; background:#fff; padding:0;
    font-family:'Segoe UI',Arial,sans-serif;
    color:#1a1a2e; font-size:${isMobile ? 11 : 13}px; line-height:1.5;
  `;

  const now     = new Date();
  const dateStr = now.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const rows = document.querySelectorAll('#result .result-row');
  let rowsHTML = '';
  rows.forEach(row => {
    const spans = row.querySelectorAll('span');
    if (spans.length < 2) return;
    const label      = spans[0].innerText.trim();
    const value      = spans[spans.length - 1].innerText.trim();
    const isTotal    = row.classList.contains('total');
    const isSubtotal = row.classList.contains('result-subtotal');
    const isPopular  = row.classList.contains('popular-badge-row');
    const pad        = isMobile ? '7px 10px' : '10px 12px';
    const padSm      = isMobile ? '5px 10px' : '8px 12px';

    if (isPopular) {
      rowsHTML += `<tr><td colspan="2" style="padding:${isMobile ? '2px 10px 6px' : '2px 12px 8px'};color:#856404;font-size:${isMobile ? 10 : 11}px;">⭐ Найпопулярніший вибір</td></tr>`;
    } else if (isTotal) {
      rowsHTML += `<tr style="background:#2E9B3F;">
        <td style="padding:${pad};color:#fff;font-weight:700;font-size:${isMobile ? 13 : 15}px;">${label}</td>
        <td style="padding:${pad};color:#fff;font-weight:700;font-size:${isMobile ? 13 : 15}px;text-align:right;">${value}</td>
      </tr>`;
    } else if (isSubtotal) {
      rowsHTML += `<tr style="background:#E8F5EB;">
        <td style="padding:${padSm};font-weight:600;color:#1A6B28;">${label}</td>
        <td style="padding:${padSm};font-weight:600;color:#1A6B28;text-align:right;">${value}</td>
      </tr>`;
    } else {
      rowsHTML += `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:${isMobile ? '5px 10px' : '7px 12px'};color:#444;">${label}</td>
        <td style="padding:${isMobile ? '5px 10px' : '7px 12px'};color:#1a1a2e;font-weight:600;text-align:right;">${value}</td>
      </tr>`;
    }
  });

  const delivNoteInline = document.querySelector('#result .delivery-note-inline');
  const delivNoteHTML   = delivNoteInline
    ? `<p style="font-size:${isMobile ? 10 : 11}px;color:#555;margin:4px ${isMobile ? 10 : 12}px 8px;">${delivNoteInline.innerText}</p>`
    : '';

  const errMsg  = document.querySelector('#result .error-msg');
  const errHTML = errMsg
    ? `<p style="font-size:${isMobile ? 10 : 11}px;color:#c0392b;margin:6px ${isMobile ? 10 : 12}px 0;">⚠️ ${errMsg.innerText.replace('⚠️','').trim()}</p>`
    : '';

  const p  = isMobile ? '14px 16px 12px' : '20px 24px 16px';
  const p2 = isMobile ? '10px 16px 6px'  : '14px 24px 8px';
  const p3 = isMobile ? '0 16px'         : '0 24px';
  const p4 = isMobile ? '8px 16px'       : '12px 24px';
  const p5 = isMobile ? '0 16px 16px'    : '0 24px 24px';

  pdfDiv.innerHTML = `
    <div style="border-top:4px solid #2E9B3F;padding:${p};border-bottom:1px solid #e8ecf4;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:${isMobile ? 17 : 22}px;font-weight:900;color:#2E9B3F;letter-spacing:2px;">🌿 VERBADOM</div>
          <div style="font-size:${isMobile ? 10 : 11}px;color:#888;margin-top:2px;">Ворота з доставкою по всій Україні</div>
          <div style="font-size:${isMobile ? 10 : 11}px;color:#888;">verbadom.com.ua</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:${isMobile ? 10 : 11}px;color:#888;">Розрахунок від</div>
          <div style="font-size:${isMobile ? 12 : 13}px;font-weight:600;color:#1A6B28;">${dateStr}</div>
          <div style="font-size:${isMobile ? 10 : 11}px;color:#888;margin-top:3px;">+38 (067) 399-05-60</div>
        </div>
      </div>
    </div>
    <div style="padding:${p2};">
      <div style="font-size:${isMobile ? 13 : 16}px;font-weight:700;color:#1A6B28;">Попередній розрахунок вартості воріт</div>
    </div>
    <div style="padding:${p3};">
      <table style="width:100%;border-collapse:collapse;font-size:${isMobile ? 11 : 13}px;">
        ${rowsHTML}
      </table>
      ${delivNoteHTML}
      ${errHTML}
    </div>
    <div style="margin:${p4};padding:7px 10px;background:#fff8e1;border-radius:6px;border-left:3px solid #EF9F27;">
      <span style="font-size:${isMobile ? 10 : 11}px;color:#7A5800;">⚠️ Орієнтовна ціна. Менеджер уточнить деталі при замовленні.</span>
    </div>
    <div style="margin:${p5};padding:${isMobile ? '10px 12px' : '14px 16px'};background:#E8F5EB;border-radius:8px;border:1px solid #A8D9B0;">
      <div style="font-size:${isMobile ? 11 : 12}px;font-weight:700;color:#1A6B28;margin-bottom:8px;">Зв'яжіться з нами:</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-size:${isMobile ? 12 : 13}px;font-weight:700;color:#1A6B28;">📞 +38 (067) 399-05-60</div>
        <a href="viber://chat?number=%2B380673990560" style="display:inline-block;padding:5px 12px;background:#7360f2;color:#fff;border-radius:20px;text-decoration:none;font-size:${isMobile ? 10 : 11}px;font-weight:600;">Viber</a>
        <a href="https://t.me/+380673990560" style="display:inline-block;padding:5px 12px;background:#2aabee;color:#fff;border-radius:20px;text-decoration:none;font-size:${isMobile ? 10 : 11}px;font-weight:600;">Telegram</a>
        <a href="https://wa.me/380673990560" style="display:inline-block;padding:5px 12px;background:#25d366;color:#fff;border-radius:20px;text-decoration:none;font-size:${isMobile ? 10 : 11}px;font-weight:600;">WhatsApp</a>
      </div>
    </div>
    <div style="border-top:1px solid #eee;padding:8px ${isMobile ? 16 : 24}px;text-align:center;">
      <span style="font-size:${isMobile ? 9 : 10}px;color:#bbb;">Розрахунок: verbadom.com.ua</span>
    </div>
  `;

  document.body.appendChild(pdfDiv);

  try {
    const canvas  = await html2canvas(pdfDiv, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pageW   = 100;
    const pageH   = (canvas.height * pageW) / canvas.width;
    const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageW, pageH] });
    doc.addImage(imgData, 'PNG', 0, 0, pageW, pageH);

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
