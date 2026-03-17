# Portfolio Data Structure & MongoDB Integration

## Overview

This portfolio uses a **MongoDB-compatible data structure** that makes it easy to populate content from a database. All data is centralized in `portfolioData.js` and can be fetched dynamically from a backend API.

## File Structure

```
src/
├── data/
│   ├── portfolioData.js      # Central MongoDB-compatible data source
│   ├── projects.js           # Legacy file (now imports from portfolioData)
│   └── skills.js             # Legacy file (now imports from portfolioData)
├── utils/
│   ├── mongoUtils.js         # API utilities for MongoDB operations
│   └── adminChatUtils.js    # Admin chat functionality
└── components/
    ├── PortfolioSection.jsx  # Projects display (uses floating links)
    └── Chatbot.jsx           # Professional chat UI
```

## Data Schema

### MongoDB Collections

#### `portfolios` Collection

```javascript
{
  _id: ObjectId,
  metadata: {
    lastUpdated: ISODate,
    version: String
  },
  about: {
    name: String,
    title: String,
    summary: String,
    bio: String,
    image: String
  },
  projects: Array,
  skills: Array,
  services: Array,
  social: Array
}
```

#### `projects` Subcollection/Array

```javascript
{
  _id: ObjectId,
  title: String,
  category: String,
  description: String,
  fullDescription: String,
  technologies: Array<String>,
  image: String,
  links: {
    github: String,
    demo: String,
    paper: String
  },
  metrics: Object,
  order: Number,
  featured: Boolean
}
```

#### Usage in MongoDB

```mongodb
// Insert a project
db.portfolios.updateOne(
  { _id: portfolioId },
  { 
    $push: { 
      projects: { 
        title: "My Project",
        category: "Deep Learning",
        // ... rest of fields
      }
    }
  }
)

// Update a project
db.portfolios.updateOne(
  { "projects._id": projectId },
  { $set: { "projects.$": updatedProject } }
)

// Delete a project
db.portfolios.updateOne(
  { _id: portfolioId },
  { $pull: { projects: { _id: projectId } } }
)
```

## Using the Data

### Local Data (Current)

```javascript
import { portfolioData } from './data/portfolioData';

// Use directly
console.log(portfolioData.projects);
console.log(portfolioData.skills);
```

### From MongoDB API (When Ready)

```javascript
import { fetchProjects, fetchSkills } from './utils/mongoUtils';
import { portfolioData } from './data/portfolioData';

// Fetch with fallback
const projects = await fetchProjects(null, portfolioData.projects);
const skills = await fetchSkills(null, portfolioData.skills);
```

## Component Examples

### PortfolioSection Component

Now displays projects with **floating overlay links** on hover:

```jsx
<PortfolioSection projects={projects} />
```

**Features:**
- Category filtering
- Floating GitHub & Live Demo links on image hover
- Responsive grid layout (3 columns on desktop, 2 on tablet, 1 on mobile)
- Technology badges
- Professional card styling

### Chatbot Component

Professional, minimal chat interface:

```jsx
<Chatbot />
```

**Features:**
- Clean, enterprise design
- Status indicator
- Auto-scroll messages
- Suggested questions
- Responsive on mobile
- No unnecessary animations

## Customization

### Update Skills

Edit `src/data/portfolioData.js`:

```javascript
skills: [
  { 
    name: "Your Skill", 
    level: 85, 
    category: "Your Category",
    icon: "icon-name" 
  },
  // ...
]
```

### Update Projects

Edit `src/data/portfolioData.js`:

```javascript
projects: [
  {
    _id: "proj_001",
    title: "My Project",
    category: "Deep Learning",
    description: "Short description",
    fullDescription: "Long description",
    technologies: ["Python", "PyTorch"],
    image: "https://...",
    links: {
      github: "https://github.com/...",
      demo: "https://demo.com",
      paper: null
    },
    metrics: { accuracy: 0.95 },
    order: 1,
    featured: true
  }
]
```

## Environment Variables

Add to `.env`:

```
VITE_API_BASE=https://your-api.com
VITE_CHAT_API_BASE=https://your-chat-api.com
```

## MongoDB Backend Setup

### Node.js + Express Example

```javascript
// Backend route to fetch portfolio
app.get('/api/portfolio', async (req, res) => {
  const portfolio = await db.collection('portfolios')
    .findOne({ userId: req.user._id });
  res.json(portfolio);
});

// Fetch projects only
app.get('/api/projects', async (req, res) => {
  const portfolio = await db.collection('portfolios')
    .findOne({ userId: req.user._id });
  res.json(portfolio.projects);
});

// Create/update project
app.post('/api/projects', async (req, res) => {
  const { _id, ...projectData } = req.body;
  const result = await db.collection('portfolios')
    .updateOne(
      { userId: req.user._id },
      { $set: { "projects.$[elem]": projectData } },
      { arrayFilters: [{ "elem._id": _id }] }
    );
  res.json(result);
});
```

### Python + FastAPI Example

```python
from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from bson import ObjectId

app = FastAPI()
client = MongoClient("mongodb+srv://...")
db = client["portfolio"]

@app.get("/api/projects")
async def get_projects(category: str = None):
    query = {} if not category else {"projects.category": category}
    portfolio = db.portfolios.find_one(query)
    return portfolio.get("projects", [])

@app.post("/api/projects")
async def create_project(project: dict, token: str):
    # Verify token
    portfolio = db.portfolios.find_one_and_update(
        {"_id": ObjectId(portfolio_id)},
        {"$push": {"projects": project}},
        return_document=True
    )
    return portfolio
```

## Features

✅ **Data-Driven**: Single source of truth  
✅ **MongoDB Compatible**: Ready for database integration  
✅ **Backward Compatible**: Works with local data  
✅ **API Ready**: Utilities for fetching from backend  
✅ **Professional Design**: Senior developer aesthetic  
✅ **Responsive**: Mobile-first approach  
✅ **Accessible**: Semantic HTML & ARIA labels  

## Next Steps

1. **Connect to MongoDB**: Replace local data with API calls
2. **Admin Dashboard**: Use existing `/admin` routes to manage content
3. **Real-time Updates**: Add WebSocket support for live data changes
4. **Caching**: Implement client-side caching strategy
5. **Validation**: Add schema validation for data submissions

---

For questions or updates, refer to the component documentation or contact the developer.
