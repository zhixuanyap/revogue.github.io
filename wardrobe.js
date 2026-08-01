/* 
   ReVogue — wardrobe.js
   Handles everything related to the user's clothing collection:
   uploading photos, tagging items, saving, deleting, rendering.

   Depends on: app.js (wardrobe, pendingImageDataURL, TYPE_EMOJI, getCurrentUser, showToast, closeModal)
*/


/**
 * Triggered when the user selects a photo in the file input.
 * Reads the file as a data URL, shows a preview inside the
 * upload modal, then opens the modal for the user to tag it.
 * @param {Event} event - the file input change event
 */
function handleUpload(event) {
  var file = event.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function (e) {

    // Compress the image before storing to avoid localStorage quota errors
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');

      // Resize to max 400px wide — enough for a wardrobe card, tiny file size
      var maxW = 400;
      var scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Compress to JPEG at 70% quality, reduces size by ~90% vs original
      pendingImageDataURL = canvas.toDataURL('image/jpeg', 0.7);

      // Show image preview inside modal
      var preview = document.getElementById('modal-preview-img');
      preview.innerHTML = '<img src="' + pendingImageDataURL + '" alt="Clothing preview" style="width:100%;height:220px;object-fit:cover;border-radius:18px;display:block;">';

      // Reset form fields inline, no dependency on app.js load order
      var typeDropdown = document.getElementById('rv-item-type');
      if (typeDropdown) {
        typeDropdown.querySelector('.rv-value').textContent = 'Top';
        typeDropdown.querySelectorAll('.rv-option').forEach(function (o) {
          o.classList.toggle('selected', o.textContent.trim() === 'Top');
        });
      }

      var occasionDropdown = document.getElementById('rv-item-occasion');
      if (occasionDropdown) {
        occasionDropdown.querySelector('.rv-value').textContent = 'Casual';
        occasionDropdown.querySelectorAll('.rv-option').forEach(function (o) {
          o.classList.toggle('selected', o.textContent.trim() === 'Casual');
        });
      }

      var colourInput = document.getElementById('item-colour');
      if (colourInput) colourInput.value = '';

      var prelovedCheck = document.getElementById('item-preloved');
      if (prelovedCheck) prelovedCheck.checked = false;

      // Open the modal
      document.getElementById('modal-upload').classList.add('open');

      // Show detecting badge immediately
      var badge = document.getElementById('tm-badge');
      if (badge && typeof tmReady !== 'undefined') {
        badge.style.display = 'flex';
        badge.innerHTML = '<span class="tm-spinner"></span> Detecting clothing type...';
        badge.className = 'tm-badge tm-loading';
      }

      // Run Teachable Machine classification
      if (typeof classifyImage === 'function') {
        setTimeout(function () { classifyImage(img); }, 300);
      }
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
  event.target.value = '';
}

/**
 * Close a modal by removing the 'open' class.
 * @param {string} modalId - the id of the modal overlay element
 */
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

/**
 * Save the current modal form data as a new clothing item,
 * persist to localStorage under the current user's key,
 * close the modal, and re-render the wardrobe grid.
 */
function saveItem() {
  var colourInput = document.getElementById('item-colour').value.trim();
  if (!colourInput) {
    showToast('Please add a colour or description');
    document.getElementById('item-colour').focus();
    return;
  }

  // Read custom dropdown values directly, no dependency on app.js
  var typeEl = document.getElementById('rv-item-type');
  var occasionEl = document.getElementById('rv-item-occasion');
  var itemType = typeEl ? typeEl.querySelector('.rv-value').textContent.trim() : 'Top';
  var itemOccasion = occasionEl ? occasionEl.querySelector('.rv-value').textContent.trim() : 'Casual';

  var newItem = {
    id: Date.now(),
    type: itemType,
    colour: colourInput,
    occasion: itemOccasion,
    preloved: document.getElementById('item-preloved').checked,
    image: pendingImageDataURL
  };

  wardrobe.push(newItem);
  saveWardrobe();
  closeModal('modal-upload');
  renderWardrobe();
  showToast('✓ Item added to your wardrobe');
}

/**
 * Delete a clothing item from the wardrobe by its id.
 * @param {number} id - the item's timestamp id
 * @param {Event}  e  - click event (stopped from bubbling to card)
 */
function deleteItem(id, e) {
  e.stopPropagation();
  wardrobe = wardrobe.filter(item => item.id !== id);
  saveWardrobe();
  renderWardrobe();
  showToast('Item removed');
}

/**
 * Persist the current wardrobe array to localStorage.
 * Uses a per-user key if logged in, otherwise a shared key.
 */
function saveWardrobe() {
  // Guest mode — wardrobe is in-memory only, don't save to localStorage
  if (typeof isGuestMode !== 'undefined' && isGuestMode) return;

  const user = getCurrentUser();
  const key = user ? 'revogue-wardrobe-' + user.email : 'revogue-wardrobe';
  const data = JSON.stringify(wardrobe);
  if (data.length > 4000000) {
    showToast('⚠️ Wardrobe storage nearly full — remove old items first');
    wardrobe.pop();
    return;
  }
  try {
    localStorage.setItem(key, data);
  } catch (e) {
    showToast('⚠️ Storage full — remove some items first');
    wardrobe.pop();
  }
}

/**
 * Load the correct wardrobe from localStorage for the current user.
 * Called after login / on page load.
 */
function loadWardrobe() {
  const user = getCurrentUser();
  const key = user ? 'revogue-wardrobe-' + user.email : 'revogue-wardrobe';
  wardrobe = JSON.parse(localStorage.getItem(key) || '[]');
}

/**
 * Render all wardrobe items as cards inside #wardrobe-grid.
 * Shows placeholder sample cards when the wardrobe is empty.
 */
function renderWardrobe() {
  const grid = document.getElementById('wardrobe-grid');
  if (!grid) return;

  // Update counts and saved outfits whenever wardrobe renders
  if (typeof updateWardrobeCounts === 'function') updateWardrobeCounts();
  if (typeof renderSavedOutfits === 'function') renderSavedOutfits();

  // Get filtered items based on active tab
  var displayItems = (typeof getFilteredWardrobe === 'function')
    ? getFilteredWardrobe()
    : wardrobe;

  if (wardrobe.length === 0) {
    grid.innerHTML = `
      <div class="clothing-card sample-card">
        <div class="clothing-card-img-placeholder">👕</div>
        <div class="clothing-card-body">
          <div class="clothing-card-type">Top</div>
          <div class="clothing-card-color">White cotton shirt</div>
        </div>
        <span class="sample-label">Sample</span>
      </div>
      <div class="clothing-card sample-card">
        <div class="clothing-card-img-placeholder">👖</div>
        <div class="clothing-card-body">
          <div class="clothing-card-type">Bottom</div>
          <div class="clothing-card-color">Navy slim trousers</div>
        </div>
        <span class="preloved-badge">Preloved</span>
        <span class="sample-label">Sample</span>
      </div>
      <div class="clothing-card sample-card">
        <div class="clothing-card-img-placeholder">🧥</div>
        <div class="clothing-card-body">
          <div class="clothing-card-type">Outerwear</div>
          <div class="clothing-card-color">Beige trench coat</div>
        </div>
        <span class="sample-label">Sample</span>
      </div>
    `;
    return;
  }

  if (displayItems.length === 0) {
    grid.innerHTML = '<div class="empty-wardrobe"><div class="empty-icon">🔍</div><p>No items match this filter.</p></div>';
    return;
  }

  grid.innerHTML = displayItems.map(item => `
    <div class="clothing-card">
      ${item.image
      ? `<img src="${item.image}" alt="${item.type}">`
      : `<div class="clothing-card-img-placeholder">${TYPE_EMOJI[item.type] || '👗'}</div>`
    }
      <div class="clothing-card-body">
        <div class="clothing-card-type">${item.type}</div>
        <div class="clothing-card-color">${item.colour}</div>
      </div>
      ${item.preloved ? `<span class="preloved-badge">Preloved</span>` : ''}
      <button
        class="delete-btn"
        onclick="deleteItem(${item.id}, event)"
        title="Remove item"
        aria-label="Remove ${item.colour}">✕</button>
    </div>
  `).join('');
}