<div align="center">

# Portfolio Frontend

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![React%20Bootstrap](https://img.shields.io/badge/React%20Bootstrap-2-7952b3?logo=bootstrap&logoColor=white)
![GitHub%20Calendar](https://img.shields.io/badge/GitHub%20Calendar-5-333333?logo=github&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

Modern, fully-responsive portfolio built with **React 19** + **Vite**, featuring dynamic theme switching, animated components, GitHub contribution calendar, interactive skill progress bars, and a floating AI assistant chatbot. Deployed to Vercel with production-grade code standards.

</div>

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Styling & Theming](#styling--theming)
- [Component Details](#component-details)
- [Deployment](#deployment)
- [Code Standards](#code-standards)
- [Troubleshooting](#troubleshooting)

## Features

### Core Sections
- **Hero Section** – Animated title cycling (Data Scientist → AI Engineer → Fullstack Developer) with particles background and CTA buttons
- **About Section** – Profile image, bio, animated stat rings, Core Competencies list, and **interactive skill progress bars** organized in a 2-column grid
- **GitHub Activity** – Live contribution calendar powered by [react-github-calendar](https://www.npmjs.com/package/react-github-calendar) with theme-aware styling
- **Portfolio** – Filterable project grid with category chips, tech badges, and GitHub/Live demo links
- **Services** – Three service offerings: AI Engineering, Data Science & Analytics, NLP & Computer Vision
- **AI Playground** – Live sentiment analysis demo (client-side simulation; ready for FastAPI backend integration)
- **Newsletter CTA** – Substack integration with branded styling
- **Contact Form** – Fully laid-out form with Bootstrap styling (backend ready)
- **Footer** – Social links (LinkedIn, Twitter, GitHub, Medium, Substack)

### Interactive Features
- **Light/Dark Theme Toggle** – Smooth transitions with CSS custom properties
- **Floating Chatbot** – AI Assistant FAB with message history (frontend demo; ready for FastAPI integration)
- **Responsive Navigation** – Fixed navbar with menu toggle and theme switch
- **Smooth Animations** – Hero fade-ups, metric ring spins, logo pulse, title slide effects

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend Framework** | React 19 + Vite 7 |
| **UI Library** | React-Bootstrap 2 + Bootstrap 5 |
| **Icons** | Bootstrap Icons + React Icons |
| **Data Visualization** | Progress bars, animated SVG rings |
| **Integrations** | GitHub Calendar (react-github-calendar 5) |
| **Particles** | tsparticles (slim) + react-particles |
| **Styling** | CSS3 variables, animations, responsive grid |
| **Deployment** | Vercel (zero-config Vite) |
| **Linting** | ESLint 9 with React best practices |

## Project Structure

```
src/
├── App.jsx                          # Root component + theme state management
├── App.css                          # Global styles, theme variables, animations
├── main.jsx                         # Vite entry point
├── index.css                        # Base styles
├── components/
│   ├── NavigationBar.jsx            # Fixed navbar with theme toggle
│   ├── HeroSection.jsx              # Hero with particles & rotating title
│   ├── AboutSection.jsx             # Bio, metrics, skills, GitHub calendar
│   ├── PortfolioSection.jsx         # Filterable project grid
│   ├── ServicesSection.jsx          # Service cards
│   ├── AIPlayground.jsx             # Sentiment analysis demo
│   ├── NewsletterSection.jsx        # Substack CTA
│   ├── ContactSection.jsx           # Contact form layout
│   ├── FooterSection.jsx            # Social links
│   ├── Chatbot.jsx                  # Floating AI assistant
│   ├── ParticlesBackground.jsx      # Particle system
│   ├── GithubActivity.jsx           # GitHub contribution calendar
│   └── Logo.jsx                     # SVG brand logo with animations
├── data/
│   ├── projects.js                  # Portfolio projects (title, tech, links)
│   └── skills.js                    # Technical skills with proficiency levels
└── assets/                          # Images, icons (if any)
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone and navigate
git clone <repository-url>
cd portfolio-frontend

# Install dependencies
npm install
```

### Running Locally

```bash
# Start dev server with HMR
npm run dev
```
Open `http://localhost:5173` in your browser.

### Building for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

## Available Scripts

| Command | Purpose |
|---------|----------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Bundle for production (output: `dist/`) |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint on all `.js` and `.jsx` files |

## Styling & Theming

### Theme Architecture
- **CSS Custom Properties**: Brand colors defined in `:root` (light mode) and `[data-bs-theme="dark"]` (dark mode)
- **Variables**:
  - `--navy-blue`: Primary brand color (Navy in light, slightly lighter Navy in dark)
  - `--body-bg`: Page background
  - `--section-bg`: Card/section backgrounds
  - `--text-main`: Primary text color
- **Theme Toggle**: Controlled by React state → sets `data-bs-theme` attribute on `<html>`

### Key Custom Classes
- `.bg-navy`, `.text-navy` – Brand color utilities
- `.hero-section` – Hero gradient background
- `.metric-circle-container` – SVG metric ring animation
- `.chatbot-fab`, `.chatbot-window` – Floating chatbot UI
- `.logo-path`, `.logo-node` – Logo animations
- `[data-bs-theme="dark"]` – All dark mode overrides

### Animations
- **fadeUp**: Staggered upward fade for hero content
- **slideFade**: Smooth title transitions
- **spinMetric**: Rotating progress ring (3s loop)
- **drawLine**: Logo path draw-on effect
- **nodePulse**: Logo node glow effect
- **pulseGold**: Subtle node scaling

## Component Details

### AboutSection
- **Layout**: 2-column grid (md-5 | md-7)
- **Left Column**:
  - Hero headline and bio
  - Profile image with background shape
  - 3 animated metric rings (Years Exp, Projects, Certifications)
  - Core Competencies bullet list
- **Right Column**:
  - Technical Skills header
  - **Skills Grid**: 2-column sub-grid with categories
    - Machine Learning & Data Science
    - Frontend Development
    - Backend & APIs
    - Cloud & MLOps
    - AI & Automation
  - **Each Skill**: Name + proficiency level (0-100%) displayed as progress bar
  - Download CV button
  - **GitHub Activity Calendar**: Responsive GitHub contribution heatmap

### GithubActivity
- Fetches live GitHub contribution data for username `mobadara`
- Theme-aware styling (light/dark mode support)
- Responsive container with scroll on small screens

### Skills Data (`src/data/skills.js`)
```javascript
export const skillsData = {
  'Machine Learning & Data Science': [
    { name: 'Python', level: 95 },
    // ... more skills
  ],
  // ... more categories
};
```
**Customization**: Edit proficiency levels (0-100) directly in this file; no component changes needed.

## Deployment

### To Vercel
1. Push your code to GitHub
2. Connect repository in Vercel dashboard
3. Vercel auto-detects Vite and builds with `npm run build`
4. Custom domain: Set in project settings; SSL is automatic
5. Env variables: Add in Vercel UI if needed (FastAPI endpoint, etc.)

### Environment Variables (Optional)
Create `.env.local` for development:
```bash
VITE_API_BASE_URL=http://localhost:8000  # FastAPI backend URL
```
Access in React via `import.meta.env.VITE_API_BASE_URL`

## Code Standards

### ESLint Configuration
- **Rules**: Enforces React best practices, hooks rules, and refresh rules
- **Parser**: Modern ES2020+ syntax with JSX support
- **No Unused Vars**: Warns on unused variables (except exports starting with uppercase)

### Best Practices Implemented
1. **Component Structure**:
   - Functional components with hooks
   - Props destructuring at signature
   - Clear prop types via JSDoc comments (where complex)

2. **State Management**:
   - `useState` for component-level state (theme, filters, chat messages)
   - Lifted state to App.jsx for global theme
   - No external state library (Zustand/Redux) unless needed

3. **Performance**:
   - `useMemo` for filtered project lists
   - `useCallback` for particle initialization
   - `useRef` for DOM refs (chatbot scroll)
   - Lazy animations with CSS `animation-delay`

4. **Accessibility**:
   - Semantic HTML (`<section>`, `<nav>`, `<footer>`)
   - ARIA labels on interactive elements
   - Progress bars with `role="progressbar"` and ARIA attributes
   - Alt text on all images

5. **Responsive Design**:
   - Mobile-first CSS with `@media` breakpoints
   - Bootstrap grid (Col, Row) for layout
   - Overflow guards: `overflow-x: hidden` on html/body/sections
   - Safe chatbot positioning with max-width

6. **Code Organization**:
   - Modular components (one per file)
   - Data separated from UI (projects.js, skills.js)
   - Centralized theme logic
   - Clear naming: `AboutSection`, `HeroSection`, etc.

7. **Error Handling**:
   - Default props (`projects = []`)
   - Graceful fallbacks (demo data if API fails)
   - Console errors caught early with ESLint

## Troubleshooting

### Horizontal Scroll on Mobile
- **Root Cause**: Wide content or chatbot positioning
- **Fix**: `overflow-x: hidden` on `html, body` + `max-width: calc(100vw - 30px)` on chatbot
- **Check**: Inspect in DevTools mobile mode; look for elements exceeding viewport

### Dark Mode Styles Not Applying
- **Check**: Is `data-bs-theme="dark"` set on `<html>`? (Verify in browser DevTools)
- **Fix**: ESLint + `[data-bs-theme="dark"]` selectors in [src/App.css](src/App.css)
- **Restart**: Dev server after CSS changes

### GitHub Calendar Not Rendering
- **Dependency**: Ensure `react-github-calendar` is installed (`npm install react-github-calendar`)
- **Import**: Use named import: `import { GitHubCalendar } from 'react-github-calendar'`
- **Props**: Pass `username`, `colorScheme`, `blockSize`, etc.

### Missing Icons
- **Bootstrap Icons**: `npm install bootstrap-icons`
- **React Icons**: `npm install react-icons`
- **Usage**: `import { FaGithub } from 'react-icons/fa'` or `<i className="bi bi-github"></i>`

### Build Fails
- **Check Node Version**: `node -v` (should be 18+)
- **Clear Cache**: `rm -rf node_modules && npm install`
- **ESLint Errors**: Run `npm run lint` to identify issues

## Future Enhancements
- Connect FastAPI backend for Chatbot & AI Playground
- Add contact form submission to email service
- GitHub calendar real-time sync
- Blog section with Medium integration
- Analytics (Vercel Web Analytics or Google Analytics)
- Internationalization (i18n)

---

**Built with ❤️ by Muyiwa J. Obadara**

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
