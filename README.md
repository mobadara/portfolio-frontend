<div align="center">

# Portfolio Frontend

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![React%20Bootstrap](https://img.shields.io/badge/React%20Bootstrap-2-7952b3?logo=bootstrap&logoColor=white)
![Bootstrap%20Icons](https://img.shields.io/badge/Bootstrap%20Icons-latest-563d7c?logo=bootstrap&logoColor=white)
![React%20Icons](https://img.shields.io/badge/React%20Icons-latest-61dafb?logo=react&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

Single-page portfolio built with React + Vite, themed with React-Bootstrap, and deployed to Vercel. Includes animated hero text, project filtering, AI playground placeholder, chatbot toggle, and responsive sections tuned for mobile (Android/iOS).

</div>

## Contents
- Overview
- Features
- Tech stack
- Project structure
- Getting started
- Available scripts
- Styling & theming
- Responsiveness notes
- Deployment (Vercel)
- Troubleshooting

## Overview
- Modern, modular React components assembled in [src/App.jsx](src/App.jsx) with sections under [src/components](src/components). 
- Project cards and filters are driven by data in [src/data/projects.js](src/data/projects.js). 
- Theme switch (light/dark) is wired globally; all sections respect CSS variables for brand colors. 
- Mobile-first layout: hero buttons stack, navbar stays fixed, chatbot and overlays fit within viewport.

## Features
- Animated hero headline cycling through roles with a code-like font. 
- Filterable portfolio grid with category chips and badges. 
- About section with animated stat rings and centered profile image. 
- Services, newsletter CTA, contact form layout, footer socials, and AI playground placeholder. 
- Chatbot trigger + window sized safely for mobile; particles background on hero. 
- Light/dark theme toggle using React-Bootstrap switch and CSS variables.

## Tech stack
- React 18 + Vite for fast dev/build. 
- React-Bootstrap + Bootstrap Icons + React Icons for UI components and glyphs. 
- CSS custom properties and keyframes in [src/App.css](src/App.css) for theming and animations. 
- Deployed on Vercel (zero-config for Vite). 

## Project structure (key files)
- [src/App.jsx](src/App.jsx): Top-level composition of all sections. 
- [src/components](src/components): Modular UI sections (Hero, About, Portfolio, Services, Newsletter, Contact, Footer, Navbar, Chatbot, Particles, AIPlayground, Logo). 
- [src/data/projects.js](src/data/projects.js): Portfolio projects data source. 
- [src/App.css](src/App.css): Global styles, theme variables, animations, responsive tweaks. 
- [src/main.jsx](src/main.jsx): Vite/React entry point. 

## Getting started
1) **Install dependencies**
```bash
npm install
```

2) **Run locally (dev server with HMR)**
```bash
npm run dev
```
Then open the printed localhost URL (usually http://localhost:5173).

3) **Build for production**
```bash
npm run build
```

4) **Preview production build locally**
```bash
npm run preview
```

## Available scripts
- `npm run dev` — start Vite dev server with HMR. 
- `npm run build` — bundle for production. 
- `npm run preview` — serve the production build locally. 

## Styling & theming
- Brand colors are defined as CSS variables in [src/App.css](src/App.css) under `:root` and `[data-bs-theme="dark"]`. 
- Components rely on React-Bootstrap variants plus custom classes (`bg-navy`, `hero-buttons`, `metric-circle-container`, etc.). 
- Animations: hero title slide/fade, metric ring spin, logo pulse, section fade-up. 
- Fonts: Fira Code is used for the rotating hero title; system/Bootstrap stacks elsewhere. 

## Responsiveness notes
- Navbar: fixed top, fluid container to avoid horizontal overflow; menu toggle remains visible on small screens. 
- Hero buttons: flex with wrap; stack vertically on mobile with 1rem gap and full width. 
- About image: centered with constrained width on mobile; metrics wrap. 
- Chatbot FAB/window: pixel-based offsets with `max-width` guards to prevent horizontal scrolling. 
- Global `overflow-x: hidden` on `html, body` and sections to avoid sideways scroll.

## Deployment (Vercel)
- Push to `main` (or your chosen branch) and Vercel auto-builds Vite apps without extra config. 
- Ensure `npm run build` succeeds locally before pushing. 
- For custom domains, set them in your Vercel project; SSL is automatic. 

## Troubleshooting
- **Horizontal scroll on mobile**: confirmed mitigations include `overflow-x: hidden` on `html, body` and constrained chatbot positioning. If you add wide content, wrap it and avoid fixed widths. 
- **Styling not updating**: verify imports of [src/App.css](src/App.css) in [src/App.jsx](src/App.jsx) and restart dev server. 
- **Icons missing**: ensure `bootstrap-icons` and `react-icons` are installed via `npm install` (already in package.json). 
- **Particles/Chatbot not rendering**: these components live in [src/components/ParticlesBackground.jsx](src/components/ParticlesBackground.jsx) and [src/components/Chatbot.jsx](src/components/Chatbot.jsx); confirm exports and JSX usage in [src/App.jsx](src/App.jsx).
