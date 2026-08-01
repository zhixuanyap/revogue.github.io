# ReVogue: A Smart Closet for Personal Styling and Sustainable Wardrobe Curation

A human-centred AI wardrobe management system that integrates 
clothing classification, context-aware outfit generation, 
colour psychology, and sustainability scoring.

Capstone Project 2 (CP2)
BSc (Hons) Software Engineering, Sunway University
Student: Yap Zhi Xuan (22067284)
Supervisor: Dr. Azizzeanna Hassan

---

## Features
- AI clothing classification using Google Teachable Machine
- Context-aware outfit generation via Gemini 2.5 Flash API
- Mood-based colour psychology card system
- Sustainability scoring with preloved item prioritisation
- Colour harmony tool with wardrobe item picker
- Guest mode with full system access
- Saved outfits with occasion filter

---

## Tech Stack
- HTML5, CSS3, JavaScript
- Google Teachable Machine (transfer learning, 7 clothing categories)
- Google Gemini 2.5 Flash API (natural language outfit explanation)
- TensorFlow.js (in-browser AI inference)
- Browser localStorage (client-side data persistence)
- GitHub Pages (deployment)

---

## Project Structure
revogue/
├── index.html: Single-page app, all 7 page layouts
├── style.css: Complete design system and component styles
├── app.js: Navigation, auth, colour tool, saved outfits
├── wardrobe.js: Upload, compression, wardrobe CRUD
├── recommendation.js: Outfit engine, Gemini API, mood psychology
├── teachableMachine.js: Teachable Machine model loading and inference
├── config.js: Gemini API key (excluded from version control)
└── .gitignore: Excludes config.js from public repository

## Ethical Considerations
- Style preference uses aesthetic orientation labels, not binary gender
- Colour undertone preference is framed as personal experience, not skin tone
- All user data stored locally in the browser only
- No personal data transmitted to external servers
- AI transparency implemented through badge system and plain language explanations

---

## Academic Integrity
This project was developed as an individual capstone project.
