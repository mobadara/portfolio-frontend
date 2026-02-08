# Admin Chat UI - Implementation Guide

## Overview

This implementation provides a complete frontend chat interface for admins when the bot transfers control to human support. It includes real-time WebSocket communication, session management, and a professional UI that matches your portfolio's design system.

## Files Created

### 1. **AdminChat.jsx** (`src/components/AdminChat.jsx`)
The core component that handles admin-to-user chat functionality.

**Key Features:**
- ✅ Fetches chat session history from the API endpoint
- ✅ Real-time WebSocket communication for live messaging
- ✅ Automatic connection status tracking
- ✅ Message history display with timestamps
- ✅ Authentication token support
- ✅ Error handling and recovery
- ✅ Loading states
- ✅ Responsive design
- ✅ Dark mode support

**Props:**
```javascript
<AdminChat 
  sessionId="session_1770560465255_fd0jqhg7r"
  onClose={() => {}} // Called when admin closes the chat
/>
```

### 2. **AdminChatPage.jsx** (`src/components/AdminChatPage.jsx`)
A full-page component with session management UI showing a list of active sessions and the chat interface.

**Features:**
- Session list sidebar
- Active session indicator
- Message count display
- Easy session switching
- Responsive layout (stacks on mobile)

### 3. **AdminChatPage.css** (`src/components/AdminChatPage.css`)
Styling for the admin chat interface with support for:
- Light and dark themes
- Custom scrollbars
- Message animations
- Responsive design
- Connection status indicators

### 4. **Integration Guide** (`src/components/ADMIN_CHAT_INTEGRATION.md`)
Detailed documentation on how to integrate the component into your application.

### 5. **Admin Dashboard** (`src/pages/AdminDashboard.jsx`)
Example dashboard page component.

## Quick Start

### 1. Environment Setup

Add to your `.env` file:
```env
VITE_CHAT_API_BASE=http://localhost:8000
VITE_ADMIN_AUTH_TOKEN=your_admin_token_here
```

### 2. Basic Usage

```jsx
import AdminChat from './components/AdminChat';

function MyAdminPage() {
  const sessionId = 'session_1770560465255_fd0jqhg7r';
  
  return (
    <AdminChat 
      sessionId={sessionId}
      onClose={() => console.log('Chat closed')}
    />
  );
}
```

### 3. With React Router

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminChatPage from './components/AdminChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/dashboard" element={<AdminChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 4. Modal Integration

```jsx
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import AdminChat from './components/AdminChat';

function ChatModal({ sessionId, show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Body style={{ height: '600px' }}>
        <AdminChat 
          sessionId={sessionId}
          onClose={onHide}
        />
      </Modal.Body>
    </Modal>
  );
}
```

## API Integration

### Fetch Session Data
```
GET http://localhost:8000/admin/chat_sessions/{sessionId}

Response:
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
    ...
  ],
  "admin_websocket": {
    "url": "ws://localhost:8000/ws/admin/session_1770560465255_fd0jqhg7r",
    "token_required": true,
    "token_env": "ADMIN_AUTH_TOKEN"
  }
}
```

### WebSocket Connection
```
URL: ws://localhost:8000/ws/admin/{sessionId}

Auth (first message):
{
  "type": "auth",
  "token": "your_admin_token"
}

Send Message:
{
  "type": "message",
  "content": "Your message here",
  "role": "admin"
}

Receive Message:
{
  "type": "message",
  "role": "user" | "assistant",
  "content": "Message content"
}
```

## Component Features

### Message Display
- **User Messages**: Displayed on the right (blue)
- **Assistant Messages**: Displayed on the left (white)
- **Timestamps**: Shows when each message was sent
- **Auto-scroll**: Automatically scrolls to the latest message

### Connection Status
- **🟢 Connected**: WebSocket is active and ready
- **🔴 Disconnected**: Connection lost or not established

### Error Handling
- Connection failures display clear error messages
- Automatic reconnection on WebSocket errors
- User feedback for failed message sends

### Loading States
- Shows spinner while loading session data
- Shows typing indicator while sending
- Disables input during connection issues

## Styling

The component integrates seamlessly with your portfolio's existing design:

### Colors (Light Mode)
- **Primary**: Bootstrap primary blue
- **Background**: Light gray (#f5f5f5)
- **Text**: Dark gray (#333333)

### Colors (Dark Mode)
- **Primary**: Bootstrap primary blue
- **Background**: Very dark gray (#1e1e1e)
- **Text**: Light gray (#f8f9fa)

### Custom CSS Variables Used
```css
--navy-blue: Brand navy color
--body-bg: Page background color
--section-bg: Section/card background color
--text-main: Main text color
```

## Browser Compatibility

- ✅ Chrome/Chromium (v60+)
- ✅ Firefox (v55+)
- ✅ Safari (v12+)
- ✅ Edge (v79+)
- ✅ Mobile browsers

## Performance Considerations

1. **Message Virtualization**: For chats with 100+ messages, consider implementing virtualization
2. **WebSocket Reconnection**: Automatic reconnection with exponential backoff
3. **Memory Management**: Automatic cleanup on component unmount
4. **CSS Optimizations**: Minimal repaints and reflows

## Troubleshooting

### WebSocket Connection Failed
```
Error: Failed to establish WebSocket connection
Solution: 
- Verify backend is running on http://localhost:8000
- Check VITE_CHAT_API_BASE environment variable
- Check browser network tab for CORS issues
```

### Messages Not Loading
```
Error: Failed to fetch session data
Solution:
- Verify session ID is correct
- Check if API endpoint is accessible
- Check browser console for CORS errors
```

### Can't Send Messages
```
Issue: Send button disabled or messages not appearing
Solution:
- Ensure WebSocket shows "🟢 Connected"
- Verify authentication token is valid
- Check browser console for errors
```

### Dark Mode Not Working
```
Issue: Component doesn't switch to dark theme
Solution:
- Ensure document has `data-bs-theme="dark"` attribute
- Check if CSS custom properties are set
- Clear browser cache and reload
```

## Advanced Usage

### Custom Message Formatting

You can extend the component to support rich message formatting:

```jsx
// In AdminChat.jsx, modify the message rendering:
const renderMessage = (content) => {
  // Add markdown support, code highlighting, etc.
  return <div dangerouslySetInnerHTML={{ __html: marked(content) }} />;
};
```

### Session Management

To manage multiple sessions:

```jsx
const [sessions, setSessions] = useState([]);

useEffect(() => {
  // Fetch list of active sessions
  fetch(`${API_BASE}/admin/sessions`)
    .then(r => r.json())
    .then(data => setSessions(data.sessions));
}, []);
```

### File Sharing

To add file sharing capability:

```jsx
const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(
    `${API_BASE}/admin/sessions/${sessionId}/upload`,
    { method: 'POST', body: formData }
  );
};
```

## Security Notes

1. **Authentication Token**: Stored in environment variables, not in localStorage
2. **HTTPS/WSS**: Use secure WebSocket (wss://) in production
3. **CORS**: Ensure CORS is properly configured on backend
4. **Input Sanitization**: Messages are displayed as plain text; use DOMPurify if rendering HTML

## Next Steps

1. **Add to App.jsx**: Import and add the component to your main app
2. **Configure Environment**: Set up `.env` variables
3. **Test Locally**: Run dev server and test with sample session ID
4. **Deploy**: Push to production with proper environment variables
5. **Monitor**: Check browser console for any errors
6. **Extend**: Add additional features as needed (file upload, rich text, etc.)

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review the integration guide in `ADMIN_CHAT_INTEGRATION.md`
3. Verify all environment variables are set correctly
4. Check backend API is responding correctly with test endpoints

## License

This implementation is part of your portfolio project and should follow the same license as the main project.
