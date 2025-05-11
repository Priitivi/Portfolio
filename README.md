# 🌐 Priitivi.com — Developer Portfolio

Welcome to the source code for my personal portfolio website, built with a focus on creative presentation, minimalism, and interactivity. This site is designed to showcase my projects, technical skillset, and personality in a terminal-inspired web experience.

> 🔗 Live at: [https://priitivi.com](https://priitivi.com)

---

## ✨ Features

- 🖥️ **Terminal-style landing experience**
  - Simulated command typing (`whoami`, `cat mission.txt`, etc.)
  - Interactive buttons for navigation and downloads
- 🧑‍💻 **About Me Section**
  - Animated timeline of life events and education
  - Skills grid with SVG icons
- 🧱 **Project Gallery**
  - Clickable project cards with modal overlays
  - Details, tech stack, GitHub links, and images
- 📄 **Downloadable CV**
  - Users can "download cv.pdf" via typed command
- 📱 **Responsive Design**
  - Fully responsive across desktop, tablet, and mobile

---

## 🛠 Tech Stack

| Frontend        | Libraries / Tools     |
|-----------------|------------------------|
| React + Vite    | Tailwind CSS           |
| Framer Motion   | React Icons            |
| JavaScript (ES6)| AnimatePresence (modals) |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/priitivi/portfolio.git
cd portfolio
```

### 2. Install dependencies
```bash
npm install
```
### 3. Run locally
```bash
npm run dev
```
### 4. Build for production
```bash
npm run build
```

---

### 🌐 Deployment
This site is deployed via Netlify, with auto-deploys from the main branch and build output to dist.

Netlify Settings:

Build Command: npm run build

Publish Directory: dist

---

### 📁 File Structure

```
src/
│
├── components/
│   ├── Hero.jsx          # Terminal-style intro section
│   ├── About.jsx         # Timeline, education, skills
│   ├── Projects.jsx      # Cards, modals, image gallery
│   └── Contact.jsx       # Contact section (optional)
│
├── assets/               # Imported SVGs and PNGs
├── App.jsx               # Page layout
├── main.jsx              # Entry point
└── index.css             # Tailwind + custom styles
```

---

### 📄 License
This project is open-sourced for learning and inspiration.
Feel free to fork, but please credit if reusing major design elements.

🤝 Connect With Me
📫 Email: priitivi@gmail.com

🌍 Website: https://priitivi.com

🧑‍💻 GitHub: https://github.com/priitivi
