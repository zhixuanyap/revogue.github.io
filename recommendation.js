/* 
   ReVogue: recommendation.js
   Handles outfit generation: mood selection, outfit rules, and the getOutfit() function.
   Depends on: app.js (wardrobe, selectedMood, CHIP_COLOURS, getCurrentUser, showToast) */

/**
 * Handle mood pill selection: only one can be active at a time.
 * Updates the global selectedMood variable in app.js.
 * @param {HTMLElement} el - the pill button that was clicked
 */
function selectMood(el) {
  document.querySelectorAll('.mood-pill').forEach(function (p) { p.classList.remove('selected'); });
  el.classList.add('selected');
  selectedMood = el.textContent.replace(/[^\w ]/g, '').trim().split(' ')[0];
  updateMoodPsychCard(selectedMood);
}

const OUTFIT_RULES = {
  Confident: {
    Casual: {
      title: 'Clean and Confident',
      explanation: '<strong>Why this works:</strong> White and clean tones keep you looking sharp without trying too hard. This palette feels calm, confident, and ready for anything.'
    },
    Work: {
      title: 'Sharp at Work',
      explanation: '<strong>Why this works:</strong> Navy and white are a classic power combo that always looks professional. Clean and authoritative without being too stiff.'
    },
    Formal: {
      title: 'Power Dressing',
      explanation: '<strong>Why this works:</strong> Head-to-toe dark tones make a bold, polished statement. Simple and powerful, no accessories needed.'
    },
    Sport: {
      title: 'Ready to Move',
      explanation: '<strong>Why this works:</strong> Bold, energising colours keep you motivated and in the zone.'
    },
    Lounge: {
      title: 'Comfortably Confident',
      explanation: '<strong>Why this works:</strong> Neutral basics that still look intentional. You can be comfortable and confident at the same time.'
    }
  },
  Calm: {
    Casual: {
      title: 'Easy and Relaxed',
      explanation: '<strong>Why this works:</strong> Soft, muted tones keep everything low-key and grounded. Great for days when you want to feel relaxed but still put together.'
    },
    Work: {
      title: 'Calm and Focused',
      explanation: '<strong>Why this works:</strong> Cool, understated colours help you stay focused and composed. A calm palette for a productive day.'
    },
    Formal: {
      title: 'Cool and Composed',
      explanation: '<strong>Why this works:</strong> Blue-grey tones in a refined outfit feel composed and polished. Calm confidence at its best.'
    },
    Sport: {
      title: 'Mindful Workout',
      explanation: '<strong>Why this works:</strong> Soft tones for mindful movement. Great for yoga, pilates, or a light workout.'
    },
    Lounge: {
      title: 'Soft Sunday Mood',
      explanation: '<strong>Why this works:</strong> Gentle, neutral tones create a restful and cosy feel. Perfect for a slow, easy day at home.'
    }
  },
  Playful: {
    Casual: {
      title: 'Fun and Colourful',
      explanation: '<strong>Why this works:</strong> Warm, mixed tones say open, fun, and ready to socialise. Great energy for a casual day out.'
    },
    Work: {
      title: 'Playful but Professional',
      explanation: '<strong>Why this works:</strong> A playful accent within a professional outfit shows creativity without being too loud. Use colour as a pop, not the whole story.'
    },
    Formal: {
      title: 'A Touch of Fun',
      explanation: '<strong>Why this works:</strong> One unexpected colour against a classic base adds personality without losing sophistication. Just enough to stand out.'
    },
    Sport: {
      title: 'High Energy Look',
      explanation: '<strong>Why this works:</strong> Bold, bright activewear makes movement feel like a celebration. High energy, high fun.'
    },
    Lounge: {
      title: 'Happy at Home',
      explanation: "<strong>Why this works:</strong> Playful colour in loungewear makes rest feel joyful, not lazy. Fun starts at home."
    }
  },
  Energetic: {
    Casual: {
      title: 'Bold and Ready',
      explanation: '<strong>Why this works:</strong> Warm, bold tones signal readiness and momentum. Perfect for a busy, social day.'
    },
    Work: {
      title: 'Driven and Sharp',
      explanation: '<strong>Why this works:</strong> Sharp contrasts and strong colours channel your energy into a confident professional look.'
    },
    Formal: {
      title: 'Make an Impression',
      explanation: '<strong>Why this works:</strong> A warm accent against a neutral base makes a memorable impression. Bold but balanced.'
    },
    Sport: {
      title: 'Full Power Mode',
      explanation: '<strong>Why this works:</strong> High-contrast activewear in warm tones boosts performance energy. Made for intensity.'
    },
    Lounge: {
      title: 'Bright and Restful',
      explanation: '<strong>Why this works:</strong> Even at rest, energetic colours keep your momentum alive. Active recovery looks good too.'
    }
  },
  Natural: {
    Casual: {
      title: 'Earthy and Easy',
      explanation: '<strong>Why this works:</strong> Earthy greens and warm neutrals connect you to nature. Effortlessly grounded and genuine.'
    },
    Work: {
      title: 'Grounded at Work',
      explanation: '<strong>Why this works:</strong> Olive, stone, and warm whites feel calm, and reliable in a professional setting.'
    },
    Formal: {
      title: 'Nature Meets Elegance',
      explanation: '<strong>Why this works:</strong> Champagne, moss, and warm ivory bring a refined naturalness to formal dressing. Elegant and real.'
    },
    Sport: {
      title: 'Ready for the Outdoors',
      explanation: '<strong>Why this works:</strong> Earthy tones in activewear are perfect for outdoor movement and hiking. Trail-ready style.'
    },
    Lounge: {
      title: 'Simple and Earthy',
      explanation: '<strong>Why this works:</strong> Natural tones in soft fabrics make rest feel restorative.'
    }
  },
  Understated: {
    Casual: {
      title: 'Simple and Stylish',
      explanation: '<strong>Why this works:</strong> Tonal neutrals in greige, slate, and charcoal are the essence of quiet luxury. Let the silhouette do the talking.'
    },
    Work: {
      title: 'Minimal and Sharp',
      explanation: '<strong>Why this works:</strong> A monochromatic neutral palette says you have taste and do not need to announce it.'
    },
    Formal: {
      title: 'Classic Power Look',
      explanation: '<strong>Why this works:</strong> All-black or deep charcoal is timeless, powerful, and always right for a formal setting.'
    },
    Sport: {
      title: 'Clean Sport Look',
      explanation: "<strong>Why this works:</strong> Monochrome activewear is the minimalist athlete look. Serious, clean, distraction-free."
    },
    Lounge: {
      title: 'Effortless Comfort',
      explanation: '<strong>Why this works:</strong> Barely-there neutral tones in lounge dressing create a calm, personal space.'
    }
  }
};

/**
 * Simple colour family detector: groups colours into neutral/warm/cool/bold.
 * Used to avoid clashing combinations in the outfit picker.
 * @param {string} colourText - e.g. "Supreme red jacket"
 * @returns {string} 'neutral' | 'warm' | 'cool' | 'bold'
 */
function getColourFamily(colourText) {
  var text = colourText.toLowerCase();
  if (/\b(black|white|grey|gray|cream|beige|ivory|nude|off.white|khaki|camel|tan|brown|chocolate|charcoal|stone|sand|oatmeal|silver|gold)\b/.test(text)) return 'neutral';
  if (/\b(navy|blue|slate|cobalt|teal|cyan|mint|turquoise|indigo|violet|purple|lavender|plum|lilac|periwinkle|sage|olive|green|emerald|forest|hunter)\b/.test(text)) return 'cool';
  if (/\b(red|orange|yellow|amber|coral|rust|burgundy|wine|maroon|scarlet|pink|rose|blush|peach|terracotta|mustard|copper)\b/.test(text)) return 'warm';
  return 'neutral';
}

/**
 * Determine which item types make sense for the current context.
 * Returns an object describing what to include/exclude.
 */
function getOutfitContext(occasion, season, weather) {
  var hot = weather === 'Hot' || weather === 'Warm' || season === 'Summer';
  var cold = weather === 'Cold' || weather === 'Rainy' || season === 'Winter';
  var cool = weather === 'Cool' || season === 'Autumn' || season === 'Spring';
  var sport = occasion === 'Sport';
  var formal = occasion === 'Formal' || occasion === 'Work';
  var lounge = occasion === 'Lounge';
  return {
    includeOuterwear: cold || (cool && !sport) || formal,
    avoidOuterwear: hot || sport,
    preferLightBottom: hot && sport,
    formalShoes: formal,
    sportShoes: sport,
    casualShoes: !formal && !sport,
    includeBag: !sport,
    includeAccessory: true,
    isFormal: formal,
    isSport: sport,
    isLounge: lounge,
    isHot: hot,
    isCold: cold,
    isCool: cool
  };
}

/**
 * Score an item's suitability for a style preference.
 * Higher = better match. Used to sort pools before picking.
 * @param {object} item
 * @param {string} stylePref - 'feminine' | 'masculine' | 'androgynous (unisex)' | 'none'
 * @returns {number}
 */
function styleScore(item, stylePref) {
  if (!stylePref || stylePref === 'none') return 1;
  var type = (item.type || '').toLowerCase();
  var colour = (item.colour || '').toLowerCase();
  var colFam = getColourFamily(item.colour);
  if (stylePref === 'masculine') {
    if (type === 'dress') return -1;
    if (/\b(pink|blush|rose|floral|ruffle|lace)\b/.test(colour)) return -1;
    if (/\b(trouser|chino|denim|jacket|blazer|coat|polo|oxford|boot|loafer)\b/.test(colour + ' ' + type)) return 2;
    if (colFam === 'neutral') return 1;
    return 0;
  }
  if (stylePref === 'feminine') {
    if (/\b(hoodie|tracksuit|cargo|baggy)\b/.test(colour + ' ' + type)) return 0;
    if (type === 'dress') return 2;
    if (/\b(pink|blush|rose|floral|skirt|wrap|silk|satin)\b/.test(colour)) return 2;
    if (colFam === 'warm') return 1;
    return 1;
  }
  if (stylePref === 'androgynous (unisex)') {
    if (type === 'dress') return -1;
    if (colFam === 'neutral') return 2;
    if (/\b(oversized|wide|straight|minimal|clean)\b/.test(colour)) return 2;
    return 1;
  }
  return 1;
}

/**
 * Filter and sort a pool by style preference.
 * Removes items with a negative score, sorts the rest highest first.
 */
function filterByStyle(pool, stylePref) {
  if (!stylePref || stylePref === 'none' || !pool || pool.length === 0) return pool;
  var scored = pool.map(function (item) {
    return { item: item, score: styleScore(item, stylePref) };
  }).filter(function (s) { return s.score >= 0; });
  scored.sort(function (a, b) { return b.score - a.score; });
  return scored.map(function (s) { return s.item; });
}

/**
 * Smart outfit picker: builds a contextually logical outfit.
 */
function pickItems(occasion, season, weather) {
  var ctx = getOutfitContext(occasion, season, weather);
  var stylePref = (typeof getStylePref === 'function') ? getStylePref() : 'none';

  function getPool(types) {
    var byOccasion = wardrobe.filter(function (i) {
      return types.indexOf(i.type) !== -1 && i.occasion === occasion;
    });
    var any = wardrobe.filter(function (i) { return types.indexOf(i.type) !== -1; });
    var pool = byOccasion.length > 0 ? byOccasion : any;
    if (ctx.isFormal) {
      var noShorts = pool.filter(function (i) {
        return !/\b(short|shorts|mini|brief)\b/i.test(i.colour);
      });
      if (noShorts.length > 0) pool = noShorts;
    }
    return filterByStyle(pool, stylePref);
  }

  function pickRandom(pool) {
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  var accentChosen = false;

  function isSafe(item) {
    var fam = getColourFamily(item.colour);
    var isNavy = /\bnavy\b/.test(item.colour.toLowerCase());
    if (ctx.isFormal) return fam === 'neutral' || isNavy;
    if (fam === 'neutral') return true;
    if (!accentChosen) return true;
    return false;
  }

  function pickSafe(pool) {
    if (!pool || pool.length === 0) return null;
    var safe = pool.filter(isSafe);
    if (safe.length === 0) {
      var neutrals = pool.filter(function (i) { return getColourFamily(i.colour) === 'neutral'; });
      safe = neutrals.length > 0 ? neutrals : pool;
    }
    return pickRandom(safe);
  }

  var outfit = [];
  var usedIds = [];

  function addItem(item) {
    if (!item) return;
    if (usedIds.indexOf(item.id) !== -1) return;
    outfit.push(item);
    usedIds.push(item.id);
    var fam = getColourFamily(item.colour);
    var isNavy = /\bnavy\b/.test(item.colour.toLowerCase());
    if (fam !== 'neutral' && !isNavy) accentChosen = true;
  }

  // 1. TOP or DRESS
  var dressPool = ctx.isSport ? [] : getPool(['Dress']);
  var topPool = getPool(['Top']);
  var chosenDress = pickSafe(dressPool);
  var hasDress = false;
  if (chosenDress) {
    addItem(chosenDress);
    hasDress = true;
  } else {
    addItem(pickSafe(topPool));
  }

  // 2. BOTTOM only if no dress was chosen
  if (!hasDress) {
    var bottomPool = getPool(['Bottom']);
    addItem(pickSafe(bottomPool));
  }

  // 3. OUTERWEAR
  if (!ctx.avoidOuterwear) {
    var outerPool = getPool(['Outerwear']);
    if (ctx.includeOuterwear) {
      addItem(pickSafe(outerPool));
    } else {
      var outerMatch = outerPool.filter(function (i) { return i.occasion === occasion; });
      if (outerMatch.length > 0) addItem(pickSafe(outerMatch));
    }
  }

  // 4. SHOES
  var shoePool = getPool(['Shoes']);
  addItem(pickSafe(shoePool));

  // 5. BAG / ACCESSORY
  if (ctx.includeBag) {
    var accessPool = getPool(['Bag', 'Accessory']);
    var neutralAccessories = accessPool.filter(function (i) {
      return getColourFamily(i.colour) === 'neutral';
    });
    var accessToUse = neutralAccessories.length > 0 ? neutralAccessories : accessPool;
    addItem(pickRandom(accessToUse));
  }

  if (outfit.length === 0) return wardrobe.slice(0, 3);
  return outfit;
}

/**
 * Fallback: use the local rule-based engine when Gemini is unavailable.
 */
function fallbackOutfit(occasion, season, weather, chosenItems) {
  var moodRules = OUTFIT_RULES[selectedMood] || OUTFIT_RULES['Confident'];
  var rule = moodRules[occasion] || moodRules['Casual'];
  renderOutfitResult(rule.title, chosenItems, rule.explanation, false);
}

/**
 * Build the prompt string sent to Gemini.
 */
function buildGeminiPrompt(chosenItems, occasion, season, weather) {
  var itemList = chosenItems.map(function (item) {
    return item.type + ': ' + item.colour + (item.preloved ? ' (preloved)' : '');
  }).join(', ');

  var occasionNote = (occasion === 'Formal' || occasion === 'Work')
    ? 'This is a ' + occasion + ' occasion. Colours should be professional and classic (black, white, grey, navy, beige). No shorts, no casual streetwear. '
    : '';

  var stylePref = (typeof getStylePref === 'function') ? getStylePref() : 'none';
  var styleNote = '';
  if (stylePref === 'feminine') {
    styleNote = 'The user prefers a feminine style. Suggest how to style these pieces with a feminine touch (silhouette, layering, accessories). ';
  } else if (stylePref === 'masculine') {
    styleNote = 'The user prefers a masculine style. Suggest how to style these pieces with a clean, structured masculine approach. ';
  } else if (stylePref === 'androgynous (unisex)') {
    styleNote = 'The user prefers an androgynous (unisex) style. Blend masculine and feminine elements, focus on silhouette and neutral styling. ';
  }

  return 'You are ReVogue, a sustainable fashion assistant. '
    + 'The user feels ' + selectedMood + '. Occasion: ' + occasion + '. Season: ' + season + '. Weather: ' + weather + '. '
    + occasionNote
    + styleNote
    + 'Here is the COMPLETE and ONLY list of clothing items available. There are exactly ' + chosenItems.length + ' item(s): ' + itemList + '. '
    + 'IMPORTANT: Only refer to the exact item(s) listed above. Do NOT mention, imply, or invent any other garment, colour, or accessory that is not in this list. If only one item is listed, write your explanation about that single item only. '
    + 'Write a creative outfit name on the first line, then on a new line write one full sentence explaining why these specific colours and pieces work for this mood, occasion and style using colour psychology. '
    + 'Example format:\nSunny Confidence\nThe crisp white shirt paired with navy creates a calm, focused energy ideal for a confident casual day.';
}

/**
 * Checks whether Gemini's explanation text mentions a garment type that
 * is not actually present in chosenItems.
 */
function validateNoHallucinatedItems(explanation, chosenItems) {
  var presentTypes = {};
  chosenItems.forEach(function (item) { presentTypes[item.type] = true; });
  var GARMENT_KEYWORDS = [
    { type: 'Dress', pattern: /\bdress\b/i },
    { type: 'Outerwear', pattern: /\b(jacket|coat|blazer|parka|cardigan)\b/i },
    { type: 'Bottom', pattern: /\b(trousers?|pants?|jeans|shorts|skirt)\b/i },
    { type: 'Top', pattern: /\b(shirt|blouse|t-?shirt|polo|sweater|jumper|top)\b/i },
    { type: 'Shoes', pattern: /\b(shoes?|sneakers?|boots?|sandals?|loafers?|heels?|trainers?)\b/i },
    { type: 'Bag', pattern: /\bbag\b/i },
    { type: 'Accessory', pattern: /\b(hat|cap|scarf|necklace|bracelet|belt|jewellery|jewelry)\b/i }
  ];
  for (var i = 0; i < GARMENT_KEYWORDS.length; i++) {
    var kw = GARMENT_KEYWORDS[i];
    if (kw.pattern.test(explanation) && !presentTypes[kw.type]) {
      return false;
    }
  }
  return true;
}

async function callGemini(prompt) {
  var apiKey = (typeof GEMINI_API_KEY !== 'undefined') ? GEMINI_API_KEY : '';
  if (!apiKey || apiKey === 'paste-your-actual-key-here') {
    throw new Error('API key not set');
  }
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
  var response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    })
  });
  if (!response.ok) {
    throw new Error('Gemini error ' + response.status);
  }
  var data = await response.json();
  var text = data.candidates[0].content.parts[0].text.trim();
  var firstNewline = text.indexOf('\n');
  var title, explanation;
  if (firstNewline !== -1) {
    title = text.substring(0, firstNewline).trim();
    explanation = text.substring(firstNewline + 1).trim();
  } else {
    title = text.trim();
    explanation = 'This outfit is selected based on your ' + selectedMood.toLowerCase() + ' mood and colour psychology principles.';
  }
  title = title.replace(/^[\d\.\-\*]+\s*/, '').replace(/\*\*/g, '').trim();
  explanation = explanation.replace(/^[\d\.\-\*]+\s*/, '').replace(/\*\*/g, '').trim();
  return { title: title || 'Your Outfit', explanation: explanation };
}

// Stores the last generated outfit items so saveCurrentOutfit() can access their images
var lastChosenItems = [];

/**
 * Main function: called when user clicks "Generate my outfit".
 * Tries Gemini first; falls back to local rules if anything goes wrong.
 */
async function getOutfit() {
  if (!wardrobe || wardrobe.length === 0) {
    showToast('Add some clothes to your wardrobe first! 👕');
    return;
  }
  var occasion = rvGetValue('outfit-occasion');
  var season = rvGetValue('outfit-season');
  var weather = rvGetValue('outfit-weather');
  var result = document.getElementById('outfit-result');
  var loading = document.getElementById('loading-dots');
  var btn = document.querySelector('.get-outfit-btn');
  result.classList.remove('show');
  loading.classList.add('show');
  btn.disabled = true;
  var chosenItems = pickItems(occasion, season, weather);
  lastChosenItems = chosenItems;
  try {
    var prompt = buildGeminiPrompt(chosenItems, occasion, season, weather);
    var gemini = await callGemini(prompt);
    if (!validateNoHallucinatedItems(gemini.explanation, chosenItems)) {
      throw new Error('Gemini response referenced items not in the wardrobe — discarding');
    }
    loading.classList.remove('show');
    btn.disabled = false;
    renderOutfitResult(gemini.title, chosenItems, gemini.explanation, true);
  } catch (err) {
    console.warn('Gemini unavailable, using fallback:', err.message);
    loading.classList.remove('show');
    btn.disabled = false;
    fallbackOutfit(occasion, season, weather, chosenItems);
  }
}

/* MOOD PSYCHOLOGY — colour & styling data per mood state */

var MOOD_PSYCHOLOGY = {
  Confident: {
    title: 'Confident and Powerful',
    sub: 'Black and charcoal project quiet authority. Wear them when you need to be taken seriously.',
    bannerBg: '#f5f5f7', bannerText: '#1d1d1f', dotColor: '#1d1d1f',
    palette: [
      { hex: '#1d1d1f', name: 'Deep black' },
      { hex: '#424245', name: 'Charcoal' },
      { hex: '#86868b', name: 'Steel grey' },
      { hex: '#f5efe6', name: 'Warm cream' }
    ],
    chips: ['Black structured blazer', 'Charcoal trousers', 'Cream roll-neck', 'Black loafers'],
    why: '<strong>Why this works:</strong> Dark tonal outfits create a unified, powerful look. Colour psychology links dark shades with competence and authority. One cream piece keeps it from feeling too heavy.',
    tip: 'Add one cream or ivory piece to soften the intensity of full black. It reads as intentional, not harsh.'
  },
  Calm: {
    title: 'Calm and Deeply Focused',
    sub: 'Blue promotes sustained concentration. Great for long study sessions and low-pressure days.',
    bannerBg: '#e6f1fb', bannerText: '#0c447c', dotColor: '#378add',
    palette: [
      { hex: '#378add', name: 'Sky blue' },
      { hex: '#b5d4f4', name: 'Soft blue' },
      { hex: '#f5f5f7', name: 'Cool white' },
      { hex: '#888780', name: 'Quiet grey' }
    ],
    chips: ['Blue relaxed shirt', 'Grey slim trousers', 'White sneakers', 'Minimal accessories'],
    why: '<strong>Why this works:</strong> Blue is the most calming colour in psychology. It lowers stress and supports focus, making it ideal for study sessions or low-key days. Soft, dusty blues work better than bright electric tones.',
    tip: 'Go for dusty or slate blues over electric blue. The softer tones have a stronger calming effect.'
  },
  Playful: {
    title: 'Playful and Joyful',
    sub: 'Mixed warm tones signal openness and invite spontaneity.',
    bannerBg: '#fbeaf0', bannerText: '#72243e', dotColor: '#d4537e',
    palette: [
      { hex: '#d4537e', name: 'Rose pink' },
      { hex: '#f4c0d1', name: 'Blush' },
      { hex: '#f5f5f7', name: 'Clean white' },
      { hex: '#1d1d1f', name: 'Anchor black' }
    ],
    chips: ['Blush pink top', 'White wide trousers', 'Rose accessories', 'White canvas shoes'],
    why: '<strong>Why this works:</strong> Pink and playful colour combinations signal warmth, joy, and social openness. They lift the mood and invite connection. Anchor with white or black to keep it looking intentional.',
    tip: 'Pair playful pinks with white or black to keep the look balanced and deliberate.'
  },
  Energetic: {
    title: 'Energetic and Bold',
    sub: 'Red raises your energy and amplifies momentum. Wear it on high-output days.',
    bannerBg: '#fcebeb', bannerText: '#791f1f', dotColor: '#e24b4a',
    palette: [
      { hex: '#e24b4a', name: 'Fiery red' },
      { hex: '#f09595', name: 'Blush coral' },
      { hex: '#1d1d1f', name: 'Anchor black' },
      { hex: '#f5f5f7', name: 'Clean white' }
    ],
    chips: ['Red statement top', 'White wide-leg trousers', 'Black trainers', 'Minimal gold jewellery'],
    why: '<strong>Why this works:</strong> Red stimulates energy and raises confidence. It is linked to social momentum and a sense of drive. One strong red piece grounded in neutrals is all you need.',
    tip: 'Let one red piece take the lead. Pair it with black or white for maximum impact without overwhelming.'
  },
  Natural: {
    title: 'Natural and Grounded',
    sub: 'Earthy greens and warm neutrals connect you to nature and restore balance.',
    bannerBg: '#eaf3de', bannerText: '#27500a', dotColor: '#3b6d11',
    palette: [
      { hex: '#3b6d11', name: 'Forest green' },
      { hex: '#97c459', name: 'Sage' },
      { hex: '#a8895c', name: 'Warm camel' },
      { hex: '#f5efe6', name: 'Raw cream' }
    ],
    chips: ['Olive linen shirt', 'Camel wide trousers', 'Cream tote bag', 'Tan leather sandals'],
    why: '<strong>Why this works:</strong> Green connects us to nature and promotes calm. Environmental psychology shows it lowers stress and builds a sense of safety. Layer earthy tones for a naturally harmonious result.',
    tip: 'Keep all tones at a similar brightness level. Olive, camel, and cream together reads earthy, not mismatched.'
  },
  Understated: {
    title: 'Understated and Refined',
    sub: 'Quiet neutrals signal refined taste and confidence that needs no announcement.',
    bannerBg: '#f5f5f7', bannerText: '#424245', dotColor: '#86868b',
    palette: [
      { hex: '#424245', name: 'Charcoal' },
      { hex: '#86868b', name: 'Steel grey' },
      { hex: '#e8e8ed', name: 'Light grey' },
      { hex: '#f5efe6', name: 'Warm cream' }
    ],
    chips: ['Grey oversized coat', 'Light grey trousers', 'Cream knit', 'Minimal silver jewellery'],
    why: '<strong>Why this works:</strong> Tonal neutrals in greige and grey are the language of quiet luxury. They signal sophistication and self-assurance without announcing it.',
    tip: 'Add texture through a chunky knit or structured coat to keep tonal outfits visually interesting.'
  }
};

/**
 * Adjust the mood psychology card palette/chips based on
 * occasion, season, and weather.
 */
function getContextualPalette(moodKey, occasion, season, weather) {
  var base = MOOD_PSYCHOLOGY[moodKey];
  if (!base) return null;
  var isFormal = occasion === 'Formal' || occasion === 'Work';
  var isHot = weather === 'Hot' || season === 'Summer';
  var isCold = weather === 'Cold' || weather === 'Rainy' || season === 'Winter';
  var isSport = occasion === 'Sport';
  var isLounge = occasion === 'Lounge';

  var result = {
    title: base.title,
    sub: base.sub,
    bannerBg: base.bannerBg,
    bannerText: base.bannerText,
    dotColor: base.dotColor,
    palette: base.palette.slice(),
    chips: base.chips.slice(),
    why: base.why,
    tip: base.tip
  };

  if (isFormal) {
    result.title = base.title;
    result.sub = 'For ' + occasion.toLowerCase() + ' settings: professional neutrals apply regardless of mood.';
    result.bannerBg = '#f5f5f7';
    result.bannerText = '#1d1d1f';
    result.dotColor = '#1a3a5c';
    result.palette = [
      { hex: '#1d1d1f', name: 'Deep black' },
      { hex: '#1a3a5c', name: 'Navy' },
      { hex: '#86868b', name: 'Steel grey' },
      { hex: '#f5efe6', name: 'Warm cream' }
    ];
    result.chips = ['Black tailored blazer', 'Navy trousers', 'White dress shirt', 'Oxford shoes'];
    result.why = '<strong>Why this works:</strong> Professional occasions call for a restrained palette. Black, navy, and grey project confidence and authority regardless of your mood. These tones are always appropriate in formal environments.';
    result.tip = 'One white or cream piece breaks the severity of an all-dark formal outfit. It reads as intentional polish, not harsh.';
    return result;
  }

  if (isSport) {
    result.sub = 'Activewear colours boost performance motivation. Your ' + moodKey.toLowerCase() + ' energy, dressed for action.';
    result.palette = [
      { hex: '#1d1d1f', name: 'Performance black' },
      { hex: '#f5f5f7', name: 'Clean white' },
      result.palette[0],
      { hex: '#86868b', name: 'Steel grey' }
    ];
    result.chips = ['Performance top', 'Track pants', 'Running shoes', 'Sports cap'];
    result.tip = 'Keep your mood accent colour as one piece only. Ground the rest in black, white, or grey for a clean athletic look.';
    return result;
  }

  if (isLounge) {
    result.sub = 'Lounge dressing: your ' + moodKey.toLowerCase() + ' energy, softened for rest and comfort.';
    result.palette = [
      { hex: '#f5efe6', name: 'Warm cream' },
      { hex: '#e8e8ed', name: 'Soft grey' },
      result.palette[0],
      { hex: '#f5f5f7', name: 'Off white' }
    ];
    result.chips = ['Oversized knit', 'Comfortable trousers', 'Soft sneakers', 'Cosy accessories'];
    result.tip = 'Keep lounge outfits in muted, soft tones. Your mood colour can appear as a small accent, not the dominant piece.';
    return result;
  }

  if (isHot) {
    result.sub = 'Hot weather: keep your ' + moodKey.toLowerCase() + ' energy in lighter, breathable tones.';
    result.palette = [
      result.palette[0],
      { hex: '#f5f5f7', name: 'Clean white' },
      { hex: '#f5efe6', name: 'Warm cream' },
      { hex: '#e8d5b7', name: 'Sandy beige' }
    ];
    result.chips = result.chips.map(function (c) {
      return c.replace('structured', 'linen').replace('trousers', 'shorts or trousers').replace('coat', 'light layer');
    });
    result.tip = 'In hot weather, keep your mood colour as one light piece. Pair with white or cream for the rest.';
    return result;
  }

  if (isCold) {
    result.sub = 'Cold weather: your ' + moodKey.toLowerCase() + ' energy layered with warmth and depth.';
    result.palette = [
      result.palette[0],
      { hex: '#1d1d1f', name: 'Deep black' },
      { hex: '#a8895c', name: 'Warm camel' },
      { hex: '#424245', name: 'Charcoal' }
    ];
    result.chips = ['Wool overcoat', 'Layered knit', 'Camel scarf', 'Dark trousers'];
    result.tip = 'In cold weather, let your mood colour appear in one piece (scarf, knit) and build around it with dark neutrals for warmth.';
    return result;
  }

  return result;
}

/**
 * Update the mood psychology card when a pill is selected,
 * or when occasion/season/weather dropdowns change.
 */
function updateMoodPsychCard(moodKey) {
  function getDropdownValue(id) {
    var el = document.getElementById('rv-' + id);
    if (!el) return '';
    var val = el.querySelector('.rv-value');
    return val ? val.textContent.trim() : '';
  }
  var occasion = getDropdownValue('outfit-occasion') || 'Casual';
  var season = getDropdownValue('outfit-season') || 'Any';
  var weather = getDropdownValue('outfit-weather') || 'Any';
  var data = getContextualPalette(moodKey, occasion, season, weather);
  var card = document.getElementById('mood-psych-card');
  if (!data || !card) return;
  var banner = document.getElementById('mood-psych-banner');
  banner.style.background = data.bannerBg;
  banner.style.color = data.bannerText;
  document.getElementById('mood-psych-dot').style.background = data.dotColor;
  document.getElementById('mood-psych-title').textContent = data.title;
  document.getElementById('mood-psych-sub').textContent = data.sub;
  document.getElementById('mood-psych-palette').innerHTML = data.palette.map(function (p) {
    return '<div class="mood-psych-swatch-wrap">' +
      '<div class="mood-psych-swatch" style="background:' + p.hex + '"></div>' +
      '<div class="mood-psych-swatch-name">' + p.name + '</div>' +
      '</div>';
  }).join('');
  document.getElementById('mood-psych-chips').innerHTML = data.chips.map(function (c) {
    return '<span class="mood-psych-chip">' + c + '</span>';
  }).join('');
  document.getElementById('mood-psych-why').innerHTML =
    data.why +
    '<div class="mood-psych-tip">' +
    '<span class="mood-psych-tip-icon">💡</span>' +
    '<span>' + data.tip + '</span>' +
    '</div>';
  card.classList.add('show');
}

/* SUSTAINABILITY SCORE + SWAP ITEM */

var swapTargetIndex = -1;

/**
 * Calculate and render the sustainability score for the current outfit.
 */
function renderSustainScore(items) {
  var bar = document.getElementById('sustain-bar');
  var headline = document.getElementById('sustain-headline');
  var detail = document.getElementById('sustain-detail');
  var badge = document.getElementById('sustain-score-badge');
  var fill = document.getElementById('sustain-fill');
  if (!bar) return;
  var total = items.length;
  var fromWardrobe = items.filter(function (i) { return i.id; }).length;
  var preloved = items.filter(function (i) { return i.preloved; }).length;
  var score = 0;
  if (fromWardrobe > 0) score += 60;
  score += Math.min(preloved * 10, 30);
  if (fromWardrobe === total) score += 10;
  score = Math.min(score, 100);
  var label = score >= 90 ? 'Excellent sustainability' :
    score >= 70 ? 'Good sustainability' :
      score >= 50 ? 'Fair sustainability' : 'Improve sustainability';
  var details = [];
  if (fromWardrobe === total) details.push('All items from your wardrobe');
  else if (fromWardrobe > 0) details.push(fromWardrobe + ' of ' + total + ' from your wardrobe');
  else details.push('Using sample items: upload your clothes to improve');
  if (preloved > 0) details.push(preloved + ' preloved item' + (preloved > 1 ? 's' : ''));
  bar.style.display = 'block';
  headline.textContent = label;
  detail.textContent = details.join(' · ');
  badge.textContent = score + '%';
  setTimeout(function () { fill.style.width = score + '%'; }, 100);
}

/**
 * Render outfit item chips with a Swap button on each.
 */
function renderOutfitResult(title, chosenItems, explanationHTML, usedGemini) {
  document.getElementById('outfit-title').textContent = title;
  document.getElementById('outfit-items').innerHTML = chosenItems.map(function (item, i) {
    var photoHtml = item.image
      ? '<img src="' + item.image + '" alt="' + item.type + '" class="outfit-chip-img">'
      : '<div class="outfit-chip-emoji">' + (TYPE_EMOJI[item.type] || '👗') + '</div>';
    return '<div class="outfit-item-chip" id="chip-' + i + '">'
      + photoHtml
      + '<div class="outfit-chip-label">'
      + '<span class="outfit-chip-type">' + item.type + '</span>'
      + '<span class="outfit-chip-colour">' + item.colour + (item.preloved ? ' ♻️' : '') + '</span>'
      + '</div>'
      + '<div class="outfit-chip-actions">'
      + '<button class="outfit-chip-swap" onclick="openSwap(' + i + ', this)" title="Swap this item">⇄ Swap</button>'
      + '<button class="outfit-chip-remove" onclick="removeOutfitItem(' + i + ')" title="Remove this item">✕</button>'
      + '</div>'
      + '</div>';
  }).join('');
  var hasPreloved = chosenItems.some(function (i) { return i.preloved; });
  document.getElementById('outfit-explanation').innerHTML =
    explanationHTML +
    (hasPreloved ? ' <strong>♻️ Preloved items featured:</strong> this outfit uses pieces you already own.' : '');
  var badge = document.getElementById('gemini-badge');
  var fallback = document.getElementById('outfit-fallback-note');
  if (badge) badge.style.display = usedGemini ? 'inline-block' : 'none';
  if (fallback) fallback.style.display = usedGemini ? 'none' : 'block';
  closeSwap();
  renderSustainScore(chosenItems);
  document.getElementById('outfit-result').classList.add('show');
}

/**
 * Open the swap panel for item at index i.
 */
function openSwap(idx, btn) {
  if (swapTargetIndex === idx) {
    closeSwap();
    return;
  }
  swapTargetIndex = idx;
  var targetItem = lastChosenItems[idx];
  if (!targetItem) return;
  document.querySelectorAll('.outfit-chip-swap').forEach(function (b) {
    b.classList.remove('active');
    b.textContent = '⇄ Swap';
  });
  btn.classList.add('active');
  btn.textContent = '✕ Close';
  var usedIds = lastChosenItems.map(function (i) { return i.id; }).filter(Boolean);
  var alternatives = wardrobe.filter(function (item) {
    return item.type === targetItem.type && usedIds.indexOf(item.id) === -1;
  });
  var panel = document.getElementById('swap-panel');
  var titleEl = document.getElementById('swap-panel-title');
  var optionsEl = document.getElementById('swap-options');
  titleEl.textContent = 'Swap ' + targetItem.type + ': ' + targetItem.colour;
  if (alternatives.length === 0) {
    optionsEl.innerHTML = '<div class="swap-empty">No other ' + targetItem.type + ' items in your wardrobe.<br>Upload more items to get swap options.</div>';
  } else {
    optionsEl.innerHTML = alternatives.map(function (alt) {
      var imgHtml = alt.image
        ? '<div class="swap-option-img"><img src="' + alt.image + '" alt="' + alt.type + '"></div>'
        : '<div class="swap-option-img">' + (TYPE_EMOJI[alt.type] || '👗') + '</div>';
      var prelovedBadge = alt.preloved
        ? '<span class="swap-option-badge">♻️ Preloved</span>'
        : '';
      return '<div class="swap-option" onclick="applySwap(' + JSON.stringify(alt).replace(/"/g, '&quot;') + ', ' + idx + ')">'
        + imgHtml
        + '<div class="swap-option-info">'
        + '<div class="swap-option-type">' + alt.type + '</div>'
        + '<div class="swap-option-name">' + alt.colour + '</div>'
        + '</div>'
        + prelovedBadge
        + '</div>';
    }).join('');
  }
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Apply a swap: replace the item at swapTargetIndex with the chosen alternative.
 */
function applySwap(newItem, idx) {
  if (!lastChosenItems || idx < 0 || idx >= lastChosenItems.length) return;
  lastChosenItems[idx] = newItem;
  document.getElementById('outfit-items').innerHTML = lastChosenItems.map(function (item, i) {
    var photoHtml = item.image
      ? '<img src="' + item.image + '" alt="' + item.type + '" class="outfit-chip-img">'
      : '<div class="outfit-chip-emoji">' + (TYPE_EMOJI[item.type] || '👗') + '</div>';
    return '<div class="outfit-item-chip" id="chip-' + i + '">'
      + photoHtml
      + '<div class="outfit-chip-label">'
      + '<span class="outfit-chip-type">' + item.type + '</span>'
      + '<span class="outfit-chip-colour">' + item.colour + (item.preloved ? ' ♻️' : '') + '</span>'
      + '</div>'
      + '<div class="outfit-chip-actions">'
      + '<button class="outfit-chip-swap" onclick="openSwap(' + i + ', this)" title="Swap this item">⇄ Swap</button>'
      + '<button class="outfit-chip-remove" onclick="removeOutfitItem(' + i + ')" title="Remove this item">✕</button>'
      + '</div>'
      + '</div>';
  }).join('');
  renderSustainScore(lastChosenItems);
  closeSwap();
  showToast('✓ Item swapped');
}

/**
 * Remove an item from the current outfit by index.
 */
function removeOutfitItem(idx) {
  if (!lastChosenItems || lastChosenItems.length <= 1) {
    showToast('At least one item must remain in the outfit.');
    return;
  }
  lastChosenItems.splice(idx, 1);
  closeSwap();
  document.getElementById('outfit-items').innerHTML = lastChosenItems.map(function (item, i) {
    var photoHtml = item.image
      ? '<img src="' + item.image + '" alt="' + item.type + '" class="outfit-chip-img">'
      : '<div class="outfit-chip-emoji">' + (TYPE_EMOJI[item.type] || '👗') + '</div>';
    return '<div class="outfit-item-chip" id="chip-' + i + '">'
      + photoHtml
      + '<div class="outfit-chip-label">'
      + '<span class="outfit-chip-type">' + item.type + '</span>'
      + '<span class="outfit-chip-colour">' + item.colour + (item.preloved ? ' ♻️' : '') + '</span>'
      + '</div>'
      + '<div class="outfit-chip-actions">'
      + '<button class="outfit-chip-swap" onclick="openSwap(' + i + ', this)" title="Swap this item">⇄ Swap</button>'
      + '<button class="outfit-chip-remove" onclick="removeOutfitItem(' + i + ')" title="Remove this item">✕</button>'
      + '</div>'
      + '</div>';
  }).join('');
  renderSustainScore(lastChosenItems);
  showToast('Item removed from outfit');
}

/**
 * Close the swap panel and reset state.
 */
function closeSwap() {
  swapTargetIndex = -1;
  var panel = document.getElementById('swap-panel');
  if (panel) panel.style.display = 'none';
  document.querySelectorAll('.outfit-chip-swap').forEach(function (b) {
    b.classList.remove('active');
    b.textContent = '⇄ Swap';
  });
}
