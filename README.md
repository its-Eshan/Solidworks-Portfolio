# Tawfiq Mahumud Khan — SolidWorks Portfolio

A clean, professional portfolio website for showcasing SolidWorks work to
interviewers. **You do NOT need to write code** — just drag your files into
the right folders and the website updates automatically.

---

## 1. Project structure

```
Solidworks Portfolio/
├── index.html              ← home page (hero, projects, contact)
├── project.html            ← project detail page (one per project)
├── css/
│   └── style.css           ← styles
├── js/
│   ├── projects.js         ← ✏️ edit project titles, summaries, and contact info here
│   └── main.js             ← auto-discovery logic — usually no need to touch
├── projects/               ← ✨ DROP YOUR FILES HERE
│   ├── v6-engine/
│   │   ├── overview.gif          ← animated GIF shown on the home page card
│   │   ├── components/           ← individual component images
│   │   │   ├── 01-crankcase.jpg
│   │   │   ├── 02-piston.png
│   │   │   └── 03-...
│   │   └── files/                ← STL + SolidWorks source files
│   │       ├── v6-engine.stl        (auto-loaded in 3D viewer)
│   │       ├── v6-engine.sldasm     (download)
│   │       └── piston.sldprt        (download)
│   ├── lamborghini/   (same structure)
│   ├── surfacing/     (same structure)
│   ├── weldments/     (same structure)
│   └── molding/       (same structure)
└── README.md
```

---

## 2. How to add your files (no coding needed)

### A. Animated overview GIF (home page card)

1. Open your project folder, e.g. `projects/v6-engine/`
2. Delete the file `overview.gif.placeholder.txt`
3. Drag your GIF into the folder
4. Rename it to **`overview.gif`** (case-sensitive)

Recommended GIF specs:
- 800 × 600 px or larger
- 3–6 second loop, smooth
- Under 10 MB

### B. Component render images (project detail page)

1. Open the project's `components/` folder
2. Drop your PNG / JPG / WEBP files
3. **Name them in display order**, e.g.:
   - `01-crankcase.jpg`
   - `02-piston.png`
   - `03-connecting-rod.jpg`
   - …
4. The website auto-loads any matching name; missing files are skipped.

### C. STL file (3D viewer on detail page)

1. Export your SolidWorks model to `.stl`
2. Drop it into `projects/<id>/files/`
3. It will appear automatically in the embedded 3D viewer.
   Visitors can drag, zoom, and rotate it in their browser.

> Tip: keep the STL **under 25 MB** so it loads quickly.
> If it's huge, simplify the tessellation in SolidWorks first
> (Tools → Export to STL → Quality: Coarse / Medium).

### D. SolidWorks files (downloads on detail page)

1. Save your part / assembly
2. Drag the file(s) into `projects/<id>/files/`:
   - `.sldprt`  for parts
   - `.sldasm`  for assemblies
3. They appear automatically as "Download" buttons on the project page.

---

## 3. How to edit project titles / summaries / contact info

Open **`js/projects.js`** with any text editor (Notepad, VS Code, etc.) and edit:

```js
const PROJECTS = [
  {
    id: 'v6-engine',
    title: 'V6 Engine',
    summary: 'A complete V6 engine assembly modelled in SolidWorks...'
  },
  ...
];
```

and the contact block:

```js
const CONTACT = {
  name:    'Tawfiq Mahumud Khan',
  email:   'your.email@example.com',
  phone:   '+880 1XXX-XXXXXX',
  github:  'https://github.com/your-username',
  linkedin:'https://www.linkedin.com/in/your-username/'
};
```

That's it. Save the file and refresh the browser.

---

## 4. Run / preview locally

### Option A — just open the file
Double-click `index.html`. It works in any browser.

### Option B — recommended (some browsers block local features)
From the folder that contains `index.html`, run **one** of these:

```bash
# Python (any version 3+)
python -m http.server 5500

# Node.js
npx serve .

# VS Code
# Install the "Live Server" extension, right-click index.html → "Open with Live Server"
```

Then visit **http://localhost:5500**

---

## 5. Deploy to GitHub Pages (free hosting)

1. Create a new GitHub repository (e.g. `solidworks-portfolio`).
2. Upload **all the files and folders** as-is (drag-drop via the GitHub web UI works).
3. In the repo: **Settings → Pages**
4. Under *Source*, pick `main` branch, `/ (root)` folder → Save.
5. Wait ~60 seconds. Your portfolio is live at
   `https://your-username.github.io/solidworks-portfolio/`

To update: just edit and re-upload files — no build step.

---

## 6. Tips to impress interviewers

These small touches make a portfolio significantly more convincing:

1. **First GIF matters most.** It's the first thing recruiters see. Use a
   3-second rotating assembly, an exploded view, or a transparency fade-in.
   Avoid a static-looking screenshot.
2. **Lead with your best work.** The first card (V6 Engine) is the highest
   visibility slot.
3. **Render quality.** Export images at **1600 × 1200** minimum with a
   transparent or clean background. Use SolidWorks "PhotoView" with
   proper lighting presets.
4. **File hygiene.** Don't ship STL files you wouldn't show — re-mesh
   curved surfaces with finer tessellation, fix inverted normals, and
   run a quick X-ray check.
5. **CSWA mention** is on the hero — keep it visible.
6. **Real CAD, not imported.** If anyone asks, your project page already
   lists `.sldprt` and `.sldasm` source files — that's a strong signal.
7. **Mobile preview.** Most recruiters browse on phones. Open it on your
   phone before sending.
8. **Add measurements.** Putting one labelled dimension in each GIF or
   component image ("Bore Ø 86 mm", "Stroke 90 mm") shows engineering
   rigor.

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| Image / GIF shows "Drop your file here" | File not at the right path or wrong filename. Names are **case-sensitive**. |
| 3D viewer shows blank box | File too large, or STL has non-manifold geometry. Reduce mesh complexity in SolidWorks before exporting. |
| Browser blocks file when double-clicking | Use the local server option in section 4. |
| GitHub Pages shows old version | Hard-refresh (Ctrl + Shift + R). GitHub Pages caches for ~1 minute. |

---

## 8. Credits

- `<model-viewer>` by Google — for the in-browser 3D STL viewer.
- Inter font by Rasmus Andersson — for the typography.

License: this template is yours to use for your portfolio.
