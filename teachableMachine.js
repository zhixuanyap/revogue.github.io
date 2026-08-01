/* 
   ReVogue — teachableMachine.js
   Classifies uploaded clothing images using a Teachable Machine model. No webcam  works entirely from uploaded file.

   How it works:
   1. User uploads a photo in the wardrobe modal
   2. handleUpload() in wardrobe.js compresses the image
   3. classifyImage() runs the compressed image through the model
   4. The Item Type dropdown is auto-set to the predicted class
   5. User can still manually override the prediction

   Depends on: app.js (showToast), wardrobe.js (called after upload)
   Requires: TensorFlow.js + Teachable Machine image library (loaded via script tags in index.html)
    */

// ── CONFIG 
// Paste your Teachable Machine model URL here after exporting
var TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/iuHJxZ8l9/';

// Minimum confidence % to accept a prediction (0–1)
// Below this threshold, the dropdown is left on its default
var TM_MIN_CONFIDENCE = 0.70;
// 

var tmModel = null;   // loaded Teachable Machine model
var tmReady = false;  // true once model is loaded

/**
 * Load the Teachable Machine model from the hosted URL.
 * Called once when the page loads. Fails silently if offline.
 */
async function loadTMModel() {
  try {
    if (typeof tmImage === 'undefined') {
      console.warn('Teachable Machine library not loaded yet');
      return;
    }
    var modelURL = TM_MODEL_URL + 'model.json';
    var metadataURL = TM_MODEL_URL + 'metadata.json';
    tmModel = await tmImage.load(modelURL, metadataURL);
    tmReady = true;
    console.log('ReVogue: Teachable Machine model loaded ✓');
  } catch (err) {
    console.warn('ReVogue: Could not load TM model —', err.message);
    tmReady = false;
  }
}

/**
 * Classify an image element using the loaded Teachable Machine model.
 * Returns the top prediction if confidence is above TM_MIN_CONFIDENCE,
 * otherwise returns null (dropdown stays on default).
 *
 * @param {HTMLImageElement} imgEl - the image to classify
 * @returns {Promise<{className: string, probability: number} | null>}
 */
async function runTMClassification(imgEl) {
  if (!tmReady || !tmModel) return null;

  try {
    var predictions = await tmModel.predict(imgEl);

    // Sort by probability descending — highest confidence first
    predictions.sort(function (a, b) { return b.probability - a.probability; });

    var top = predictions[0];

    if (top.probability >= TM_MIN_CONFIDENCE) {
      return top;
    }
    return null; // not confident enough
  } catch (err) {
    console.warn('ReVogue: Classification failed —', err.message);
    return null;
  }
}

/**
 * Main function — called from wardrobe.js after image is loaded.
 * Runs classification and updates the Item Type dropdown.
 * Shows a small badge in the modal with the AI prediction.
 *
 * @param {HTMLImageElement} imgEl - the preview image element in the modal
 */
async function classifyImage(imgEl) {
  var badge = document.getElementById('tm-badge');

  if (!tmReady) {
    if (badge) badge.style.display = 'none';
    return;
  }

  // Show loading state in badge
  if (badge) {
    badge.style.display = 'flex';
    badge.innerHTML = '<span class="tm-spinner"></span> Detecting clothing type...';
    badge.className = 'tm-badge tm-loading';
  }

  var result = await runTMClassification(imgEl);

  if (result) {
    var className = result.className;
    var confidence = Math.round(result.probability * 100);

    // Update the custom dropdown to show the predicted class
    var dropdown = document.getElementById('rv-item-type');
    if (dropdown) {
      dropdown.querySelector('.rv-value').textContent = className;
      dropdown.querySelectorAll('.rv-option').forEach(function (o) {
        o.classList.toggle('selected', o.textContent.trim() === className);
      });
    }

    // Update badge to show result
    if (badge) {
      badge.innerHTML = '✦ AI detected: <strong>' + className + '</strong> &nbsp;·&nbsp; ' + confidence + '% confident';
      badge.className = 'tm-badge tm-success';
    }
  } else {
    // Low confidenceL: leave dropdown on default, show message
    if (badge) {
      badge.innerHTML = 'Could not detect type — please select manually';
      badge.className = 'tm-badge tm-warn';
    }
  }
}

// Load model as soon as this script runs
loadTMModel();