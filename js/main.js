/* =====================================================================
   MAIN.JS
   =====================================================================
   - Renders the project grid on the home page
   - Renders the project detail page
   - Handles hover / touch "Full Preview" overlay
   - Manages mobile navigation
   - Auto-discovers files in each project's folders
   ===================================================================== */

(function () {
  'use strict';

  /* ---------- Helpers ---------- */

  /** Find a project by its id. */
  function getProject (id) {
    return PROJECTS.find(p => p.id === id);
  }

  /** Get a query string value. */
  function qs (key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  /** Escape user-supplied text before injecting as HTML. */
  function esc (s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  /** Encode a relative path so it is safe inside an HTML attribute and a URL.
   *  Splits on "/" so each segment is encoded individually — keeps "/" intact
   *  while percent-encoding spaces, ampersands, etc. inside filenames. */
  function encodePath (path) {
    return String(path ?? '').split('/').map(seg => encodeURIComponent(seg)).join('/');
  }

  /**
   * Convert a filename into a human-readable label.
   *   "01-Air Filter.png"  -> "Air Filter"
   *   "CrankShaft.SLDPRT"  -> "CrankShaft"
   *   "piston-pin.stl"     -> "Piston Pin"
   * Caps are preserved as-is (matches the user's component names).
   */
  function prettyName (filename) {
    let name = filename;
    // Strip extension
    const dot = name.lastIndexOf('.');
    if (dot > 0) name = name.slice(0, dot);
    // Strip leading numeric prefix "01-" or "01_"
    name = name.replace(/^\d{1,3}[-_\s]+/, '');
    // Trim underscores
    name = name.replace(/[_-]+/g, ' ').trim();
    return name;
  }

  /**
   * Normalize a filename (with or without path) to a lookup key:
   *   lowercase, no extension, no numeric prefix, no leading "the".
   *   "01-Air Filter.png"     -> "air filter"
   *   "piston pin.SLDPRT"     -> "piston pin"
   *   "CrankShaft Bushing.STL"-> "crankshaft bushing"
   */
  function fileKey (filename) {
    return prettyName(filename).toLowerCase().trim();
  }

  /**
   * Build a lookup map { normalizedName -> componentImageUrl } from the
   * project's components list. The components list can be either:
   *   - full URLs:  ["projects/v6-engine/components/11-Engine Block.png", ...]
   *   - bare names: ["11-Engine Block.png", ...]
   * Keys are lowercase basenames without the numeric prefix.
   *
   * Includes an ALIAS MAP for known naming inconsistencies so the user
   * never has to rename their PNGs by hand. Add new aliases here as
   * you encounter naming mismatches in future projects.
   */
  const COMPONENT_ALIASES = {
    // file-key (lowercase, no ext) -> component key (lowercase, no ext)
    'crankshaft bushing':  'camshaft bushing'      // Camshaft Bushing.png shows for CrankShaft Bushing.SLDPRT
  };
  function buildComponentImageMap (components) {
    const map = new Map();
    if (!Array.isArray(components)) return map;
    components.forEach(entry => {
      if (!entry) return;
      const file = String(entry).split('/').pop();
      const key  = fileKey(file);
      if (key && !map.has(key)) map.set(key, entry);
    });
    return map;
  }

  /**
   * Normalize a name for fuzzy comparison:
   *   - lowercase
   *   - strip non-alphanumeric
   *   - collapse plural/singular (trailing 's')
   *   - sort words alphabetically (so word order doesn't matter)
   *   "CrankShaft Bushing"      -> "bushingcrankshaf"
   *   "Camshaft Bushing"        -> "bushingcamshaf"   (close)
   *   "Crack Shaft"             -> "crackshaft"
   *   "Crankshaft"              -> "crankshaf"        (close)
   *   "Valves Cover"            -> "covervalve"
   *   "Valve Cover"             -> "covervalve"       (match)
   *   "Exhaust Manifold Left"   -> "exhausleftmanifold"
   *   "Exhaust Mainfold Left"   -> "exhausleftmainfold" (close)
   */
  function fuzzyKey (name) {
    let n = String(name ?? '').toLowerCase();
    // Strip everything except letters and digits
    n = n.replace(/[^a-z0-9]/g, '');
    // Drop a single trailing 's' for crude plural normalization
    if (n.length > 3 && n.endsWith('s')) n = n.slice(0, -1);
    // Sort the letters so word-order differences don't matter.
    // We use a "bag-of-characters" approach: count each letter and compare.
    return n.split('').sort().join('');
  }

  /**
   * Compute a similarity ratio between two strings (Dice coefficient on
   * character bigrams). Returns 0..1 — 1 is identical.
   * Cheap and tolerates single-character typos and word reorders.
   */
  function similarity (a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (Math.abs(a.length - b.length) > Math.max(a.length, b.length) * 0.5) return 0;
    const bigrams = (s) => {
      const out = new Map();
      for (let i = 0; i < s.length - 1; i++) {
        const g = s.slice(i, i + 2);
        out.set(g, (out.get(g) || 0) + 1);
      }
      return out;
    };
    const ba = bigrams(a), bb = bigrams(b);
    let inter = 0, total = 0;
    for (const [k, v] of ba) {
      const u = bb.get(k) || 0;
      inter += Math.min(v, u);
    }
    for (const v of ba.values()) total += v;
    for (const v of bb.values()) total += v;
    if (total === 0) return 0;
    return (2 * inter) / total;
  }

  /**
   * Returns true if two words differ by exactly 1 character (insert,
   * delete, or substitute). Used for typo tolerance. Only meaningful
   * for words of length 4+ to avoid matching too eagerly.
   */
  function levenshtein1 (a, b) {
    if (!a || !b) return false;
    if (a === b) return false;
    if (Math.abs(a.length - b.length) > 1) return false;
    if (Math.max(a.length, b.length) < 4) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (edits > 0) return false;
      edits++;
      if (a.length === b.length) { i++; j++; }
      else if (a.length > b.length) { i++; }
      else { j++; }
    }
    if (i < a.length || j < b.length) edits++;
    return edits === 1;
  }

  /**
   * Returns true if two words are compatible (one is plausibly a typo /
   * variant of the other). Handles:
   *   - exact equality
   *   - plural / singular: "valve" ↔ "valves"
   *   - Levenshtein-1 typos: "crank" ↔ "crack"
   *   - common prefixes: "crank" ↔ "crankshaft" (one word contains the other)
   */
  function isCompatibleWord (a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a === b + 's' || b === a + 's') return true;
    if (a === b.slice(0, -1) || b === a.slice(0, -1)) return true;

    // One word is a prefix of the other (e.g. "crank" inside "crankshaft").
    // The SHORTER word must be at least 4 characters so "cam" can't
    // prefix-match "crankshaft" — only meaningful prefixes like "crank".
    const shorter = a.length <= b.length ? a : b;
    const longer  = a.length <= b.length ? b : a;
    if (shorter.length >= 4 && longer.startsWith(shorter)) return true;

    // One word is a Levenshtein-1 typo of a prefix of the other
    // (e.g. "crack" is a typo of "crank" which is a prefix of "crankshaft").
    // This catches the user's "Crack Shaft" vs "Crankshaft" inconsistency.
    const tryPrefixTypo = (word, other) => {
      if (other.length < 5) return false;
      for (let n = Math.max(4, word.length - 1); n <= Math.min(other.length, word.length + 1); n++) {
        if (levenshtein1(word, other.slice(0, n))) return true;
      }
      return false;
    };
    if (tryPrefixTypo(a, b) || tryPrefixTypo(b, a)) return true;

    // Levenshtein-1 typo on the whole words.
    if (levenshtein1(a, b)) return true;

    // Same length, differ by ≤ 2 chars (very loose, only for longer words).
    if (a.length >= 5 && a.length === b.length) {
      let diffs = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diffs++;
      if (diffs <= 2) return true;
    }

    return false;
  }

  /**
   * Find the matching component image URL for a download file.
   * Returns the URL string or null if no match found.
   *
   * Matching strategy (in order):
   *   1. Exact normalized match  ("engine block" === "engine block")
   *   2. No-spaces match          ("engineblock" === "engineblock")
   *   3. Word-bag exact match     ("covervalve" === "covervalve"  — handles plural/order)
   *   4. Word-bag fuzzy match     (handles typos like "Crack"/"Crank",
   *                                "Mainfold"/"Manifold", "Bushing"/"Bushing")
   *      — only if the FIRST word is also loosely present (so "Crankshaft"
   *        never accidentally matches "Camshaft Bushing")
   */
  function findComponentImage (filename, map) {
    if (!map || map.size === 0) return null;
    let key  = fileKey(filename);
    if (map.has(key)) return map.get(key);

    // Check the alias map for known naming inconsistencies. This handles
    // cases where the same physical part has different names in the
    // components vs files folder (e.g. "Crankshaft Bushing" vs "Camshaft
    // Bushing") — adding to COMPONENT_ALIASES is the user-friendly way
    // to fix these without renaming files.
    if (COMPONENT_ALIASES[key]) {
      const aliasKey = COMPONENT_ALIASES[key];
      if (map.has(aliasKey)) return map.get(aliasKey);
    }

    const noSpaces = key.replace(/\s+/g, '');
    const bag      = fuzzyKey(key);
    const words    = key.split(/\s+/).filter(Boolean);
    const firstWord = words[0] || '';

    let best = null;
    let bestScore = 0;
    for (const [k, v] of map.entries()) {
      const kn  = k.replace(/\s+/g, '');
      const kb  = fuzzyKey(k);
      if (kn === noSpaces) return v;     // bag match — instant hit

      // The component name must be "compatible" with the file name.
// We require that the component's first word matches the file's first
// word (with possible plural variation, or Levenshtein-1 for typos).
// This prevents "Crankshaft" from accidentally matching "Camshaft
// Bushing" — both contain "shaft" but the distinguishing first word
// (crank vs cam) is different.
      const kWords = k.split(/\s+/).filter(Boolean);
      const fw     = kWords[0] || '';
      const compatible = isCompatibleWord(firstWord, fw);
      if (!compatible) continue;

      const score = similarity(bag, kb);
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    }
    // Threshold — 0.7 catches typos and minor spelling variants but rejects
    // genuinely different parts.
    return bestScore >= 0.7 ? best : null;
  }

  /**
   * Predict filenames for a project, then probe which ones actually exist.
   * Browsers can't list directory contents, so we rely on conventions
   * documented in the README.
   *
   * Supported patterns (in order of probing):
   *   components/: NN.ext   (NN = 01..40, ext = jpg/png/webp/jpeg)
   *   components/: NN-anything.ext        (e.g. "01-Air Filter.png")
   *   files/:     <id>.stl, <id>.sldprt, <id>.sldasm
   *   files/:     anything.stl, anything.sldprt, anything.sldasm
   *
   * Results are cached per projectId so the page only does the slow
   * HEAD-request probing once per session.
   */
  const SLOTS = 40;
  const IMG_EXTS = ['jpg', 'png', 'webp', 'jpeg'];
  const VIDEO_EXTS = ['mp4', 'webm', 'mov'];
  const discoveryCache = new Map();

  function predictFilenames (projectId) {
    const components = [];
    const stl = [`projects/${projectId}/files/${projectId}.stl`];
    const sld = [
      `projects/${projectId}/files/${projectId}.sldprt`,
      `projects/${projectId}/files/${projectId}.sldasm`
    ];

    for (let i = 1; i <= SLOTS; i++) {
      const n = String(i).padStart(2, '0');
      IMG_EXTS.forEach(ext => components.push({
        url: `projects/${projectId}/components/${n}.${ext}`
      }));
      stl.push(`projects/${projectId}/files/${n}.stl`);
      sld.push(`projects/${projectId}/files/${n}.sldprt`);
      sld.push(`projects/${projectId}/files/${n}.sldasm`);
    }

    // Common descriptive filename tokens seen in SolidWorks portfolios.
    // We test every combination — the HEAD probe is cheap and the
    // results are cached per session.
    const tokens = [
      'Air Filter','Air Turbo','Belt Wheels','Cam Shaft','Cam Shaft Retainer',
      'Camshaft','Camshaft Bolt','Camshaft Bushing','Crankcase','Crankshaft',
      'CrankShaft Bushing','Cylinder Head','Engine Block','Exhaust Manifold',
      'Exhaust Manifold Left','Exhaust Manifold Right','Front Cover',
      'Intake Manifold','Piston','Piston Head','Piston Pin','Piston Rod',
      'piston Head','piston pin','piston Rod','Rocker Arm','Rocker Arm Body',
      'Rocker Arm Pin','Rocker Arm Wheel','Rocker Spring','Rocker Valve',
      'Rocker valve','Valve','Valve Cover','Valves Cover','Camshaft Bushing',
      'Con Rod','Connecting Rod','Crank Shaft','Turbo','Manifold','Block',
      'Head','Cover','Assembly','Engine','Cylinder','Crank','Pump','Gear',
      'Shaft','Bearing','Bolt','Nut','Bracket','Plate','Housing','Flywheel',
      'Crankcase','Exhaust','Intake','Spring','Pin','Wheel','Bushing','Belt'
    ];

    // Probe "<token>.<ext>" for components and every token for STL/SLDPRT.
    tokens.forEach(t => {
      const safe = encodeURI(t);
      IMG_EXTS.forEach(ext => components.push({
        url: `projects/${projectId}/components/${safe}.${ext}`
      }));
      stl.push(`projects/${projectId}/files/${safe}.stl`);
      sld.push(`projects/${projectId}/files/${safe}.sldprt`);
      sld.push(`projects/${projectId}/files/${safe}.sldasm`);
    });

    // Last-ditch fallback: a very broad scan of common single-word names.
    const generic = ['main','hero','preview','render','full','assembled','exploded',
      'section','view','front','side','top','bottom','back','left','right',
      'iso','angle1','angle2','angle3','shot1','shot2','shot3','detail',
      'overview'];
    generic.forEach(t => {
      IMG_EXTS.forEach(ext => components.push({
        url: `projects/${projectId}/components/${t}.${ext}`
      }));
    });

    return { components, stl, sld };
  }

  async function discover (projectId) {
    if (discoveryCache.has(projectId)) return discoveryCache.get(projectId);

    const predicted = predictFilenames(projectId);
    const componentUrls = predicted.components.map(c => c.url);
    const [existingComponents, existingStl, existingSld] = await Promise.all([
      filterExisting(componentUrls),
      filterExisting(predicted.stl),
      filterExisting(predicted.sld)
    ]);

    // Sort components numerically (01..NN), then alphabetically for the rest
    existingComponents.sort(sortByNumericPrefix);
    existingStl.sort(naturalCompare);
    existingSld.sort(naturalCompare);

    const result = {
      components: existingComponents,
      stl:        existingStl,
      sld:        existingSld
    };
    discoveryCache.set(projectId, result);
    return result;
  }

  /** Compare by the leading "NN-" or "NN." prefix if present, else fall back to natural alpha. */
  function sortByNumericPrefix (a, b) {
    const na = numericPrefix(a);
    const nb = numericPrefix(b);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return  1;
    return naturalCompare(a, b);
  }

  function numericPrefix (url) {
    const file = url.split('/').pop();
    const m = file.match(/^(\d{1,3})[-_.]/);
    return m ? parseInt(m[1], 10) : null;
  }

  function naturalCompare (a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  /** Probe a URL via HEAD; resolves to whether it returns 2xx. */
  function urlExists (url) {
    return fetch(url, { method: 'HEAD' }).then(r => r.ok).catch(() => false);
  }

  /** Filter a list of URLs down to only those that actually exist. */
  async function filterExisting (urls) {
    if (!urls.length) return [];
    // Dedupe (e.g. if a token and a generic name collide).
    const seen = new Set();
    const unique = urls.filter(u => (seen.has(u) ? false : (seen.add(u), true)));
    const checks = await Promise.all(unique.map(urlExists));
    return unique.filter((_, i) => checks[i]);
  }

  /* ---------- HOME PAGE: render project grid ---------- */

  function renderGrid () {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    grid.innerHTML = PROJECTS.map((p, idx) => {
      // If a project defines `cover`, use that image instead of the
      // overview.gif. Otherwise fall back to the animated overview.
      const coverSrc = p.cover
        ? `projects/${esc(p.id)}/${encodeURI(p.cover)}`
        : `projects/${esc(p.id)}/overview.gif`;
      const fallbackSrc = `projects/${esc(p.id)}/overview.gif`;
      const isCover = !!p.cover;
      // Projects can set `href` to override the default project.html link
      // (e.g. the Different Projects gallery card links to its in-page
      // section instead of a project detail page).
      const linkHref = p.href || `project.html?p=${encodeURIComponent(p.id)}`;
      return `
      <article class="project-card" data-project="${esc(p.id)}">
        <a class="project-card__link"
           href="${linkHref}"
           aria-label="Open full preview of ${esc(p.title)}">

          <div class="project-card__media">
            <img class="${isCover ? 'project-card__cover' : 'project-card__gif'}"
                 src="${coverSrc}"
                 alt="${esc(p.title)} ${isCover ? 'cover image' : 'animated preview'}"
                 loading="lazy"
                 onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${fallbackSrc}';}
                          else{this.classList.add('${isCover ? 'project-card__cover--missing' : 'project-card__gif--missing'}');
                          this.insertAdjacentHTML('afterend',
                          '<div class=&quot;project-card__missing&quot;>Drop your<br>overview.gif here</div>');}" />

            <div class="project-card__overlay">
              <span class="project-card__cta">Full Preview &rarr;</span>
            </div>
          </div>

          <div class="project-card__body">
            <div class="project-card__index">0${idx + 1}</div>
            <h3 class="project-card__title">${esc(p.title)}</h3>
            <p class="project-card__summary">${esc(p.summary)}</p>
            <span class="project-card__more">View project details &rarr;</span>
          </div>
        </a>
      </article>
    `;}).join('');
  }

  /* ---------- Interaction: hover & touch "Full Preview" ---------- */

  function attachHoverBehavior () {
    const cards = document.querySelectorAll('.project-card');
    const overlays = [...cards].map(c => c.querySelector('.project-card__overlay'))
                                .filter(Boolean);

    cards.forEach(card => {
      const overlay = card.querySelector('.project-card__overlay');
      if (!overlay) return;

      card.addEventListener('mouseenter', () => overlay.classList.add('is-visible'));
      card.addEventListener('mouseleave', () => overlay.classList.remove('is-visible'));

      card.addEventListener('touchstart', () => {
        overlays.forEach(o => o.classList.remove('is-visible'));
        overlay.classList.add('is-visible');
      }, { passive: true });

      // Whole card navigates on click (the <a> inside also navigates,
      // but a touch tap on the dashed overlay area misses the link).
      card.addEventListener('click', e => {
        const link = card.querySelector('.project-card__link');
        if (link && !e.target.closest('a')) {
          window.location.href = link.href;
        }
      });
    });
  }

  /* Different Projects gallery — auto-discovers files in
     projects/different-projects/, grouped by leading "NN-" prefix.
     Click an image to open it in the shared lightbox. */
  const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i;
  const VIDEO_RE = /\.(mp4|webm|mov)$/i;

  
  /* Browsers can't list directories, so we read the folder's
     manifest.json (auto-generated by build-manifest.js). If no
     manifest exists, fall back to probing a small set of common
     patterns — useful while a user is mid-update. */
  async function discoverGalleryFiles (projectId) {
    const folder = `projects/${encodeURIComponent(projectId)}`;

    // 1. Try the manifest first.
    try {
      const res = await fetch(`${folder}/manifest.json?_=${Date.now()}`,
                             { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files) && data.files.length) {
          return data.files.map(f => `${folder}/${f}`);
        }
      }
    } catch (_) { /* fall through to probing */ }

    // 2. Fallback: probe a small grid of common patterns.
    const candidates = [];
    const GALLERY_SLOTS = 15;
    const GALLERY_SINGLES = ['main','hero','cover','render','preview'];

    for (let i = 1; i <= GALLERY_SLOTS; i++) {
      const n = String(i).padStart(2, '0');
      IMG_EXTS.forEach(ext => candidates.push(`${folder}/${n}.${ext}`));
      VIDEO_EXTS.forEach(ext => candidates.push(`${folder}/${n}.${ext}`));
    }
    GALLERY_SINGLES.forEach(name => {
      IMG_EXTS.forEach(ext => candidates.push(`${folder}/${name}.${ext}`));
      VIDEO_EXTS.forEach(ext => candidates.push(`${folder}/${name}.${ext}`));
    });

    const existing = await filterExisting(candidates);
    existing.sort(sortByNumericPrefix);
    return existing;
  }

  /* Group files by leading "NN-" prefix. Each entry pre-computes the
     basename once so downstream renderers don't re-parse. */
  function groupGalleryFiles (urls) {
    const groups = new Map();
    urls.forEach(url => {
      const file  = url.split('/').pop();
      const index = numericPrefix(url);          // null if no numeric prefix
      const key   = index != null ? String(index).padStart(2, '0') : 'misc';
      if (!groups.has(key)) {
        groups.set(key, { key, index: index ?? Infinity, items: [] });
      }
      groups.get(key).items.push({ url, file });
    });

    // Friendly title from the first item of each group.
    groups.forEach(g => {
      const first = g.items[0].file;
      let stem = first.replace(/^\d{1,3}[-_.]+/, '').replace(/\.[^.]+$/, '');
      stem = stem.replace(/[-_]\d{1,3}$/, '');
      g.title = stem.replace(/[-_]+/g, ' ').trim() || `Project ${g.key}`;
    });

    return [...groups.values()].sort((a, b) => a.index - b.index);
  }

  /* Image / video predicates used by the gallery + detail-page renders. */
  function isImageUrl (url) { return IMAGE_RE.test(url); }
  function isVideoUrl (url) { return VIDEO_RE.test(url); }

  /* Document-level delegated handlers — catch gallery cards rendered
     anywhere on the page (home grid or detail page) without re-binding.
     Video cards are ignored (they have native controls). */
  function attachGalleryLightbox () {
    if (!document.querySelector('.gallery-card')) return;

    const openCard = (card) => {
      if (!card || !card.dataset.gallerySrc) return;
      if (card.classList.contains('gallery-card--video')) return;
      const caption = card.querySelector('.gallery-card__caption')?.textContent || '';
      openLightbox(card.dataset.gallerySrc, caption);
    };

    document.addEventListener('click', e => openCard(e.target.closest('.gallery-card')));

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      openCard(e.target.closest('.gallery-card'));
    });

    ensureLightbox();
  }

  /* ---------- Gallery project (Different Projects) ---------- */

  /** Read the gallery manifest and convert it to a subProjects list
   *  shaped like the other multi-project entries, so renderMultiProject
   *  (or its gallery variant) can render it consistently. */
  async function loadGalleryProjectGroups (projectId) {
    const urls = await discoverGalleryFiles(projectId);
    const groups = groupGalleryFiles(urls);
    return groups.map(g => {
      const files = g.items.map(i => i.file);

      // Detect 3D content within this group: any .STL / .SLDPRT file.
      // Match case-insensitively so casing mismatches between the PNG
      // overview and its STL/SLDPRT (e.g. "Circuit_Cover.png" vs
      // "Circuit_cover.STL") still resolve correctly.
      const overviewFile = files.find(f => /\.(png|jpe?g|webp|gif)$/i.test(f));
      const stlFile      = files.find(f => /\.stl$/i.test(f));
      const sldFile      = files.find(f => /\.sldprt$/i.test(f));
      const mediaFiles   = files.filter(f => /\.(png|jpe?g|webp|gif|mp4|webm|mov)$/i.test(f));

      return {
        id: `gallery-${g.key}`,
        title: g.title,
        description: g.items.length === 1
          ? prettyName(g.items[0].file)
          : `${g.items.length} files`,
        overview: overviewFile || null,
        stl:      stlFile      || null,
        sld:      sldFile      || null,
        media:    mediaFiles
      };
    });
  }

  /** Renders a "gallery" project whose sub-projects are auto-discovered
   *  from the project's folder. Each sub-project dispatches to one of
   *  two markup paths:
   *    - 3D sub-project (has an STL): overview + 3D viewer + downloads
   *      (same layout as renderMultiProject).
   *    - Media sub-project (images/videos only): media grid, with a
   *      full-width hero variant for single-video sub-projects. */
  function renderGalleryProject (root, project) {
    const pid        = esc(project.id);
    const title      = esc(project.title);
    const summary    = esc(project.summary);
    const description = project.description
      ? `<p class="project-hero__description">${esc(project.description)}</p>`
      : '';

    // Tear down any STL viewers left over from a prior render so we
    // don't leak Three.js contexts when the user navigates back to the
    // gallery from another detail page.
    disposeActiveViewers();

    const blocks = project.subProjects.map((sub, idx) => {
      const subDesc = sub.description
        ? `<p class="sub-project__description">${esc(sub.description)}</p>`
        : '';

      const body = sub.stl
        ? renderGallery3DSubProject(pid, sub)
        : renderGalleryMediaBlock(pid, sub);

      return `
        <section class="sub-project" id="sub-${esc(sub.id)}">
          <header class="sub-project__header">
            <div class="sub-project__index">${String(idx + 1).padStart(2, '0')}</div>
            <h3 class="sub-project__title">${esc(sub.title)}</h3>
          </header>
          ${subDesc}
          ${body}
        </section>`;
    }).join('');

    root.innerHTML = `
      <header class="project-hero">
        <a href="index.html" class="back-link">&larr; Back to all projects</a>
        <h1>${title}</h1>
        <p class="project-hero__summary">${summary}</p>
        ${description}
      </header>

      <div class="sub-projects-list">
        ${blocks}
      </div>

      <nav class="project-pager">
        ${prevNextLinks(project)}
      </nav>
    `;

    // Wire up click-to-enlarge on gallery cards AND mount 3D viewers for
    // any sub-projects that have an STL. Both run after a single rAF so
    // the browser has measured the host elements.
    requestAnimationFrame(() => {
      attachGalleryLightbox();
      const entries = [];
      project.subProjects.forEach(sub => {
        if (!sub.stl) return;
        const host = document.getElementById(`sub-viewer-${sub.id}-host`);
        if (!host) return;
        entries.push({
          host,
          src: `projects/${pid}/${encodePath(sub.stl)}`,
          label: sub.title
        });
      });
      mountLazyViewers(entries);
    });
  }

  /** Markup for a 3D-modeling sub-project: overview image + 3D viewer +
   *  SLDPRT/STL download cards. Mirrors renderMultiProject. */
  function renderGallery3DSubProject (pid, sub) {
    const subTitle    = esc(sub.title);
    const overviewSrc = sub.overview
      ? `projects/${pid}/${encodePath(sub.overview)}`
      : '';
    const stlSrc = sub.stl
      ? `projects/${pid}/${encodePath(sub.stl)}`
      : '';
    const sldSrc = sub.sld
      ? `projects/${pid}/${encodePath(sub.sld)}`
      : '';
    const viewerId = `sub-viewer-${esc(sub.id)}`;

    return `
        <div class="sub-project__layout">
          <div class="sub-project__overview">
            <h4 class="sub-project__heading">Overview</h4>
            <div class="sub-project__media">
              <img src="${esc(overviewSrc)}"
                   alt="${subTitle} overview"
                   loading="lazy"
                   onerror="this.style.display='none';
                            this.insertAdjacentHTML('afterend',
                            '<div class=&quot;placeholder-box placeholder-box--small&quot;>Drop overview image here<br><small>${esc(overviewSrc)}</small></div>');" />
            </div>
          </div>

          <div class="sub-project__viewer">
            <h4 class="sub-project__heading">3D Model</h4>
            <div class="sub-project__canvas-host" id="${viewerId}-host">
              ${stlSrc ? `
                <div class="model-overlay__hint">Drag to rotate · Scroll to zoom</div>
              ` : `
                <div class="placeholder-box placeholder-box--small">
                  Drop <code>.stl</code> in<br>
                  <small>projects/${pid}/</small>
                </div>
              `}
            </div>
            <div class="sub-project__label">${subTitle}</div>
          </div>
        </div>

        <div class="sub-project__downloads">
          <h4 class="sub-project__heading">Download Files</h4>
          <div class="sub-project__files">
            ${sldSrc ? `
              <a class="download-card" href="${esc(sldSrc)}" download>
                <div class="download-card__icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                       stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div class="download-card__body">
                  <div class="download-card__name">${subTitle}</div>
                  <div class="download-card__meta">SolidWorks Part · .sldprt</div>
                </div>
                <span class="download-card__cta">Download</span>
              </a>` : ''}
            ${stlSrc ? `
              <a class="download-card" href="${esc(stlSrc)}" download>
                <div class="download-card__icon">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                       stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div class="download-card__body">
                  <div class="download-card__name">${subTitle}</div>
                  <div class="download-card__meta">STL Mesh · .stl</div>
                </div>
                <span class="download-card__cta">Download</span>
              </a>` : ''}
          </div>
        </div>`;
  }

  /** Markup for a media-only sub-project: full-width hero player for a
   *  single video, otherwise a 3-column grid of gallery cards. */
  function renderGalleryMediaBlock (pid, sub) {
    const media = Array.isArray(sub.media) ? sub.media : [];
    if (!media.length) return '';

    const singleVideo = media.length === 1 && isVideoUrl(media[0]);
    if (singleVideo) {
      return `<div class="sub-project__hero-video">
                ${renderGalleryMediaCard(pid, media[0])}
              </div>`;
    }
    return `
      <div class="sub-project__media-grid">
        <div class="gallery-grid gallery-grid--images">
          ${media.map(file => renderGalleryMediaCard(pid, file)).join('')}
        </div>
      </div>`;
  }

  function renderGalleryMediaCard (pid, file) {
    const url = `projects/${pid}/${file}`;
    const caption = prettyName(file);
    if (isVideoUrl(url)) {
      // GIF-like: autoplay, muted, loop, no controls. playsinline is needed
      // for iOS Safari to play inline rather than fullscreen.
      return `
        <figure class="gallery-card gallery-card--video">
          <video class="gallery-card__video"
                 src="${encodePath(url)}"
                 autoplay muted loop playsinline
                 preload="metadata"
                 aria-label="${esc(caption)}"></video>
          <figcaption class="gallery-card__caption">${esc(caption)}</figcaption>
        </figure>`;
    }
    return `
      <figure class="gallery-card" data-gallery-src="${esc(url)}">
        <img class="gallery-card__img"
             src="${encodePath(url)}"
             alt="${esc(caption)}"
             loading="lazy"
             tabindex="0" />
        <figcaption class="gallery-card__caption">${esc(caption)}</figcaption>
      </figure>`;
  }

  /* ---------- Multi-project section (e.g. Surfacing) ---------- */

  /**
   * Renders a project whose `subProjects` array contains multiple
   * individual pieces. Each sub-project gets its own block with:
   *   - title + short description
   *   - overview image
   *   - interactive 3D viewer (STL)
   *   - downloadable .sldprt + .stl
   * The page also has a section-level header (project.title, summary,
   * description, highlights) — but no big "Components" grid or
   * "Download all" list, since each sub-project has its own.
   */
  function renderMultiProject (root, project) {
    const pid        = esc(project.id);
    const title      = esc(project.title);
    const summary    = esc(project.summary);
    const description = project.description
      ? `<p class="project-hero__description">${esc(project.description)}</p>`
      : '';
    const highlights = Array.isArray(project.highlights) && project.highlights.length
      ? `<div class="project-hero__highlights">
          <h3>Project Highlights</h3>
          <ul>${project.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>`
      : '';

    const blocks = project.subProjects.map((sub, idx) => {
      const subTitle = esc(sub.title);
      const subDesc  = sub.description
        ? `<p class="sub-project__description">${esc(sub.description)}</p>`
        : '';
      const overviewSrc = sub.overview
        ? `projects/${pid}/${encodeURI(sub.overview)}`
        : '';
      const stlSrc = sub.stl
        ? `projects/${pid}/${encodeURI(sub.stl)}`
        : '';
      const sldSrc = sub.sld
        ? `projects/${pid}/${encodeURI(sub.sld)}`
        : '';
      const stlFileName = sub.stl ? sub.stl.split('/').pop() : '';
      const sldFileName = sub.sld ? sub.sld.split('/').pop() : '';
      const viewerId = `sub-viewer-${esc(sub.id)}`;
      const labelName = esc(sub.title);

      // The viewer uses the same Three.js loader as the main viewer but
      // is scoped per sub-project so it doesn't conflict with anything.
      return `
        <section class="sub-project" id="sub-${esc(sub.id)}">
          <header class="sub-project__header">
            <div class="sub-project__index">${String(idx + 1).padStart(2, '0')}</div>
            <h3 class="sub-project__title">${subTitle}</h3>
          </header>
          ${subDesc}

          <div class="sub-project__layout">
            <div class="sub-project__overview">
              <h4 class="sub-project__heading">Overview</h4>
              <div class="sub-project__media">
                <img src="${esc(overviewSrc)}"
                     alt="${subTitle} overview"
                     loading="lazy"
                     onerror="this.style.display='none';
                              this.insertAdjacentHTML('afterend',
                              '<div class=&quot;placeholder-box placeholder-box--small&quot;>Drop overview image here<br><small>${esc(overviewSrc)}</small></div>');" />
              </div>
            </div>

            <div class="sub-project__viewer">
              <h4 class="sub-project__heading">3D Model</h4>
              <div class="sub-project__canvas-host" id="${viewerId}-host">
                ${stlSrc ? `
                  <div class="model-overlay__hint">Drag to rotate · Scroll to zoom</div>
                ` : `
                  <div class="placeholder-box placeholder-box--small">
                    Drop <code>.stl</code> in<br>
                    <small>projects/${pid}/files/</small>
                  </div>
                `}
              </div>
              <div class="sub-project__label">${labelName}</div>
            </div>
          </div>

          <div class="sub-project__downloads">
            <h4 class="sub-project__heading">Download Files</h4>
            <div class="sub-project__files">
              ${sldSrc ? `
                <a class="download-card" href="${esc(sldSrc)}" download>
                  <div class="download-card__icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div class="download-card__body">
                    <div class="download-card__name">${subTitle}</div>
                    <div class="download-card__meta">SolidWorks Part · .sldprt</div>
                  </div>
                  <span class="download-card__cta">Download</span>
                </a>` : ''}
              ${stlSrc ? `
                <a class="download-card" href="${esc(stlSrc)}" download>
                  <div class="download-card__icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div class="download-card__body">
                    <div class="download-card__name">${subTitle}</div>
                    <div class="download-card__meta">STL Mesh · .stl</div>
                  </div>
                  <span class="download-card__cta">Download</span>
                </a>` : ''}
            </div>
          </div>
        </section>`;
    }).join('');

    root.innerHTML = `
      <header class="project-hero">
        <a href="index.html" class="back-link">&larr; Back to all projects</a>
        <h1>${title}</h1>
        <p class="project-hero__summary">${summary}</p>
        ${description}
        ${highlights}
      </header>

      <div class="sub-projects-list">
        ${blocks}
      </div>

      <nav class="project-pager">
        ${prevNextLinks(project)}
      </nav>
    `;

    // After the DOM is in place, mount a 3D viewer in each sub-project.
    // We wait one frame so the browser has measured the host elements
    // (otherwise clientWidth/clientHeight would be 0 and the canvas
    // would overflow / position incorrectly).
    requestAnimationFrame(() => {
      const entries = [];
      project.subProjects.forEach(sub => {
        if (!sub.stl) return;
        const host = document.getElementById(`sub-viewer-${sub.id}-host`);
        if (!host) return;
        entries.push({
          host,
          src: `projects/${pid}/${encodePath(sub.stl)}`,
          label: sub.title
        });
      });
      mountLazyViewers(entries);
    });
  }

  /* ---------- Molding (mould design) detail renderer ----------
     Molding sub-projects have a dedicated layout:
       1. Sub-project header + description
       2. Full-width looping overview video (.mp4 with autoplay/loop/muted)
       3. Stacked components: PNG left, 3D viewer right, SLDPRT + STL downloads
     This mirrors the multi-project layout for the components themselves
     but opens each sub-project with a video instead of a static image. */
  function renderMoldingProject (root, project) {
    const pid         = esc(project.id);
    const title       = esc(project.title);
    const summary     = esc(project.summary);
    const description = project.description
      ? `<p class="project-hero__description">${esc(project.description)}</p>`
      : '';
    const highlights = Array.isArray(project.highlights) && project.highlights.length
      ? `<div class="project-hero__highlights">
          <h3>Project Highlights</h3>
          <ul>${project.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>`
      : '';

    // Each sub-project becomes a <section class="sub-project"> with a
    // looping video hero followed by stacked component rows.
    const blocks = project.subProjects.map((sub, idx) => {
      const subTitle   = esc(sub.title);
      const subDesc    = sub.description
        ? `<p class="sub-project__description">${esc(sub.description)}</p>`
        : '';

      // Looping overview video — same autoplay/loop/muted attributes that
      // make it behave like a GIF. The poster is intentionally omitted so
      // the video itself drives the first frame.
      const videoSrc = sub.overviewVideo
        ? `projects/${pid}/${encodePath(sub.overviewVideo)}`
        : '';

      // Each component row: PNG on the left, 3D viewer on the right.
      const componentRows = (sub.components || []).map((c, cIdx) => {
        const cTitle    = esc(c.title);
        const pngSrc    = c.png ? `projects/${pid}/${encodePath(c.png)}` : '';
        const stlSrc    = c.stl ? `projects/${pid}/${encodePath(c.stl)}` : '';
        const sldSrc    = c.sld ? `projects/${pid}/${encodePath(c.sld)}` : '';
        const viewerId  = `mold-viewer-${esc(sub.id)}-${esc(c.id)}`;
        const pngName   = c.png ? c.png.split('/').pop() : '';
        const stlName   = c.stl ? c.stl.split('/').pop() : '';
        const cNumber   = String(cIdx + 1).padStart(2, '0');

        return `
          <div class="mold-component" id="mold-${esc(sub.id)}-${esc(c.id)}">
            <div class="mold-component__header">
              <div class="sub-project__index">${cNumber}</div>
              <h4 class="mold-component__title">${cTitle}</h4>
            </div>

            <div class="sub-project__layout">
              <div class="sub-project__overview">
                <div class="sub-project__media">
                  <img src="${esc(pngSrc)}"
                       alt="${cTitle} from ${subTitle}"
                       loading="lazy"
                       onerror="this.style.display='none';
                                this.insertAdjacentHTML('afterend',
                                '<div class=&quot;placeholder-box placeholder-box--small&quot;>Drop overview image here<br><small>${esc(pngName)}</small></div>');" />
                </div>
              </div>

              <div class="sub-project__viewer">
                <div class="sub-project__canvas-host" id="${viewerId}-host">
                  ${stlSrc ? `
                    <div class="model-overlay__hint">Drag to rotate · Scroll to zoom</div>
                  ` : `
                    <div class="placeholder-box placeholder-box--small">
                      Drop <code>.stl</code> in<br>
                      <small>${esc(stlName || 'projects/' + pid + '/files/')}</small>
                    </div>
                  `}
                </div>
                <div class="sub-project__label">${cTitle}</div>
              </div>
            </div>

            <div class="sub-project__downloads">
              <div class="sub-project__files">
                ${sldSrc ? `
                  <a class="download-card" href="${esc(sldSrc)}" download>
                    <div class="download-card__icon">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                           stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div class="download-card__body">
                      <div class="download-card__name">${cTitle}</div>
                      <div class="download-card__meta">SolidWorks Part · .sldprt</div>
                    </div>
                    <span class="download-card__cta">Download</span>
                  </a>` : ''}
                ${stlSrc ? `
                  <a class="download-card" href="${esc(stlSrc)}" download>
                    <div class="download-card__icon">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                           stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div class="download-card__body">
                      <div class="download-card__name">${cTitle}</div>
                      <div class="download-card__meta">STL Mesh · .stl</div>
                    </div>
                    <span class="download-card__cta">Download</span>
                  </a>` : ''}
              </div>
            </div>
          </div>`;
      }).join('');

      return `
        <section class="sub-project" id="sub-${esc(sub.id)}">
          <header class="sub-project__header">
            <div class="sub-project__index">${String(idx + 1).padStart(2, '0')}</div>
            <h3 class="sub-project__title">${subTitle}</h3>
          </header>
          ${subDesc}

          ${videoSrc ? `
          <div class="sub-project__overview sub-project__overview--video">
            <h4 class="sub-project__heading">Overview</h4>
            <div class="sub-project__media sub-project__media--video">
              <video class="mold-video"
                     src="${esc(videoSrc)}"
                     autoplay
                     muted
                     loop
                     playsinline
                     preload="metadata"
                     aria-label="${subTitle} assembly overview"></video>
            </div>
          </div>
          ` : ''}

          ${componentRows ? `
            <div class="mold-components">
              <h4 class="sub-project__heading">Components</h4>
              ${componentRows}
            </div>
          ` : ''}
        </section>`;
    }).join('');

    // Engine-specific extras (V6 Engine): piston working animation and
    // exploded view GIFs sit above the per-component layout. Driven by
    // project.showWorkingView, no impact on other mold-routed projects.
    const showWorkingView = !!project.showWorkingView;
    const workingViewBlock = showWorkingView ? `
      <section class="project-section">
        <h2 class="section-title">Piston Working View and Exploded Layout</h2>
        <p class="section-subtitle">
          Animated views showing the piston motion inside the cylinder and the full engine breakdown.
        </p>
        <div class="view-grid">
          <figure class="view-card">
            <div class="view-card__media">
              <video src="projects/${pid}/piston.mp4"
                     autoplay
                     loop
                     muted
                     playsinline
                     preload="auto"
                     aria-label="${title} piston working animation"
                     onerror="this.style.display='none';
                              this.insertAdjacentHTML('afterend',
                              '<div class=&quot;placeholder-box placeholder-box--small&quot;>Drop <code>piston.mp4</code> here<br><small>projects/${pid}/piston.mp4</small></div>');">
              </video>
            </div>
            <figcaption class="view-card__caption">
              <span class="view-card__label">Piston Working View</span>
              <span class="view-card__hint">Looping motion, piston travel inside the cylinder</span>
            </figcaption>
          </figure>

          <figure class="view-card">
            <div class="view-card__media">
              <video src="projects/${pid}/Exploded_Video.mp4"
                     autoplay
                     loop
                     muted
                     playsinline
                     preload="auto"
                     aria-label="${title} exploded view animation"
                     onerror="this.style.display='none';
                              this.insertAdjacentHTML('afterend',
                              '<div class=&quot;placeholder-box placeholder-box--small&quot;>Drop <code>Exploded_Video.mp4</code> here<br><small>projects/${pid}/Exploded_Video.mp4</small></div>');">
              </video>
            </div>
            <figcaption class="view-card__caption">
              <span class="view-card__label">Exploded View</span>
              <span class="view-card__hint">Looping breakdown, parts separated along assembly axes</span>
            </figcaption>
          </figure>
        </div>
      </section>
    ` : '';

    root.innerHTML = `
      <header class="project-hero">
        <a href="index.html" class="back-link">&larr; Back to all projects</a>
        <h1>${title}</h1>
        <p class="project-hero__summary">${summary}</p>
        ${description}
        ${highlights}
      </header>

      ${workingViewBlock}

      <div class="sub-projects-list">
        ${blocks}
      </div>

      <nav class="project-pager">
        ${prevNextLinks(project)}
      </nav>
    `;

    // Mount a 3D viewer in every mold-component row. We use a lazy
    // IntersectionObserver-based mount so that pages with many viewers
    // (e.g. V6 Engine with 25 components) don't exhaust the browser's
    // WebGL context budget on initial load — viewers mount as they
    // scroll into view and dispose when scrolled out.
    requestAnimationFrame(() => {
      const entries = [];
      project.subProjects.forEach(sub => {
        (sub.components || []).forEach(c => {
          if (!c.stl) return;
          const host = document.getElementById(`mold-viewer-${sub.id}-${c.id}-host`);
          if (!host) return;
          entries.push({
            host,
            src: `projects/${pid}/${encodePath(c.stl)}`,
            label: c.title
          });
        });
      });
      mountLazyViewers(entries);
    });
  }

  /* ---------- Detail page ---------- */

  async function renderDetailPage () {
    const root = document.getElementById('project-detail');
    if (!root) return;

    // Tear down any viewers that may be left over from a previous
    // detail page render (e.g. browser back/forward). mountLazyViewers
    // also handles re-registration safely, but disposing up-front
    // frees WebGL contexts sooner.
    disposeLazyViewers();

    const projectId = qs('p') || root.dataset.project;
    const project   = getProject(projectId);

    if (!project) {
      root.innerHTML = `
        <div class="empty">
          <h2>Project not found</h2>
          <p>Sorry, we couldn't find that project.</p>
          <a href="index.html" class="btn btn--primary">&larr; Back to all projects</a>
        </div>`;
      return;
    }

    document.title = `${project.title} | ${CONTACT.name} | SolidWorks Portfolio`;

    // Gallery projects (like "3D Modeling") render as a stack of
    // sub-project blocks auto-derived from manifest.json. Each block
    // is dispatched per content type: 3D sub-projects get an overview
    // image + 3D viewer + downloads; media-only sub-projects get a
    // media grid (with a full-width hero variant for single videos).
    if (project.isGallery) {
      const groups = await loadGalleryProjectGroups(project.id);
      const galleryProject = { ...project, isMulti: true, subProjects: groups };
      renderGalleryProject(root, galleryProject);
      return;
    }

    // Molding (mould design) projects have a dedicated layout: each
    // sub-project opens with a looping overview video, followed by
    // stacked component rows (PNG left + 3D viewer right + downloads).
    if (project.isMold && Array.isArray(project.subProjects)) {
      renderMoldingProject(root, project);
      return;
    }

    // Multi-project sections (like Surfacing) render with a different layout:
    // a section-level intro, then a stack of sub-project blocks, each with
    // its own overview image, 3D viewer, and downloads.
    if (project.isMulti && Array.isArray(project.subProjects)) {
      renderMultiProject(root, project);
      return;
    }

    // Explicit lists in projects.js take precedence over auto-discovery.
    let components = project.components || [];
    let stlFiles   = project.files?.stl || [];
    let sldFiles   = project.files?.sld || [];

    if (!project.components && !project.files) {
      const found = await discover(projectId);
      components = found.components;
      stlFiles   = found.stl;
      sldFiles   = found.sld;
    }

    // Build a name -> component image URL map so download cards can show
    // a small thumbnail of the actual part. Keys are normalized to
    // lowercase, no extension — e.g. "engine block" -> "projects/v6-engine/components/11-Engine Block.png".
    // This handles:
    //   - case mismatch (files have "piston Head.png", SLDPRT has "piston Head.SLDPRT")
    //   - small naming differences between PNG and SLD/STL files
    //   - cached auto-discovery (where components is a list of URLs)
    //
    // Edge cases (e.g. "CrankShaft Bushing" vs "Camshaft Bushing") will
    // simply fall back to the generic icon — which is fine.
    const componentImageMap = buildComponentImageMap(components);

    const title       = esc(project.title);
    const summary     = esc(project.summary);
    const description = project.description
      ? `<p class="project-hero__description">${esc(project.description)}</p>`
      : '';

    // The piston/exploded section is only meaningful for engine-style
    // projects. Set `showWorkingView: true` in projects.js to enable it.
    const showWorkingView = !!project.showWorkingView;
    const highlights  = Array.isArray(project.highlights) && project.highlights.length
      ? `<div class="project-hero__highlights">
          <h3>Project Highlights</h3>
          <ul>${project.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>`
      : '';
    const pid      = esc(project.id);

    root.innerHTML = `
      <header class="project-hero">
        <a href="index.html" class="back-link">&larr; Back to all projects</a>
        <h1>${title}</h1>
        <p class="project-hero__summary">${summary}</p>
        ${description}
        ${highlights}
      </header>

      <section class="project-section">
        <h2 class="section-title">Overview</h2>
        <div class="project-hero__media">
          <img src="projects/${pid}/overview.gif"
               alt="${title} animated preview"
               onerror="this.style.display='none';
                        this.insertAdjacentHTML('afterend',
                        '<div class=&quot;placeholder-box&quot;>Drop your overview.gif here<br><small>projects/${pid}/overview.gif</small></div>');" />
        </div>
      </section>

      ${showWorkingView ? `
      <section class="project-section">
        <h2 class="section-title">Piston Working View &amp; Exploded Layout</h2>
        <p class="section-subtitle">
          Animated views showing the piston motion inside the cylinder and the full engine breakdown.
        </p>
        <div class="view-grid">
          <figure class="view-card">
            <div class="view-card__media">
              <video src="projects/${pid}/piston.mp4"
                     autoplay
                     loop
                     muted
                     playsinline
                     preload="auto"
                     aria-label="${title} piston working animation"
                     onerror="this.style.display='none';
                              this.insertAdjacentHTML('afterend',
                              '<div class=&quot;placeholder-box placeholder-box--small&quot;>Drop <code>piston.mp4</code> here<br><small>projects/${pid}/piston.mp4</small></div>');">
              </video>
            </div>
            <figcaption class="view-card__caption">
              <span class="view-card__label">Piston Working View</span>
              <span class="view-card__hint">Looping motion, piston travel inside the cylinder</span>
            </figcaption>
          </figure>

          <figure class="view-card">
            <div class="view-card__media">
              <video src="projects/${pid}/Exploded_Video.mp4"
                     autoplay
                     loop
                     muted
                     playsinline
                     preload="auto"
                     aria-label="${title} exploded view animation"
                     onerror="this.style.display='none';
                              this.insertAdjacentHTML('afterend',
                              '<div class=&quot;placeholder-box placeholder-box--small&quot;>Drop <code>Exploded_Video.mp4</code> here<br><small>projects/${pid}/Exploded_Video.mp4</small></div>');">
              </video>
            </div>
            <figcaption class="view-card__caption">
              <span class="view-card__label">Exploded View</span>
              <span class="view-card__hint">Looping breakdown, parts separated along assembly axes</span>
            </figcaption>
          </figure>
        </div>
      </section>
      ` : ''}

      <section class="project-section">
        <h2 class="section-title">Components</h2>
        <p class="section-subtitle">
          Individual component renders from the assembly. Click any image to enlarge.
        </p>
        <div class="components-grid" id="components-grid">
          ${components.length ? components.map(url => {
            const file = esc(url.split('/').pop());
            const caption = esc(prettyName(file));
            return `
              <figure class="component-card">
                <img src="${esc(url)}" alt="${caption}" loading="lazy" />
                <figcaption>${caption}</figcaption>
              </figure>`;
          }).join('') : `
            <div class="component-card component-card--missing" style="grid-column:1/-1;">
              <div class="placeholder-box placeholder-box--small">
                Drop component images (e.g. <code>01.jpg</code>, <code>02.png</code>) in<br>
                <small>projects/${pid}/components/</small>
              </div>
            </div>
          `}
        </div>
      </section>

      <section class="project-section">
        <h2 class="section-title">3D Models <small>(STL, interactive viewer)</small></h2>
        <p class="section-subtitle">
          Drag to rotate, scroll to zoom. The primary part is shown in the
          viewer below. Click any thumbnail to swap to that part. All files
          are also available in the download list further down.
        </p>
        <div class="model-viewers" id="model-viewers">
          ${stlFiles.length ? (() => {
            // Feature only the most "primary" STL prominently in a single
            // real 3D viewer, with the remaining STLs as clickable
            // thumbnails that swap the primary viewer on click.
            // This avoids the cost (and CORS problems) of trying to spin up
            // 25 separate WebGL contexts at once.
            const primary   = stlFiles[0];
            const rest      = stlFiles.slice(1);
            const encSrc    = encodePath(primary);
            const fallbackHref = encodePath(primary);
            const labelName = prettyName(primary.split('/').pop());
            return `
              <div class="model-wrapper model-wrapper--primary" id="primary-viewer-wrap">
                <div class="model-canvas-host" id="primary-viewer"></div>
                <div class="model-overlay">
                  <div class="model-overlay__hint">Drag to rotate &middot; Scroll to zoom</div>
                  <div class="model-overlay__loading" id="primary-loading">Loading ${esc(labelName)}…</div>
                </div>
                <div class="model-fallback" hidden>
                  <p>3D viewer could not load this STL. Your browser
                     may not support WebGL or the file failed to download.</p>
                  <p><a href="${fallbackHref}" download>Download “${esc(labelName)}” STL directly</a>.</p>
                </div>
                <div class="model-label" id="primary-label">${esc(labelName)}</div>
              </div>
              ${stlFiles.length > 1 ? `
                <div class="model-thumbnails" id="model-thumbnails">
                  ${stlFiles.map((url, idx) => {
                    const file      = url.split('/').pop();
                    const encFile   = encodePath(url);
                    const label     = prettyName(file);
                    return `
                      <button type="button"
                              class="model-thumb ${idx === 0 ? 'is-active' : ''}"
                              data-stl-url="${encFile}"
                              data-stl-idx="${idx}"
                              aria-pressed="${idx === 0 ? 'true' : 'false'}">
                        <span class="model-thumb__index">${String(idx + 1).padStart(2, '0')}</span>
                        <span class="model-thumb__label">${esc(label)}</span>
                      </button>`;
                  }).join('')}
                </div>` : ''}
            `;
          })() : `
            <div class="model-wrapper model-wrapper--missing">
              <div class="placeholder-box">
                Drop your <code>.stl</code> files in<br>
                <small>projects/${pid}/files/</small>
              </div>
            </div>
          `}
        </div>
      </section>

      <section class="project-section">
        <h2 class="section-title">Download CAD Files</h2>
        <p class="section-subtitle">
          Source files for inspection and re-use. Two formats are provided
          for each part, the editable SolidWorks file (.sldprt and .sldasm)
          and a mesh export (.stl). Pick whichever suits your workflow.
        </p>

        ${(() => {
          // Split by extension, dedupe by basename (case-insensitive), and
          // render two clearly-separated sub-sections. Previously these
          // were merged into a single list which made it look like every
          // part appeared twice — splitting them with labelled headers
          // makes it obvious they are two different formats.
          const renderList = (urls, exts, emptyLabel) => {
            if (!urls.length) {
              return `
                <div class="download-list">
                  <div class="download-card download-card--missing">
                    <div class="download-card__icon">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                           stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                    <div class="download-card__body">
                      <div class="download-card__name">${esc(emptyLabel)}</div>
                      <div class="download-card__meta">projects/${pid}/files/</div>
                    </div>
                    <span class="download-card__cta">Add files</span>
                  </div>
                </div>`;
            }
            return `
              <div class="download-list">
                ${urls.map(url => {
                  const file  = url.split('/').pop();
                  const ext   = (file.split('.').pop() || '').toLowerCase();
                  const label = prettyName(file);
                  const meta  = ext === 'sldprt' ? 'SolidWorks Part'
                              : ext === 'sldasm' ? 'SolidWorks Assembly'
                              : ext === 'stl'    ? 'STL Mesh'
                                                  : ext.toUpperCase();
                  // Look up the matching component image for this file.
                  const imgUrl = findComponentImage(file, componentImageMap);
                  const iconBlock = imgUrl
                    ? `<div class="download-card__icon download-card__icon--image">
                         <img src="${esc(encodePath(imgUrl))}" alt="${esc(label)} thumbnail" loading="lazy" />
                       </div>`
                    : `<div class="download-card__icon">
                         <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                              stroke="currentColor" stroke-width="2"
                              stroke-linecap="round" stroke-linejoin="round">
                           <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                           <polyline points="14 2 14 8 20 8"/>
                         </svg>
                       </div>`;
                  return `
                    <a class="download-card" href="${encodePath(url)}" download>
                      ${iconBlock}
                      <div class="download-card__body">
                        <div class="download-card__name">${esc(label)}</div>
                        <div class="download-card__meta">${esc(meta)} &middot; .${esc(ext)}</div>
                      </div>
                      <span class="download-card__cta">Download</span>
                    </a>`;
                }).join('')}
              </div>`;
          };

          // Dedupe within each category by the basename (case-insensitive)
          // — defensive guard in case auto-discovery adds the same file twice.
          const dedupeByName = (urls) => {
            const seen = new Set();
            return urls.filter(u => {
              const k = u.split('/').pop().toLowerCase();
              return seen.has(k) ? false : seen.add(k);
            });
          };
          const dedupSld = dedupeByName(sldFiles);
          const dedupStl = dedupeByName(stlFiles);

          const hasSld = dedupSld.length > 0;
          const hasStl = dedupStl.length > 0;

          return `
            ${(hasSld || hasStl) ? `
              <h3 class="download-group-title download-group-title--sld">
                <span class="download-group-title__chip">SolidWorks</span>
                Editable source files (.sldprt and .sldasm), open in SolidWorks
              </h3>
              ${renderList(dedupSld, ['sldprt', 'sldasm'], 'No SolidWorks files yet')}

              <h3 class="download-group-title download-group-title--stl">
                <span class="download-group-title__chip">STL Mesh</span>
                Mesh exports (.stl), viewable in any 3D viewer
              </h3>
              ${renderList(dedupStl, ['stl'], 'No STL files yet')}
            ` : `
              <div class="download-list">
                <div class="download-card download-card--missing">
                  <div class="download-card__icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                  <div class="download-card__body">
                    <div class="download-card__name">Drop .sldprt / .sldasm / .stl here</div>
                    <div class="download-card__meta">projects/${pid}/files/</div>
                  </div>
                  <span class="download-card__cta">Add files</span>
                </div>
              </div>
            `}
          `;
        })()}
      </section>

      <nav class="project-pager">
        ${prevNextLinks(project)}
      </nav>
    `;

    attachLightbox();
    attachSTLViewer();
  }

  function prevNextLinks (current) {
    const idx  = PROJECTS.findIndex(p => p.id === current.id);
    const prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
    const next = PROJECTS[(idx + 1) % PROJECTS.length];
    return `
      <a class="btn btn--ghost"   href="project.html?p=${encodeURIComponent(prev.id)}">&larr; ${esc(prev.title)}</a>
      <a class="btn btn--primary" href="project.html?p=${encodeURIComponent(next.id)}">${esc(next.title)} &rarr;</a>
    `;
  }

  function attachLightbox () {
    const grid = document.getElementById('components-grid');
    if (!grid) return;

    grid.addEventListener('click', e => {
      const img = e.target.closest('img');
      if (!img) return;
      e.preventDefault();
      openLightbox(img.src, img.alt);
    });

    ensureLightbox();
  }

  let lightboxInitialized = false;
  function ensureLightbox () {
    if (lightboxInitialized) return;
    lightboxInitialized = true;

    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Close">&times;</button>
      <img class="lightbox__img" alt="" />
    `;
    document.body.appendChild(lb);
    lb.addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox__close').addEventListener('click', e => {
      e.stopPropagation();
      closeLightbox();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  function openLightbox (src, alt) {
    const lb = document.getElementById('lightbox');
    lb.querySelector('.lightbox__img').src = src;
    lb.querySelector('.lightbox__img').alt = alt || '';
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox () {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ---------- Mobile nav ---------- */

  /* ---------- 3D STL viewer (Three.js) ----------
     A custom Three.js-based STL viewer. Replaces the old <model-viewer>
     approach because <model-viewer> is hosted on unpkg.com and tried to
     fetch local STL files from inside a cross-origin worker context, which
     was blocked by CORS.

     Instead we load Three.js directly into the page's main context (via a
     classic <script> tag), so all STL fetches are same-origin and work
     fine. The viewer supports:
       - drag to rotate (mouse + touch)
       - scroll / pinch to zoom
       - slow auto-rotation when idle
       - smooth lighting + metallic-ish material
       - auto-resize on window resize
     ---------------------------------------------------------------- */

  // Active viewers so we can dispose them on swap (prevents leaks).
  const activeViewers = new Set();

  function attachSTLViewer () {
    const host = document.getElementById('primary-viewer');
    if (!host) return;

    // Bail out gracefully if Three.js didn't load (e.g. CDN blocked).
    if (typeof THREE === 'undefined' || typeof THREE.STLLoader === 'undefined') {
      host.innerHTML = '';
      const wrap = host.closest('.model-wrapper');
      const fb   = wrap && wrap.querySelector('.model-fallback');
      if (fb) fb.removeAttribute('hidden');
      return;
    }

    const initialThumb = document.querySelector('.model-thumb.is-active');
    const initialUrl   = initialThumb ? initialThumb.dataset.stlUrl
                                      : host.dataset.stlUrl;
    const initialLabel = initialThumb
      ? initialThumb.querySelector('.model-thumb__label').textContent
      : (document.getElementById('primary-label')?.textContent || '');

    if (initialUrl) {
      createSTLViewer(host, initialUrl, initialLabel);
    }

    // Wire up click-to-swap on the thumbnails.
    const thumbs = document.querySelectorAll('.model-thumb');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        // Update active state.
        thumbs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-pressed', 'false');
        });
        thumb.classList.add('is-active');
        thumb.setAttribute('aria-pressed', 'true');

        const url   = thumb.dataset.stlUrl;
        const label = thumb.querySelector('.model-thumb__label').textContent;

        // Update the visible label immediately so the UI feels snappy.
        const labelEl = document.getElementById('primary-label');
        if (labelEl) labelEl.textContent = label;

        const loadingEl = document.getElementById('primary-loading');
        if (loadingEl) loadingEl.textContent = `Loading ${label}…`;

        // Tear down any active viewer(s) and spin up a new one.
        disposeActiveViewers();
        host.innerHTML = '';
        createSTLViewer(host, url, label);
      });
    });
  }

  function disposeActiveViewers () {
    activeViewers.forEach(v => {
      try { v.dispose(); } catch (e) { /* noop */ }
    });
    activeViewers.clear();
  }

  // Lazy viewer registry: tracks hosts that have been observed so we can
  // dispose + re-attach when pages swap. Keyed by host element id so
  // duplicate registrations are deduplicated.
  const lazyViewerHosts = new Map();  // id -> { host, src, label, mounted, observer, viewer }

  // Single shared IntersectionObserver across the page. rootMargin pre-mounts
  // viewers ~300px before they enter the viewport so scrolling feels instant,
  // and keeps them alive while still in or near the viewport. Once a viewer
  // scrolls more than 600px past the viewport, it's disposed to free the
  // WebGL context — critical for pages like V6 Engine with 25 simultaneous
  // STL meshes, where browsers silently drop contexts beyond ~8-16 active.
  let lazyObserver = null;
  function getLazyObserver () {
    if (lazyObserver) return lazyObserver;
    lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id  = entry.target.id;
        const rec = lazyViewerHosts.get(id);
        if (!rec) return;
        if (entry.isIntersecting) {
          // Visible — mount if we haven't already.
          if (!rec.mounted) mountLazyViewer(rec);
        } else if (rec.mounted) {
          // Off-screen far enough — free the WebGL context.
          disposeLazyViewer(rec);
        }
      });
    }, {
      // Pre-mount 300px before entering, keep alive 300px after leaving.
      rootMargin: '300px 0px 300px 0px',
      threshold: 0
    });
    return lazyObserver;
  }

  function mountLazyViewer (rec) {
    if (!rec.host || rec.mounted) return;
    try {
      const viewer = createSTLViewer(rec.host, rec.src, rec.label);
      rec.viewer  = viewer;
      rec.mounted = true;
    } catch (e) {
      console.error('Lazy viewer mount failed:', e);
    }
  }

  function disposeLazyViewer (rec) {
    if (!rec.mounted) return;
    try { rec.viewer && rec.viewer.dispose(); } catch (e) { /* noop */ }
    rec.viewer  = null;
    rec.mounted = false;
    // Clear any leftover canvas so a re-mount starts clean.
    if (rec.host) rec.host.innerHTML = '';
    // Re-add the hint placeholder so the host looks correct while empty.
    const hint = document.createElement('div');
    hint.className = 'model-overlay__hint';
    hint.textContent = 'Drag to rotate · Scroll to zoom';
    rec.host.appendChild(hint);
  }

  /**
   * Register a list of {host, src, label} entries to mount lazily as
   * they enter the viewport. Replaces the old eager mount loop so
   * pages with many STL viewers (e.g. V6 Engine, 25 components) don't
   * exhaust the browser's WebGL context budget on initial load.
   */
  function mountLazyViewers (entries) {
    const observer = getLazyObserver();
    entries.forEach(({ host, src, label }) => {
      if (!host || !host.id) return;
      // If already registered (e.g. re-render of the same project),
      // dispose any active viewer first so we get a fresh mount.
      if (lazyViewerHosts.has(host.id)) {
        disposeLazyViewer(lazyViewerHosts.get(host.id));
        observer.unobserve(host);
        lazyViewerHosts.delete(host.id);
      }
      const rec = { host, src, label, mounted: false, viewer: null };
      lazyViewerHosts.set(host.id, rec);
      observer.observe(host);
    });
  }

  /**
   * Tear down all lazy viewers on the page. Called when navigating
   * between project pages so contexts are released before the next
   * set of hosts is registered.
   */
  function disposeLazyViewers () {
    if (lazyObserver) {
      lazyViewerHosts.forEach((rec) => {
        try { observer_unobserve(lazyObserver, rec.host); } catch (e) { /* noop */ }
        disposeLazyViewer(rec);
      });
      lazyViewerHosts.clear();
    }
  }

  function observer_unobserve (observer, host) {
    try { observer.unobserve(host); } catch (e) { /* noop */ }
  }

  /**
   * Create a Three.js STL viewer inside `container`. Returns a handle
   * exposing a dispose() method for clean teardown.
   */
  function createSTLViewer (container, src, label) {
    // The container must have a definite height before we read its
    // dimensions. If it doesn't yet (e.g. just inserted into the DOM),
    // force a layout reflow and use sensible defaults.
    let width  = container.clientWidth;
    let height = container.clientHeight;
    if (!width || !height) {
      // Use the host's intrinsic min-height (340px) as a floor.
      const cs = container.ownerDocument.defaultView.getComputedStyle(container);
      height = parseFloat(cs.minHeight) || 340;
      width  = container.parentElement
        ? container.parentElement.clientWidth
        : 800;
    }

    // --- Scene --------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1f2b);

    // --- Camera -------------------------------------------------------
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 0, 100);

    // --- Renderer -----------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width   = '100%';
    renderer.domElement.style.height  = '100%';

    // --- Lighting -----------------------------------------------------
    // Bright enough to read details, with a rim light for definition.
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(60, 100, 80);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9bbcff, 0.4);
    fill.position.set(-80, -40, 60);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.35);
    rim.position.set(0, -80, -60);
    scene.add(rim);

    // --- Interaction state -------------------------------------------
    let isPointerDown = false;
    let pointerStartX = 0, pointerStartY = 0;
    let rotX = -0.4, rotY = 0.6;     // initial pose: 3/4 view
    let targetRotX = rotX, targetRotY = rotY;
    let zoomDist = 100;
    let targetZoom = zoomDist;
    let lastInteraction = 0;
    const autoRotateSpeed = 0.0035;

    const onPointerDown = (e) => {
      isPointerDown = true;
      const pt = pointerPos(e);
      pointerStartX = pt.x;
      pointerStartY = pt.y;
      lastInteraction = performance.now();
      try { renderer.domElement.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const onPointerMove = (e) => {
      if (!isPointerDown) return;
      const pt = pointerPos(e);
      const dx = pt.x - pointerStartX;
      const dy = pt.y - pointerStartY;
      pointerStartX = pt.x;
      pointerStartY = pt.y;
      targetRotY += dx * 0.01;
      targetRotX += dy * 0.01;
      // Clamp pitch so we don't flip upside down.
      const limit = Math.PI / 2 - 0.05;
      if (targetRotX >  limit) targetRotX =  limit;
      if (targetRotX < -limit) targetRotX = -limit;
      lastInteraction = performance.now();
    };
    const onPointerUp = (e) => {
      isPointerDown = false;
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    const onWheel = (e) => {
      e.preventDefault();
      // Scale the wheel delta so zooming feels natural. We anchor the
      // bounds to a fraction of the default distance so you can always
      // zoom in tight or pull way out, regardless of model size.
      const baseDist = Math.max(targetZoom, 30);
      targetZoom += e.deltaY * 0.04;
      const minZoom = baseDist * 0.25;   // can zoom in 4x from default
      const maxZoom = baseDist * 5;      // can zoom out 5x from default
      if (targetZoom < minZoom) targetZoom = minZoom;
      if (targetZoom > maxZoom) targetZoom = maxZoom;
      lastInteraction = performance.now();
    };

    // Pointer events cover both mouse and touch in modern browsers.
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup',   onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('pointerleave',  onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    function pointerPos (e) {
      // Use offsetX/Y when available so dragging outside the canvas
      // (via pointer capture) doesn't fly off.
      if (e.offsetX !== undefined) return { x: e.offsetX, y: e.offsetY };
      const rect = renderer.domElement.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    // --- Resize handler ----------------------------------------------
    function onResize () {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', onResize);

    // --- Load STL ----------------------------------------------------
    const loadingEl = document.getElementById('primary-loading');
    const onLoad = (geometry) => {
      if (loadingEl) loadingEl.style.display = 'none';

      // Center & scale to fit a "unit cube" of ~50 units.
      geometry.center();
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const fitSize = 50;
      const scale = fitSize / maxDim;

      // MeshPhongMaterial: bright enough to read, slight specular sheen.
      const material = new THREE.MeshPhongMaterial({
        color:        0x6aa3ff,
        specular:     0x2a3a55,
        shininess:    38,
        flatShading:  false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Set initial camera distance based on the SCALED model size.
      // After scaling, the mesh fits a 50-unit cube (fitSize). The camera
      // distance needs to be enough to see the whole mesh — for a 45° FOV
      // camera, distance = (size/2) / tan(fov/2), with a safety margin
      // so the model isn't flush against the edges of the viewport.
      const fov = camera.fov * (Math.PI / 180);
      const safeDist = (fitSize / 2) / Math.tan(fov / 2);
      const aspect   = camera.aspect;
      const aspectAdj = aspect < 1 ? aspect : 1;     // tighter on tall viewports
      targetZoom = safeDist * 1.15 / Math.max(aspectAdj, 0.5);
      zoomDist   = targetZoom;
    };

    const onError = (err) => {
      console.error('STL load failed:', err);
      if (loadingEl) loadingEl.style.display = 'none';
      const wrap = container.closest('.model-wrapper');
      const fb   = wrap && wrap.querySelector('.model-fallback');
      if (fb) fb.removeAttribute('hidden');
    };

    const loader = new THREE.STLLoader();
    try {
      loader.load(src, onLoad, undefined, onError);
    } catch (e) {
      onError(e);
    }

    // --- Animation loop ----------------------------------------------
    let rafId = 0;
    let disposed = false;
    function animate () {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);

      // Auto-rotate after 1.5s of inactivity.
      const idleMs = performance.now() - lastInteraction;
      if (!isPointerDown && idleMs > 1500) {
        targetRotY += autoRotateSpeed;
      }

      // Smoothly interpolate toward targets so motion is fluid.
      rotX += (targetRotX - rotX) * 0.12;
      rotY += (targetRotY - rotY) * 0.12;
      zoomDist += (targetZoom - zoomDist) * 0.12;

      camera.position.set(0, 0, zoomDist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      // Apply rotations to the scene group (so all loaded meshes rotate).
      scene.rotation.x = rotX;
      scene.rotation.y = rotY;

      renderer.render(scene, camera);
    }
    animate();

    // --- Dispose handle ----------------------------------------------
    const handle = {
      dispose () {
        disposed = true;
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup',   onPointerUp);
        renderer.domElement.removeEventListener('pointercancel', onPointerUp);
        renderer.domElement.removeEventListener('pointerleave',  onPointerUp);
        renderer.domElement.removeEventListener('wheel', onWheel);
        // Dispose scene resources.
        scene.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose && obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose());
            else obj.material.dispose && obj.material.dispose();
          }
        });
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
    activeViewers.add(handle);
    return handle;
  }

  /* ---------- Mobile nav ---------- */

  function attachNav () {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Active nav link on scroll ---------- */

  function attachScrollSpy () {
    const links = document.querySelectorAll('.nav a[href^="#"]');
    if (!links.length) return;
    const sections = [...links].map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    const onScroll = () => {
      const y = window.scrollY + 120;
      let current = null;
      sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
      links.forEach(a => {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Smooth scroll for in-page links ---------- */

  function attachSmoothScroll () {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
      });
    });
  }

  /* ---------- Init ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    renderGrid();
    attachHoverBehavior();
    renderDetailPage();
    attachNav();
    attachScrollSpy();
    attachSmoothScroll();
  });
})();
