#!/usr/bin/env node
/**
 * Quick Reference - Portfolio Data Updates
 * 
 * Use this file as a template for updating your portfolio content.
 * All data lives in: src/data/portfolioData.js
 */

// ============================================
// UPDATE YOUR PROJECTS
// ============================================

export const updateProjectExample = {
  // Copy this structure to add/update projects
  _id: "proj_001",
  title: "Your Project Title",
  category: "Deep Learning",  // or: Data Science, AI Engineering, Visualization
  description: "One-line summary (shown in card)",
  fullDescription: "Detailed description (optional, for modal/detail page)",
  technologies: ["Python", "PyTorch", "TensorFlow"],  // List of techs used
  image: "https://your-image-url.com/image.jpg",
  
  // Links that float on hover
  links: {
    github: "https://github.com/yourusername/project",
    demo: "https://live-demo.com",  // Optional
    paper: "https://arxiv.org/paper"  // Optional
  },
  
  // Optional metrics to show project impact
  metrics: {
    accuracy: 0.94,
    downloads: 1200,
    stars: 150
  },
  
  // Display order in list
  order: 1,
  
  // Pin to top as featured
  featured: true
};

// ============================================
// UPDATE YOUR SKILLS
// ============================================

export const updateSkillExample = {
  name: "Python",
  level: 95,  // 0-100 (shows as progress bar)
  category: "Programming Languages",  // Groups skills visually
  icon: "python"  // Bootstrap icon name (optional)
};

// Recommended skill categories:
// - Programming Languages
// - Machine Learning
// - Data Science
// - AI & Automation
// - Frontend
// - Backend
// - Cloud & DevOps
// - Databases
// - Core Competencies

// ============================================
// EDIT: src/data/portfolioData.js
// ============================================

/*
1. Open: src/data/portfolioData.js

2. Update the "about" section:
   about: {
     name: "Your Name",
     title: "Your Title",
     summary: "One-line summary",
     bio: "Your bio",
     image: "profile-url"
   }

3. Update projects array with real projects:
   projects: [
     {
       _id: "proj_001",
       title: "Project Name",
       ... (use structure above)
     },
     // Add more projects...
   ]

4. Update skills array:
   skills: [
     { 
       name: "Python", 
       level: 95, 
       category: "Programming Languages" 
     },
     // Add more skills...
   ]

5. Update social links:
   social: [
     { platform: "GitHub", url: "https://github.com/yourname", icon: "github" },
     { platform: "LinkedIn", url: "https://linkedin.com/in/yourname", icon: "linkedin" },
     // etc...
   ]
*/

// ============================================
// CONNECT TO MONGODB BACKEND
// ============================================

/*
Once you have a backend API:

1. Create an environment file (.env):
   VITE_API_BASE=https://your-api.com
   VITE_CHAT_API_BASE=https://your-chat-api.com

2. In your components, use the MongoDB utilities:
   
   import { fetchProjects, fetchSkills } from './utils/mongoUtils';
   import { portfolioData } from './data/portfolioData';
   
   const projects = await fetchProjects(null, portfolioData.projects);
   const skills = await fetchSkills(null, portfolioData.skills);

3. The data will automatically fall back to local data if API fails.

4. For admin updates, use:
   
   import { saveProject, deleteProject } from './utils/mongoUtils';
   
   // Save a project
   await saveProject(projectData, adminToken);
   
   // Delete a project
   await deleteProject(projectId, adminToken);
*/

// ============================================
// PROJECT CATEGORIES (Don't change these)
// ============================================

const VALID_CATEGORIES = [
  "Deep Learning",
  "Data Science",
  "AI Engineering",
  "Visualization"
];

// ============================================
// EXAMPLE: Complete Project
// ============================================

export const completeProjectExample = {
  _id: "proj_ml_api",
  title: "Machine Learning REST API",
  category: "AI Engineering",
  description: "Production-ready FastAPI serving ML models with real-time predictions, authentication, and monitoring.",
  fullDescription: `
Built a scalable REST API using FastAPI to serve trained PyTorch models in production.
Features include:
- Real-time inference
- Model versioning
- Rate limiting & authentication
- Comprehensive logging
- Docker containerization
- Deployed on AWS EC2
`,
  technologies: ["FastAPI", "Python", "PyTorch", "Docker", "PostgreSQL", "AWS"],
  image: "https://placehold.co/600x400/003366/FFF?text=FastAPI+Backend",
  links: {
    github: "https://github.com/yourname/ml-api",
    demo: "https://api-demo.example.com/docs",
    paper: null
  },
  metrics: {
    requests_per_second: 1000,
    uptime: 99.9,
    latency_ms: 150
  },
  order: 1,
  featured: true
};

// ============================================
// BASH COMMANDS
// ============================================

/*
# View current data
cat src/data/portfolioData.js

# Edit with your editor
code src/data/portfolioData.js  # VS Code
nano src/data/portfolioData.js  # Terminal

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy
*/

// ============================================
// TESTING YOUR CHANGES
// ============================================

/*
1. Edit portfolioData.js with your projects
2. Run: npm run dev
3. Check http://localhost:5173
4. Verify:
   - Projects display correctly
   - Links work on hover
   - Skills show correct levels
   - Colors match your brand
5. Test on mobile: DevTools → Toggle device toolbar
6. Check dark mode: Click theme toggle
*/

// ============================================
// COMMON ERRORS & FIXES
// ============================================

/*
ERROR: "Cannot find module portfolioData"
FIX: Make sure file is at: src/data/portfolioData.js

ERROR: Projects not displaying
FIX: Check the _id field is unique
FIX: Verify technologies array has values
FIX: Make sure image URL is valid

ERROR: Links not working
FIX: Ensure links.github and links.demo are full URLs
FIX: Make sure URLs start with https://

ERROR: Skills not showing
FIX: Verify level is between 0-100
FIX: Check category matches other skills
*/

// ============================================
// NEXT: MONGODB BACKEND
// ============================================

/*
When you're ready, build a backend to serve data:

MongoDB Collections Structure:

db.portfolios {
  _id: ObjectId,
  userId: String,
  metadata: {
    lastUpdated: Date,
    version: String
  },
  about: { ... },
  projects: [ ... ],
  skills: [ ... ],
  services: [ ... ],
  social: [ ... ]
}

Backend Routes (FastAPI example):

GET  /api/portfolio       - Fetch entire portfolio
GET  /api/projects        - Fetch all projects
POST /api/projects        - Create project (admin)
PUT  /api/projects/{id}   - Update project (admin)
DELETE /api/projects/{id} - Delete project (admin)

GET  /api/skills          - Fetch skills
GET  /api/analytics       - Get portfolio metrics
*/

export default {
  updateProjectExample,
  updateSkillExample,
  completeProjectExample
};
