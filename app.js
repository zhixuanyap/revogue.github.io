/*
   ReVogue — app.js
   All core logic: state, navigation, auth, toast, colour tool, undertone, custom dropdowns, and init.

   Files loaded before this:
     wardrobe.js: handleUpload, saveItem, deleteItem, renderWardrobe
     recommendation.js: selectMood, getOutfit, OUTFIT_RULES */


/* 1. GLOBAL SHARED STATE */

var wardrobe = [];
var pendingImageDataURL = null;
var selectedMood = 'Confident';

var TYPE_EMOJI = {
  Top: '👕', Bottom: '👖', Dress: '👗',
  Outerwear: '🧥', Shoes: '👟', Accessory: '👜', Bag: '👜'
};

var CHIP_COLOURS = ['#2c6e49', '#a8895c', '#424245', '#86868b', '#52b788'];


/* 2. NAVIGATION */

function showPage(id) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  document.getElementById('page-' + id).classList.add('active');

  document.querySelectorAll('.nav-links a').forEach(function (a) { a.classList.remove('active'); });
  var navEl = document.getElementById('nav-' + id);
  if (navEl) navEl.classList.add('active');

  window.scrollTo(0, 0);

  if (id === 'wardrobe') renderWardrobe();
  if (id === 'outfit') { updateUndertoneHint(); updateMoodPsychCard(selectedMood); initStylePref(); }
  if (id === 'colour') {
    wcActiveTab = 'all';
    wcSelected = [];
    var tabs = document.querySelectorAll('.wc-tab');
    if (tabs.length) {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tabs[0].classList.add('active');
    }
    initColourTool();
  }
}

function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

function guardedNav(pageId) {
  if (!getCurrentUser() && !isGuestMode) {
    showToast('Please sign in or continue as guest.');
    showPage('login');
    return;
  }
  showPage(pageId);
}


/* 3. TOAST */

function showToast(message) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 2800);
}


/* 4. AUTH */

function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

function getUsers() {
  return JSON.parse(localStorage.getItem('revogue-users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('revogue-users', JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('revogue-current-user') || 'null');
}

function setCurrentUser(user) {
  localStorage.setItem('revogue-current-user', JSON.stringify(user));
  wardrobe = JSON.parse(localStorage.getItem('revogue-wardrobe-' + user.email) || '[]');
}

function clearCurrentUser() {
  localStorage.removeItem('revogue-current-user');
  wardrobe = [];
}

function updateNavAuth() {
  var user = getCurrentUser();
  var navAuth = document.getElementById('nav-auth');
  var mobileRow = document.getElementById('mobile-auth-row');

  if (user) {
    navAuth.innerHTML = '<span class="nav-user-greeting">Hi, ' + user.name.split(' ')[0] + '</span><button class="nav-signout" onclick="handleSignOut()">Sign out</button>';
    mobileRow.innerHTML = '<a onclick="handleSignOut();toggleMenu()" style="color:#c0392b;">Sign out</a>';
  } else {
    navAuth.innerHTML = '<a class="nav-cta" onclick="showPage(\'login\')">Sign in</a>';
    mobileRow.innerHTML = '<a onclick="showPage(\'login\');toggleMenu()">Sign in</a>';
  }
}

function showAuthError(elId, msg) {
  var el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.add('show');
}

function clearAuthError(elId) {
  var el = document.getElementById(elId);
  el.textContent = '';
  el.classList.remove('show');
}

function handleLogin() {
  clearAuthError('login-error');
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var password = document.getElementById('login-password').value;

  if (!email || !password) { showAuthError('login-error', 'Please fill in both fields.'); return; }

  var users = getUsers();
  var match = users.find(function (u) { return u.email === email && u.passwordHash === simpleHash(password); });

  if (!match) { showAuthError('login-error', 'Incorrect email or password.'); return; }

  clearGuestMode();
  setCurrentUser(match);
  updateNavAuth();
  showToast('Welcome back, ' + match.name.split(' ')[0] + '! 👋');
  showPage('wardrobe');
}

var pendingUndertone = 'none';

function selectUndertone(el, value) {
  document.querySelectorAll('.undertone-pill').forEach(function (p) { p.classList.remove('selected'); });
  el.classList.add('selected');
  pendingUndertone = value;
}

function handleRegister() {
  clearAuthError('register-error');
  var name = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim().toLowerCase();
  var password = document.getElementById('reg-password').value;

  if (!name || !email || !password) { showAuthError('register-error', 'Please fill in all fields.'); return; }
  if (password.length < 6) { showAuthError('register-error', 'Password must be at least 6 characters.'); return; }
  if (!email.includes('@') || !email.includes('.')) { showAuthError('register-error', 'Please enter a valid email address.'); return; }

  var users = getUsers();
  if (users.find(function (u) { return u.email === email; })) {
    showAuthError('register-error', 'An account with this email already exists.'); return;
  }

  clearGuestMode();
  var newUser = { name: name, email: email, passwordHash: simpleHash(password), undertone: pendingUndertone, stylePref: pendingStylePref, createdAt: Date.now() };
  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);
  updateNavAuth();
  showToast('Account created! Welcome to ReVogue 🎉');
  showPage('wardrobe');
}

function handleSignOut() {
  clearCurrentUser();
  updateNavAuth();
  showToast("You've been signed out.");
  showPage('home');
}


/* 5. UNDERTONE HINT */

var UNDERTONE_HINTS = {
  warm: { label: '🌤 Warm undertone preference active', tip: 'Based on your preference, colours like olive, terracotta, warm browns, peach, and gold tend to feel most harmonious. Every suggestion is just a starting point.' },
  cool: { label: '❄️ Cool undertone preference active', tip: 'Based on your preference, colours like navy, slate blue, cool greens, plum, and silver tend to feel most harmonious. Every suggestion is just a starting point.' },
  neutral: { label: '⚖️ Neutral undertone preference active', tip: 'With a neutral preference, most colour families work well for you. Suggestions focus on contrast and harmony rather than warm or cool direction.' }
};

function updateUndertoneHint() {
  var user = getCurrentUser();
  var hintEl = document.getElementById('undertone-hint');
  if (!hintEl) return;

  if (!user || !user.undertone || user.undertone === 'none') { hintEl.style.display = 'none'; return; }

  var hint = UNDERTONE_HINTS[user.undertone];
  if (!hint) { hintEl.style.display = 'none'; return; }

  hintEl.style.display = 'block';
  hintEl.innerHTML = '<strong>' + hint.label + '</strong><br>' + hint.tip + '<br><a onclick="openUndertoneEditor()" style="color:var(--accent);font-size:12px;cursor:pointer;margin-top:4px;display:inline-block;">Change preference</a>';
}


/* 6. COLOUR TOOL */

var PALETTES = [
  { name: 'Forest & Cream', a: '#2c6e49', b: '#f5efe6' },
  { name: 'Navy & White', a: '#1a3a5c', b: '#f5f5f7' },
  { name: 'Terracotta & Sand', a: '#c8553d', b: '#e8d5b7' },
  { name: 'Dusty Rose & Grey', a: '#c4a0a0', b: '#6b6b72' },
  { name: 'Olive & Camel', a: '#6b7c3d', b: '#a8895c' },
  { name: 'Cobalt & Ivory', a: '#1a5fad', b: '#f8f4ec' },
  { name: 'Mauve & Blush', a: '#8b6b8b', b: '#f2d6d6' },
  { name: 'Charcoal & Ecru', a: '#424245', b: '#f0ebe0' }
];

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b), h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}

function getColourName(h, s, l) {
  if (l < 0.12) return 'Near black';
  if (l > 0.92) return 'Near white';
  if (s < 0.08) return l < 0.45 ? 'Dark grey' : 'Light grey';
  var names = [[0, 'Red'], [20, 'Red-orange'], [35, 'Orange'], [55, 'Yellow'], [80, 'Yellow-green'],
  [150, 'Green'], [165, 'Teal'], [195, 'Cyan'], [225, 'Blue'], [265, 'Blue-purple'],
  [290, 'Purple'], [320, 'Pink'], [345, 'Rose'], [360, 'Red']];
  for (var i = 0; i < names.length - 1; i++) {
    if (h >= names[i][0] && h < names[i + 1][0]) {
      var prefix = l < 0.35 ? 'Dark ' : l > 0.65 ? 'Light ' : '';
      return prefix + names[i][1].toLowerCase();
    }
  }
  return 'Colour';
}

function analyseHarmony(hexA, hexB) {
  var rgb1 = hexToRgb(hexA), rgb2 = hexToRgb(hexB);
  var hsl1 = rgbToHsl(rgb1[0], rgb1[1], rgb1[2]);
  var hsl2 = rgbToHsl(rgb2[0], rgb2[1], rgb2[2]);
  var hueDiff = Math.min(Math.abs(hsl1[0] - hsl2[0]), 360 - Math.abs(hsl1[0] - hsl2[0]));
  var ldiff = Math.abs(hsl1[2] - hsl2[2]);

  if (hueDiff < 30) return {
    badgeClass: 'harmony-good',
    badgeText: '✓ Analogous',
    description: 'Colours sit close together on the colour wheel. Calm, cohesive, and easy to wear.',
    good: 'Works well: Safe and polished. Great for a put-together everyday look.',
    warn: 'Watch out: Can feel flat without texture or tonal variation to add depth.',
  };

  if (hueDiff >= 150 && hueDiff <= 210) return {
    badgeClass: 'harmony-good',
    badgeText: '✓ Complementary',
    description: 'Colours sit opposite on the colour wheel. High visual impact and bold.',
    good: 'Works well: Great for making one colour pop as a strong accent.',
    warn: 'Watch out: Can feel too loud if both colours are equally bright. Let one dominate.',
  };

  if (hueDiff >= 100 && hueDiff < 150) return {
    badgeClass: 'harmony-good',
    badgeText: '✓ Split-Complementary',
    description: 'One colour paired with two colours adjacent to its opposite. Vibrant but balanced.',
    good: 'Works well: More dynamic than analogous, less intense than full complementary.',
    warn: 'Watch out: Keep one colour as the clear lead. Equal tones can feel busy.',
  };

  if (ldiff > 0.4) return {
    badgeClass: 'harmony-good',
    badgeText: '✓ High Contrast',
    description: 'A strong difference in lightness between the two colours. Bold and defined.',
    good: 'Works well: Creates clear outfit structure and a strong visual statement.',
    warn: 'Watch out: Wear the lighter colour as the larger piece to keep it balanced.',
  };

  return {
    badgeClass: 'harmony-warn',
    badgeText: '~ Near Match',
    description: 'Similar but not strongly related colours. Neither clashing nor harmonious.',
    good: 'Works well: Low-key and understated. Can look intentionally tonal.',
    warn: 'Watch out: May look unintentional. Try adding texture or a stronger contrast piece.',
  };
}

function updateHarmony() {
  var elA = document.getElementById('colour-a');
  var elB = document.getElementById('colour-b');
  if (!elA || !elB) return;

  var hexA = elA.value;
  var hexB = elB.value;

  document.getElementById('preview-a').style.background = hexA;
  document.getElementById('preview-b').style.background = hexB;

  var rgb1 = hexToRgb(hexA), rgb2 = hexToRgb(hexB);
  var hsl1 = rgbToHsl(rgb1[0], rgb1[1], rgb1[2]);
  var hsl2 = rgbToHsl(rgb2[0], rgb2[1], rgb2[2]);
  document.getElementById('colour-a-name').textContent = getColourName(hsl1[0], hsl1[1], hsl1[2]);
  document.getElementById('colour-b-name').textContent = getColourName(hsl2[0], hsl2[1], hsl2[2]);

  var result = analyseHarmony(hexA, hexB);
  var badge = document.getElementById('harmony-badge');
  badge.textContent = result.badgeText;
  badge.className = 'harmony-badge ' + result.badgeClass;

  document.getElementById('harmony-tip').innerHTML =
    '<div class="harmony-description">' + result.description + '</div>'
    + '<div class="harmony-positive">✅ ' + result.good + '</div>'
    + '<div class="harmony-negative">⚠️ ' + result.warn + '</div>'
}

function applyPalette(hexA, hexB) {
  document.getElementById('colour-a').value = hexA;
  document.getElementById('colour-b').value = hexB;
  updateHarmony();
}

function initColourTool() {
  var grid = document.getElementById('palette-grid');
  if (!grid) return;

  grid.innerHTML = '';

  PALETTES.forEach(function (p) {
    var btn = document.createElement('button');
    btn.className = 'palette-chip';
    btn.onclick = function () { applyPalette(p.a, p.b); };

    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '6px';
    row.style.marginBottom = '10px';

    var s1 = document.createElement('div');
    s1.style.background = p.a;
    s1.style.borderRadius = '8px';
    s1.style.height = '36px';
    s1.style.flex = '1';

    var s2 = document.createElement('div');
    s2.style.background = p.b;
    s2.style.borderRadius = '8px';
    s2.style.height = '36px';
    s2.style.flex = '1';

    var lbl = document.createElement('div');
    lbl.className = 'palette-name';
    lbl.textContent = p.name;

    row.appendChild(s1);
    row.appendChild(s2);
    btn.appendChild(row);
    btn.appendChild(lbl);
    grid.appendChild(btn);
  });

  renderWardrobeColourPicker();
  updateHarmony();
}


/* WARDROBE COLOUR PICKER */

var wcSelected = [];
var wcActiveTab = 'all';

function setWcTab(type, btn) {
  wcActiveTab = type;
  document.querySelectorAll('.wc-tab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
  renderWardrobeColourPicker();
}

function renderWardrobeColourPicker() {
  var grid = document.getElementById('wardrobe-colour-grid');
  var hintEl = document.getElementById('wardrobe-colour-hint');
  if (!grid) return;

  grid.innerHTML = '';

  if (wardrobe.length === 0) {
    grid.innerHTML = '<div class="wc-empty">Upload clothes to My Wardrobe to use this feature</div>';
    return;
  }

  var items = wcActiveTab === 'all'
    ? wardrobe
    : wardrobe.filter(function (i) { return i.type === wcActiveTab; });

  if (items.length === 0) {
    grid.innerHTML = '<div class="wc-empty">No ' + wcActiveTab + ' items in your wardrobe yet</div>';
    return;
  }

  items.forEach(function (item) {
    var btn = document.createElement('div');
    btn.className = 'wc-item';

    var selIdx = wcSelected.findIndex(function (s) { return s.item.id === item.id; });
    if (selIdx === 0) { btn.classList.add('selected-a'); btn.setAttribute('data-badge', 'A'); }
    if (selIdx === 1) { btn.classList.add('selected-b'); btn.setAttribute('data-badge', 'B'); }

    btn.onclick = function () { wcToggleItem(item, btn); };

    var imgDiv = document.createElement('div');
    imgDiv.className = 'wc-item-img';
    if (item.image) {
      var img = document.createElement('img');
      img.src = item.image;
      img.alt = item.type;
      imgDiv.appendChild(img);
    } else {
      var emojiMap = { Top: '👕', Bottom: '👖', Dress: '👗', Outerwear: '🧥', Shoes: '👟', Accessory: '👜', Bag: '👜' };
      imgDiv.textContent = emojiMap[item.type] || '👗';
    }

    var info = document.createElement('div');
    info.className = 'wc-item-info';
    info.innerHTML = '<div class="wc-item-type">' + item.type + '</div>'
      + '<div class="wc-item-name">' + item.colour + '</div>';

    var dot = document.createElement('div');
    dot.className = 'wc-item-dot';
    dot.style.background = wcHexFromName(item.colour);

    var badge = document.createElement('div');
    badge.className = 'wc-badge';
    badge.textContent = selIdx === 0 ? 'A' : selIdx === 1 ? 'B' : '';

    btn.appendChild(imgDiv);
    btn.appendChild(info);
    btn.appendChild(dot);
    btn.appendChild(badge);
    grid.appendChild(btn);
  });
}

function wcToggleItem(item, btn) {
  var hintEl = document.getElementById('wardrobe-colour-hint');

  if (btn.classList.contains('selected-a') || btn.classList.contains('selected-b')) {
    btn.classList.remove('selected-a', 'selected-b');
    btn.querySelector('.wc-badge').textContent = '';
    wcSelected = wcSelected.filter(function (s) { return s.item.id !== item.id; });

    wcSelected.forEach(function (s, i) {
      s.btn.classList.remove('selected-a', 'selected-b');
      s.btn.classList.add(i === 0 ? 'selected-a' : 'selected-b');
      s.btn.querySelector('.wc-badge').textContent = i === 0 ? 'A' : 'B';
    });

    wcUpdateHint(hintEl);
    return;
  }

  if (wcSelected.length >= 2) {
    var old = wcSelected.shift();
    old.btn.classList.remove('selected-a', 'selected-b');
    old.btn.querySelector('.wc-badge').textContent = '';

    if (wcSelected.length === 1) {
      wcSelected[0].btn.classList.remove('selected-a', 'selected-b');
      wcSelected[0].btn.classList.add('selected-a');
      wcSelected[0].btn.querySelector('.wc-badge').textContent = 'A';
    }
  }

  var slot = wcSelected.length === 0 ? 'selected-a' : 'selected-b';
  btn.classList.add(slot);
  btn.querySelector('.wc-badge').textContent = wcSelected.length === 0 ? 'A' : 'B';
  wcSelected.push({ item: item, btn: btn });

  if (wcSelected.length === 2) {
    var hexA = wcHexFromName(wcSelected[0].item.colour);
    var hexB = wcHexFromName(wcSelected[1].item.colour);
    document.getElementById('colour-a').value = hexA;
    document.getElementById('colour-b').value = hexB;
    updateHarmony();
    if (hintEl) hintEl.textContent = 'Analysing: ' + wcSelected[0].item.colour + ' + ' + wcSelected[1].item.colour;
  } else {
    wcUpdateHint(hintEl);
  }
}

function wcUpdateHint(hintEl) {
  if (!hintEl) return;
  if (wcSelected.length === 0) hintEl.textContent = 'Select 2 items to analyse their colours';
  else if (wcSelected.length === 1) hintEl.textContent = 'Select 1 more item';
}

function wcHexFromName(colourText) {
  var t = (colourText || '').toLowerCase();
  var map = [
    [/\bblack\b/, '#1d1d1f'],
    [/\bwhite\b/, '#f5f5f7'],
    [/\bnavy\b/, '#1a3a5c'],
    [/\bblue\b/, '#378add'],
    [/\bsky.?blue\b/, '#b5d4f4'],
    [/\bgrey\b|\bgray\b/, '#86868b'],
    [/\bcharcoal\b/, '#424245'],
    [/\bbeige\b|\bcream\b|\bivory\b/, '#f5efe6'],
    [/\bkhaki\b|\btan\b/, '#a8895c'],
    [/\bbrown\b/, '#7c5c3a'],
    [/\bcamel\b/, '#c9a96e'],
    [/\bolive\b/, '#6b7c3d'],
    [/\bgreen\b/, '#2c6e49'],
    [/\bsage\b/, '#97c459'],
    [/\bred\b|\bscarlet\b|\bburgundy\b/, '#e24b4a'],
    [/\bpink\b|\bblush\b|\brose\b/, '#d4537e'],
    [/\borange\b|\bcoral\b/, '#ef9f27'],
    [/\byellow\b|\bgold\b|\bamber\b/, '#f4c040'],
    [/\bpurple\b|\bviolet\b|\bplum\b/, '#7f77dd'],
    [/\blavender\b/, '#c4b8f0'],
    [/\bmauve\b/, '#8b6b8b'],
    [/\bteal\b|\bcyan\b/, '#1d9e75'],
  ];
  for (var i = 0; i < map.length; i++) {
    if (map[i][0].test(t)) return map[i][1];
  }
  return '#86868b';
}


/* 7. CUSTOM DROPDOWNS */

function rvToggle(dropdown) {
  var isOpen = dropdown.classList.contains('open');
  document.querySelectorAll('.rv-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
  if (!isOpen) dropdown.classList.add('open');
}

function rvClose(dropdown) {
  setTimeout(function () { dropdown.classList.remove('open'); }, 150);
}

function rvSelect(id, el) {
  var dropdown = document.getElementById('rv-' + id);
  if (!dropdown) return;
  dropdown.querySelector('.rv-value').textContent = el.textContent.trim();
  dropdown.querySelectorAll('.rv-option').forEach(function (o) { o.classList.remove('selected'); });
  el.classList.add('selected');
  dropdown.classList.remove('open');

  if (id === 'outfit-occasion' || id === 'outfit-season' || id === 'outfit-weather') {
    if (typeof updateMoodPsychCard === 'function' && typeof selectedMood !== 'undefined') {
      setTimeout(function () { updateMoodPsychCard(selectedMood); }, 0);
    }
  }
}

function rvGetValue(id) {
  var dropdown = document.getElementById('rv-' + id);
  if (!dropdown) return '';
  return dropdown.querySelector('.rv-value').textContent.trim();
}

function rvReset(id, value) {
  var dropdown = document.getElementById('rv-' + id);
  if (!dropdown) return;
  dropdown.querySelector('.rv-value').textContent = value;
  dropdown.querySelectorAll('.rv-option').forEach(function (o) {
    o.classList.toggle('selected', o.textContent.trim() === value);
  });
}

document.addEventListener('click', function (e) {
  if (!e.target.closest('.rv-dropdown')) {
    document.querySelectorAll('.rv-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
  }
});


/* 8. INIT */

(function init() {
  updateNavAuth();
  var user = getCurrentUser();
  if (user) {
    wardrobe = JSON.parse(localStorage.getItem('revogue-wardrobe-' + user.email) || '[]');
  }
})();


/* SHOW / HIDE PASSWORD */

function togglePassword(inputId, btn) {
  var input = document.getElementById(inputId);
  var iconShow = btn.querySelector('.pw-icon-show');
  var iconHide = btn.querySelector('.pw-icon-hide');

  if (input.type === 'password') {
    input.type = 'text';
    iconShow.style.display = 'none';
    iconHide.style.display = 'block';
    btn.setAttribute('aria-label', 'Hide password');
  } else {
    input.type = 'password';
    iconShow.style.display = 'block';
    iconHide.style.display = 'none';
    btn.setAttribute('aria-label', 'Show password');
  }
}


/* EDIT UNDERTONE PREFERENCE */

var pendingEditUndertone = 'none';

function openUndertoneEditor() {
  var user = getCurrentUser();
  if (!user) return;

  pendingEditUndertone = user.undertone || 'none';

  var pills = document.querySelectorAll('#edit-undertone-pills .undertone-pill');
  pills.forEach(function (pill) {
    var val = pill.getAttribute('onclick').match(/'([^']+)'\)/)[1];
    pill.classList.toggle('selected', val === pendingEditUndertone);
  });

  document.getElementById('modal-undertone').classList.add('open');
}

function selectEditUndertone(el, value) {
  document.querySelectorAll('#edit-undertone-pills .undertone-pill').forEach(function (p) {
    p.classList.remove('selected');
  });
  el.classList.add('selected');
  pendingEditUndertone = value;
}

function saveUndertoneEdit() {
  var user = getCurrentUser();
  if (!user) return;

  user.undertone = pendingEditUndertone;

  var users = getUsers();
  var idx = users.findIndex(function (u) { return u.email === user.email; });
  if (idx !== -1) users[idx] = user;
  saveUsers(users);

  setCurrentUser(user);

  closeModal('modal-undertone');
  updateUndertoneHint();
  showToast('✓ Colour preference updated');
}


/* 9. WARDROBE TABS */

var activeWardrobeFilter = 'all';
var activeWardrobeSubfilter = 'all';

function setWardrobeFilter(filter, btn) {
  activeWardrobeFilter = filter;
  activeWardrobeSubfilter = 'all';

  document.querySelectorAll('.wtab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');

  var subfilterRow = document.getElementById('wardrobe-subfilters');
  if (filter === 'all') {
    subfilterRow.style.display = 'none';
  } else {
    subfilterRow.style.display = 'block';
    buildSubfilterPills(filter);
  }

  renderWardrobe();
}

function buildSubfilterPills(filter) {
  var pillsEl = document.getElementById('wardrobe-subfilter-pills');
  if (!pillsEl) return;

  var values = ['all'];
  wardrobe.forEach(function (item) {
    var val = filter === 'type' ? item.type : item.occasion;
    if (val && values.indexOf(val) === -1) values.push(val);
  });

  pillsEl.innerHTML = values.map(function (val) {
    var count = val === 'all' ? wardrobe.length
      : wardrobe.filter(function (i) {
        return (filter === 'type' ? i.type : i.occasion) === val;
      }).length;
    var label = val === 'all' ? 'All' : val;
    var active = val === activeWardrobeSubfilter ? ' active' : '';
    return '<button class="subfilter-pill' + active + '" onclick="setSubfilter(\'' + val + '\', this)">'
      + label + ' <span class="pill-count">' + count + '</span></button>';
  }).join('');
}

function setSubfilter(value, btn) {
  activeWardrobeSubfilter = value;
  document.querySelectorAll('.subfilter-pill').forEach(function (p) { p.classList.remove('active'); });
  btn.classList.add('active');
  renderWardrobe();
}

function getFilteredWardrobe() {
  if (activeWardrobeFilter === 'all' || activeWardrobeSubfilter === 'all') {
    return wardrobe;
  }
  return wardrobe.filter(function (item) {
    if (activeWardrobeFilter === 'type') return item.type === activeWardrobeSubfilter;
    if (activeWardrobeFilter === 'occasion') return item.occasion === activeWardrobeSubfilter;
    return true;
  });
}

function updateWardrobeCounts() {
  var countEl = document.getElementById('wardrobe-item-count');
  var allBadge = document.getElementById('wcount-all');
  if (countEl) {
    var filtered = getFilteredWardrobe();
    countEl.textContent = filtered.length + ' item' + (filtered.length !== 1 ? 's' : '');
  }
  if (allBadge) allBadge.textContent = wardrobe.length;
}


/* 10. SAVED OUTFITS */

var activeSavedFilter = 'all';

function getSavedOutfits() {
  var user = getCurrentUser();
  var key = user ? 'revogue-saved-outfits-' + user.email : 'revogue-saved-outfits';
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function persistSavedOutfits(outfits) {
  var user = getCurrentUser();
  var key = user ? 'revogue-saved-outfits-' + user.email : 'revogue-saved-outfits';
  localStorage.setItem(key, JSON.stringify(outfits));
}

function saveCurrentOutfit() {
  if (typeof checkGuestSave === 'function' && checkGuestSave()) return;
  var titleEl = document.getElementById('outfit-title');
  var btn = document.getElementById('save-outfit-btn');

  if (!titleEl || !titleEl.textContent.trim()) {
    showToast('Generate an outfit first before saving.');
    return;
  }

  var lastItems = (typeof lastChosenItems !== 'undefined' && lastChosenItems)
    ? lastChosenItems
    : [];

  var newOutfit = {
    id: Date.now(),
    title: titleEl.textContent.trim(),
    items: lastItems.map(function (item) {
      return {
        type: item.type,
        colour: item.colour,
        preloved: item.preloved || false,
        image: item.image || null
      };
    }),
    mood: selectedMood,
    occasion: rvGetValue('outfit-occasion'),
    savedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  };

  var outfits = getSavedOutfits();

  if (outfits.some(function (o) { return o.title === newOutfit.title; })) {
    showToast('This outfit is already saved.');
    return;
  }

  outfits.unshift(newOutfit);
  persistSavedOutfits(outfits);

  if (btn) {
    btn.textContent = '✓ Saved';
    btn.classList.add('saved');
    setTimeout(function () {
      btn.textContent = '🤍 Save this outfit';
      btn.classList.remove('saved');
    }, 2000);
  }

  showToast('✓ Outfit saved to your wardrobe');
  renderSavedOutfits();
}

function deleteSavedOutfit(id) {
  var outfits = getSavedOutfits().filter(function (o) { return o.id !== id; });
  persistSavedOutfits(outfits);
  renderSavedOutfits();
  showToast('Outfit removed');
}

function setSavedOutfitFilter(value, btn) {
  activeSavedFilter = value;
  document.querySelectorAll('.saved-filter-pill').forEach(function (p) {
    p.classList.remove('active');
  });
  btn.classList.add('active');
  renderSavedOutfits();
}

function renderSavedOutfits() {
  var section = document.getElementById('saved-outfits-section');
  var pillsRow = document.getElementById('saved-filter-pills-row');
  var grid = document.getElementById('saved-outfits-grid');
  var countEl = document.getElementById('saved-outfits-count');
  if (!section || !grid) return;

  var outfits = getSavedOutfits();

  if (outfits.length === 0) {
    section.style.display = 'none';
    activeSavedFilter = 'all';
    if (pillsRow) pillsRow.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  if (countEl) countEl.textContent = outfits.length + ' saved';

  // Build occasion filter pills
  var occasions = ['all'];
  outfits.forEach(function (o) {
    if (o.occasion && occasions.indexOf(o.occasion) === -1) {
      occasions.push(o.occasion);
    }
  });

  // Only show pills if more than one occasion exists
  if (pillsRow) {
    if (occasions.length > 2) {
      pillsRow.innerHTML = '<div class="saved-filter-pills">'
        + occasions.map(function (occ) {
          var label = occ === 'all' ? 'All' : occ;
          var count = occ === 'all'
            ? outfits.length
            : outfits.filter(function (o) { return o.occasion === occ; }).length;
          var active = occ === activeSavedFilter ? ' active' : '';
          return '<button class="saved-filter-pill' + active + '" onclick="setSavedOutfitFilter(\'' + occ + '\', this)">'
            + label + ' <span class="saved-filter-count">' + count + '</span></button>';
        }).join('')
        + '</div>';
    } else {
      pillsRow.innerHTML = '';
    }
  }

  // Apply active filter
  var filtered = activeSavedFilter === 'all'
    ? outfits
    : outfits.filter(function (o) { return o.occasion === activeSavedFilter; });

  // Build outfit cards
  grid.innerHTML = filtered.length === 0
    ? '<div class="saved-empty-filter">No saved outfits for this occasion yet.</div>'
    : filtered.map(function (o) {
      var photosHtml = o.items.slice(0, 4).map(function (item) {
        if (item.image) {
          return '<div class="saved-outfit-photo"><img src="' + item.image + '" alt="' + item.type + '"></div>';
        } else {
          var emoji = { Top: '👕', Bottom: '👖', Dress: '👗', Outerwear: '🧥', Shoes: '👟', Accessory: '👜', Bag: '👜' };
          return '<div class="saved-outfit-photo saved-outfit-photo-placeholder">' + (emoji[item.type] || '👗') + '</div>';
        }
      }).join('');

      var itemsHtml = o.items.slice(0, 3).map(function (item) {
        return '<div class="saved-outfit-card-item">'
          + item.type + ': ' + item.colour
          + (item.preloved ? ' ♻️' : '')
          + '</div>';
      }).join('');

      return '<div class="saved-outfit-card">'
        + '<button class="saved-outfit-card-delete" onclick="deleteSavedOutfit(' + o.id + ')" title="Remove">✕</button>'
        + '<div class="saved-outfit-photos">' + photosHtml + '</div>'
        + '<div class="saved-outfit-card-label">Saved outfit</div>'
        + '<div class="saved-outfit-card-title">' + o.title + '</div>'
        + '<div class="saved-outfit-card-items">' + itemsHtml + '</div>'
        + '<div class="saved-outfit-card-mood">✨ ' + o.mood + ' · ' + o.occasion + ' · ' + o.savedAt + '</div>'
        + '</div>';
    }).join('');
}


/* 11. STYLE PREFERENCE */

var pendingStylePref = 'none';
var currentStylePref = 'none';

function selectStylePref(el, value) {
  document.querySelectorAll('#reg-style-pills .style-pill').forEach(function (p) {
    p.classList.remove('selected');
  });
  el.classList.add('selected');
  pendingStylePref = value;
}

function selectOutfitStyle(el, value) {
  document.querySelectorAll('#outfit-style-pills .style-pill-sm').forEach(function (p) {
    p.classList.remove('active');
  });
  el.classList.add('active');
  currentStylePref = value;

  var user = getCurrentUser();
  if (user) {
    user.stylePref = value;
    var users = getUsers();
    var idx = users.findIndex(function (u) { return u.email === user.email; });
    if (idx !== -1) users[idx] = user;
    saveUsers(users);
    setCurrentUser(user);
  }
}

function getStylePref() {
  return currentStylePref || 'none';
}

function initStylePref() {
  var user = getCurrentUser();
  var pref = (user && user.stylePref) ? user.stylePref : 'none';
  currentStylePref = pref;

  var pills = document.querySelectorAll('#outfit-style-pills .style-pill-sm');
  pills.forEach(function (pill) {
    var match = pill.getAttribute('onclick').match(/'([^']+)'\)/);
    var val = match ? match[1] : '';
    pill.classList.toggle('active', val === pref);
  });
}


/* GUEST MODE */

var isGuestMode = false;

function continueAsGuest() {
  isGuestMode = true;
  wardrobe = [];

  var navAuth = document.getElementById('nav-auth');
  if (navAuth) {
    navAuth.innerHTML = '<span class="nav-guest-pill">Guest</span>'
      + '<a class="nav-cta" onclick="showPage(\'register\')">Sign up</a>';
  }

  var banner = document.getElementById('guest-banner');
  if (banner) banner.style.display = 'flex';

  document.body.classList.add('guest-mode');

  showPage('home');
  showToast('Browsing as guest — changes won\'t be saved 👋');
}

function checkGuestSave() {
  if (!isGuestMode) return false;
  showToast('Create a free account to save your wardrobe ✨');
  setTimeout(function () { showPage('register'); }, 1500);
  return true;
}

function clearGuestMode() {
  isGuestMode = false;
  var banner = document.getElementById('guest-banner');
  if (banner) banner.style.display = 'none';
  document.body.classList.remove('guest-mode');
}