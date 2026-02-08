# Admin Chat Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    App Component                         │  │
│  │  (Main application entry point)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          │ Routes                               │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Admin Dashboard (Page)                        │  │
│  │  - Session list management                              │  │
│  │  - Session selection logic                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          │ sessionId                            │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          AdminChatPage Component                         │  │
│  │  - Renders AdminChat with selected session              │  │
│  │  - Manages UI layout                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          │ props                                │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           AdminChat Component (CORE)                     │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────┐            │  │
│  │  │  1. Fetch Session Data (HTTP)          │            │  │
│  │  │     GET /admin/chat_sessions/{id}      │            │  │
│  │  └─────────────────────────────────────────┘            │  │
│  │                    │                                     │  │
│  │                    ▼                                     │  │
│  │  ┌─────────────────────────────────────────┐            │  │
│  │  │  2. Load Message History                │            │  │
│  │  │     - Display previous messages         │            │  │
│  │  │     - Render chat UI                    │            │  │
│  │  └─────────────────────────────────────────┘            │  │
│  │                    │                                     │  │
│  │                    ▼                                     │  │
│  │  ┌─────────────────────────────────────────┐            │  │
│  │  │  3. Connect WebSocket                   │            │  │
│  │  │     ws://localhost:8000/ws/admin/{id}  │            │  │
│  │  └─────────────────────────────────────────┘            │  │
│  │                    │                                     │  │
│  │           ┌────────┴────────┐                           │  │
│  │           ▼                 ▼                           │  │
│  │   ┌─────────────────┐  ┌──────────────────┐           │  │
│  │   │ Send Message    │  │ Receive Message  │           │  │
│  │   │ via WebSocket   │  │ via WebSocket    │           │  │
│  │   └─────────────────┘  └──────────────────┘           │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────┐            │  │
│  │  │  4. Display Chat UI                      │            │  │
│  │  │     - Input field                       │            │  │
│  │  │     - Message bubbles                   │            │  │
│  │  │     - Send button                       │            │  │
│  │  │     - Status indicator                  │            │  │
│  │  └─────────────────────────────────────────┘            │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                                          │
         │ HTTP                                     │ WebSocket
         │                                          │
         ▼                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Python)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        API Endpoints                                     │  │
│  │                                                          │  │
│  │  GET /admin/chat_sessions/{sessionId}                   │  │
│  │  └─ Returns: Session data + message history             │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        WebSocket Server                                  │  │
│  │                                                          │  │
│  │  ws://localhost:8000/ws/admin/{sessionId}              │  │
│  │  ├─ Authenticate admin                                 │  │
│  │  ├─ Receive messages from admin                        │  │
│  │  └─ Send messages to admin                             │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Chat Session Store                                │  │
│  │        (Database)                                        │  │
│  │                                                          │  │
│  │  Sessions:                                              │  │
│  │  ├─ session_id                                          │  │
│  │  ├─ user_id                                             │  │
│  │  ├─ admin_id                                            │  │
│  │  ├─ messages []                                         │  │
│  │  └─ status (active/closed)                             │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Sequence

### Initial Setup (When Admin Opens Chat)

```
1. Admin navigates to /admin/dashboard
   │
   ├─→ AdminChatPage loads
   │   │
   │   ├─→ Displays list of active sessions
   │   │
   │   └─→ Admin selects a session
   │       session_1770560465255_fd0jqhg7r
   │
2. AdminChat component receives sessionId
   │
   ├─→ useEffect() runs
   │   │
   │   └─→ fetchSessionData(sessionId)
   │       │
   │       ├─→ HTTP GET /admin/chat_sessions/{sessionId}
   │       │
   │       └─→ Backend returns:
   │           {
   │             "status": "ok",
   │             "messages": [...],
   │             "admin_websocket": {
   │               "url": "ws://...",
   │               "token_required": true
   │             }
   │           }
   │
3. AdminChat processes response
   │
   ├─→ Convert messages to display format
   ├─→ Set initial state
   └─→ initiate WebSocket connection
   
4. connectWebSocket()
   │
   ├─→ Create WebSocket connection
   │   ws://localhost:8000/ws/admin/{sessionId}
   │
   ├─→ WebSocket.onopen
   │   │
   │   ├─→ Send authentication
   │   │   { "type": "auth", "token": "..." }
   │   │
   │   ├─→ Set connection status to "Connected"
   │   │
   │   ├─→ Set loading to false
   │   │
   │   └─→ UI is now ready for messaging
   │
   └─→ WebSocket ready for receiving messages
```

---

### Message Exchange (Admin and User Chatting)

```
SCENARIO: Admin sends message "How can I help?"

1. Admin types in input field
   │
   ├─→ Text: "How can I help?"
   │
   └─→ Presses Send or Ctrl+Enter
   
2. handleSendMessage() triggered
   │
   ├─→ Create user message object
   │   {
   │     id: Date.now(),
   │     role: 'admin',
   │     content: 'How can I help?',
   │     timestamp: now
   │   }
   │
   ├─→ Add to messages state (UI updates immediately)
   │
   ├─→ Send via WebSocket
   │   ws.send({
   │     "type": "message",
   │     "content": "How can I help?",
   │     "role": "admin"
   │   })
   │
   ├─→ Clear input field
   │
   └─→ Set sending state to show spinner
   

3. Backend receives message
   │
   ├─→ Stores in database
   │
   ├─→ Notifies user (if connected)
   │
   └─→ Returns confirmation


SCENARIO: User sends reply "I want to know about your services"

1. User sends message via their chat
   │
   ├─→ Backend receives from user
   │
   └─→ WebSocket broadcasts to admin


2. AdminChat receives message
   │
   ├─→ WebSocket.onmessage event
   │   {
   │     "type": "message",
   │     "role": "user",
   │     "content": "I want to know about your services"
   │   }
   │
   ├─→ Create message object
   │   {
   │     id: Date.now(),
   │     role: 'user',
   │     content: '...',
   │     timestamp: now,
   │     sender: 'user'
   │   }
   │
   ├─→ Add to messages state
   │
   └─→ Auto-scroll to bottom
   
3. Message appears in chat bubble (left side, white)
```

---

## 📊 Component State Management

### AdminChat Component State

```javascript
// Message display
messages: [
  {
    id: 1708000000000,
    role: "user",
    content: "What are your skills?",
    timestamp: "2026-02-08T15:21:45.393000",
    sender: "user"
  },
  {
    id: 1708000005000,
    role: "assistant",
    content: "I'm proficient in AI, Full-stack...",
    timestamp: "2026-02-08T15:21:46.894000",
    sender: "assistant"
  }
]

// User input
input: ""  // Current text in input field

// UI states
isLoading: false        // Loading session data
isSending: false        // Sending current message
isConnected: false      // WebSocket connection status
error: null             // Error message to display

// Session info
sessionInfo: {
  status: "ok",
  session_id: "...",
  human_mode: true,
  messages: [],
  admin_websocket: {}
}
```

### AdminChatPage Component State

```javascript
// Session management
activeSession: "session_1770560465255_fd0jqhg7r"  // Currently selected
sessions: [
  {
    id: "session_...",
    userId: "user_123",
    userName: "John Doe",
    status: "active",
    lastMessage: "I want to chat with him directly",
    messageCount: 4,
    humanMode: true
  }
]
```

---

## 🔌 WebSocket Message Protocol

### Messages Sent by Admin

```javascript
// Authentication (first message)
{
  "type": "auth",
  "token": "admin_token_here"
}

// Regular message
{
  "type": "message",
  "content": "Hello, how can I help?",
  "role": "admin"
}
```

### Messages Received from Backend

```javascript
// User message
{
  "type": "message",
  "role": "user",
  "content": "I need help with something",
  "timestamp": "2026-02-08T15:30:00.000000"
}

// System message
{
  "type": "system",
  "content": "User has left the chat",
  "action": "user_disconnected"
}

// Error message
{
  "type": "error",
  "error": "Authentication failed",
  "code": "AUTH_FAILED"
}
```

---

## 🎯 Request/Response Examples

### API Request: Get Session Data

```http
GET http://localhost:8000/admin/chat_sessions/session_1770560465255_fd0jqhg7r

Response (200 OK):
{
  "status": "ok",
  "session_id": "session_1770560465255_fd0jqhg7r",
  "human_mode": true,
  "messages": [
    {
      "role": "user",
      "content": "What are Muyiwa's main skills?",
      "timestamp": "2026-02-08T15:21:45.393000"
    },
    {
      "role": "assistant",
      "content": "Muyiwa is proficient in AI/ML, Full-stack...",
      "timestamp": "2026-02-08T15:21:46.894000"
    },
    {
      "role": "user",
      "content": "I want to chat with him directly",
      "timestamp": "2026-02-08T15:22:02.940000"
    },
    {
      "role": "assistant",
      "content": "I'm connecting you with Muyiwa now...",
      "timestamp": "2026-02-08T15:22:12.527000"
    }
  ],
  "admin_websocket": {
    "url": "ws://localhost:8000/ws/admin/session_1770560465255_fd0jqhg7r",
    "token_required": true,
    "token_env": "ADMIN_AUTH_TOKEN"
  }
}
```

---

## 🌳 Component Hierarchy

```
<App>
  ├─ Routes
  │   └─ Route: /admin/dashboard
  │       └─ <AdminDashboard>
  │           └─ <AdminChatPage>
  │               ├─ Sidebar: Session List
  │               │   └─ [Session Items]
  │               └─ Main Area: Chat
  │                   └─ <AdminChat>
  │                       ├─ Header
  │                       ├─ Messages Area
  │                       │   ├─ [Message Bubbles]
  │                       │   └─ Auto-scroll ref
  │                       └─ Input Area
  │                           ├─ Input Field
  │                           └─ Send Button
  │
  └─ Other Routes/Components
```

---

## 📈 Loading and Error States

```
Initial State
    │
    ├─→ Loading = true
    │   └─→ Show spinner
    │
    └─→ Fetch data

Data Received
    │
    ├─→ On Success
    │   │
    │   ├─→ Loading = false
    │   ├─→ Parse messages
    │   └─→ Connect WebSocket
    │
    └─→ On Error
        │
        ├─→ Loading = false
        ├─→ Error = error message
        └─→ Show alert


WebSocket Connection
    │
    ├─→ Connecting
    │   └─→ Show spinner
    │
    ├─→ Connected
    │   │
    │   ├─→ Connected = true
    │   └─→ Ready for messaging
    │
    └─→ Failed
        │
        ├─→ Connected = false
        ├─→ Show error
        └─→ Disable input
```

---

## 🔐 Authentication Flow

```
1. Admin loads AdminChat component
   │
2. Fetch session data
   │
   ├─→ Response includes admin_websocket config
   │   {
   │     "url": "ws://...",
   │     "token_required": true,
   │     "token_env": "ADMIN_AUTH_TOKEN"
   │   }
   │
3. Read auth token from environment
   │
   ├─→ const token = process.env.ADMIN_AUTH_TOKEN
   │
4. Connect WebSocket
   │
5. Send auth message
   │
   ├─→ ws.send({
   │     "type": "auth",
   │     "token": token
   │   })
   │
6. Backend validates token
   │
   ├─→ Valid: Allow communication
   │   └─→ Admin can send/receive messages
   │
   └─→ Invalid: Close connection
       └─→ Show error to admin
```

---

## 📱 Responsive Breakpoints

```
Desktop (md and above)
├─ Layout: 2 columns
├─ Sidebar: 25% width (Col md={3})
├─ Chat: 75% width (Col md={9})
└─ Full height

Tablet (sm to md)
├─ Layout: Adjusted spacing
├─ Responsive container
└─ Stacked on smaller screens

Mobile (xs)
├─ Layout: Single column
├─ Sidebar on top
├─ Chat below
└─ Full width
```

---

## 🎨 CSS Cascade

```
App.css (Global)
  ├─ CSS variables
  │   ├─ --navy-blue
  │   ├─ --body-bg
  │   ├─ --section-bg
  │   └─ --text-main
  │
  └─ Bootstrap overrides

AdminChatPage.css (Component)
  ├─ .admin-chat-container
  ├─ .admin-chat-page
  ├─ .list-group-item
  ├─ Dark mode selectors
  │   └─ [data-bs-theme="dark"]
  │
  └─ Responsive media queries
```

---

## ⚡ Performance Considerations

```
Rendering
  ├─ Messages list: O(n) where n = message count
  ├─ Auto-scroll: Only triggers on message addition
  └─ Input field: Optimized onChange handler

Memory
  ├─ Message array: Grows with conversation
  ├─ WebSocket: Single connection per session
  └─ Cleanup: useEffect return on unmount

Network
  ├─ Initial fetch: One HTTP request
  ├─ Messages: Streamed via WebSocket
  └─ Reconnection: Exponential backoff
```

---

This document provides a visual guide to understanding the Admin Chat implementation architecture, data flow, and how components interact with each other and the backend.
