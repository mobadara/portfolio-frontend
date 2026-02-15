# Portfolio Frontend Routes Documentation

This document provides a comprehensive overview of all routes in the Muyiwa Obadara Portfolio Frontend application.

## Table of Contents
- [Public Routes](#public-routes)
- [Admin Routes](#admin-routes)
- [API Integration](#api-integration)

---

## Public Routes

### Home Page
**Route:** `/`  
**Component:** Home Content (Multiple Sections)  
**Description:** The main portfolio landing page displaying all sections.

**Sections Included:**
- Navigation Bar
- Hero Section
- About Section
- Skills Section
- Portfolio Section
- Services Section
- AI Playground
- Blog Section
- Contact Section
- Footer
- Chatbot (Floating)

**Access:** Public

---

## Admin Routes

### Admin Login
**Route:** `/admin`  
**Component:** `AdminLogin`  
**File:** `src/pages/AdminLogin.jsx`  
**Description:** Secure authentication page for admin and PA access to the portfolio management system.

**Features:**
- Username/Password authentication
- Password visibility toggle
- Form validation
- Error handling with user feedback
- Responsive design matching portfolio aesthetic
- Protected by secure authentication
- Back to portfolio link

**API Endpoint:** `POST /admin/login`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "role": "string"
  }
}
```

**Access:** Public (Login page)  
**Redirects to:** `/admin/dashboard` on successful authentication

---

### Admin Dashboard
**Route:** `/admin/dashboard`  
**Component:** `AdminDashboard`  
**File:** `src/pages/AdminDashboard.jsx`  
**Description:** Main dashboard for portfolio management and chat administration.

**Features:**
- Chat session monitoring and management
- Real-time message viewing
- Human mode activation/deactivation
- Session statistics
- Admin response interface

**Access:** Protected (Requires authentication token)  
**Token Storage:** `localStorage.adminToken`

---

### 404 Not Found
**Route:** `*` (Catch-all)  
**Component:** `NotFoundPage`  
**File:** `src/pages/NotFoundPage.jsx`  
**Description:** Displayed when a user navigates to a non-existent route.

**Features:**
- User-friendly error message
- Navigation back to home
- Consistent branding

**Access:** Public

---

## API Integration

### Base URL
**Environment Variable:** `VITE_CHAT_API_BASE`  
**Default:** `https://portfolio-backend-tjq3.onrender.com`

### Admin Endpoints

#### 1. Admin Login
**Endpoint:** `POST /admin/login`  
**Description:** Authenticates admin user and returns JWT token  
**Used in:** `AdminLogin` component

**Headers:**
```
Content-Type: application/json
```

**Success Response (200):**
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "username": "admin_username",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

---

### Chat Endpoints

#### 1. WebSocket Connection
**Endpoint:** `WS /chat/{sessionId}`  
**Description:** Real-time bidirectional communication for chatbot  
**Used in:** `Chatbot` component

**Connection URL Format:**
```
ws://your-backend-url/chat/{sessionId}
```

**Message Types:**
- `request_human` - User requests human support
- `human_mode_activated` - Server confirms human mode
- `message` - Regular chat message
- `voice_message` - Voice recording message (human mode only)

#### 2. Request Human Support
**Endpoint:** `POST /chat/{sessionId}/request-human`  
**Description:** HTTP fallback to request human mode  
**Used in:** `Chatbot` component

**Success Response:**
```json
{
  "message": "You've been connected to a human! Muyiwa will respond shortly."
}
```

---

## Protected Route Implementation

### Authentication Check
Protected routes should verify the presence of a valid token:

```javascript
const token = localStorage.getItem('adminToken');
if (!token) {
  navigate('/admin');
}
```

### Token Storage
- **Admin Token:** `localStorage.adminToken`
- **Admin User:** `localStorage.adminUser` (JSON stringified)
- **Chat Session:** `localStorage.chatSessionId`

---

## Navigation Flow

```
┌─────────────┐
│   / (Home)  │
└─────────────┘
      │
      ├─────────────────────┐
      │                     │
      ▼                     ▼
┌──────────┐         ┌─────────────┐
│ /admin   │────────▶│   /admin/   │
│ (Login)  │ Success │  dashboard  │
└──────────┘         └─────────────┘
      │
      │ Invalid Route
      ▼
┌──────────┐
│   404    │
└──────────┘
```

---

## Development Notes

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_CHAT_API_BASE=http://localhost:8000
```

### Local Development URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000` (or your FastAPI port)

### Production URLs
- Frontend: Deployed on Vercel
- Backend: `https://portfolio-backend-tjq3.onrender.com`

---

## Future Routes (Planned)

- `/admin/analytics` - Portfolio analytics dashboard
- `/admin/content` - Content management system
- `/admin/settings` - Admin settings and preferences
- `/admin/messages` - Message history and management

---

## Security Considerations

1. **Token Expiration:** Implement token refresh mechanism
2. **Route Guards:** Add protected route wrapper component
3. **HTTPS Only:** Ensure all production traffic uses HTTPS
4. **CORS:** Backend should properly configure CORS for frontend domain
5. **Input Validation:** All forms validate input before submission

---

**Last Updated:** February 15, 2026  
**Maintained By:** Muyiwa Obadara  
**Version:** 1.0.0
