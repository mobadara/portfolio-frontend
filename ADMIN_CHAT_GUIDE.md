# Admin Chat Usage Guide

## Overview
The admin chat system allows you to receive and respond to chat requests from website visitors in real-time.

## How It Works

### For Visitors:
1. Visitors interact with the AI chatbot on your portfolio
2. If they want to talk to you directly, they can click **"Talk to Muyiwa"** button
3. This creates a chat session that appears in your admin dashboard
4. Their conversation seamlessly transitions from AI to you

### For You (Admin):
1. Navigate to `/admin/dashboard` on your site
2. You'll see a list of all active chat sessions
3. Click on any session to open the chat interface
4. Send messages in real-time via WebSocket connection
5. The visitor receives your messages instantly in their chatbot

## Accessing Admin Dashboard

### Local Development:
```
http://localhost:5173/admin/dashboard
```

### Production:
```
https://your-domain.com/admin/dashboard
```

## Features

### Session List (Left Sidebar):
- Shows all active chat sessions
- Displays session details:
  - User ID (anonymized)
  - Number of messages
  - Last activity time
  - Mode (Bot or Human)
- Auto-refreshes every 10 seconds
- Badge indicators for Bot/Human mode

### Chat Interface:
- Real-time WebSocket communication
- Message history
- Typing indicators
- Connection status
- Timestamps for all messages
- Admin/User message differentiation

### User-Facing Chatbot:
- AI-powered responses for common queries
- **"Talk to Muyiwa"** button (appears after first exchange)
- Seamless transition to human support
- Visual indication when connected to human
- Markdown support for rich formatting

## Backend API Endpoints

Your backend is configured at:
```
https://portfolio-backend-tjq3.onrender.com
```

### Key Endpoints:
- `GET /admin/sessions` - List all active chat sessions
- `GET /admin/chat_sessions/{session_id}` - Get specific session details
- `POST /chat/{session_id}/request-human` - Request human support
- `WS /chat/{session_id}` - WebSocket connection for real-time chat

## Environment Variables

Create a `.env` file in the root directory:
```env
VITE_CHAT_API_BASE=https://portfolio-backend-tjq3.onrender.com
```

## Security Notes

1. **Authentication**: Consider adding authentication to `/admin/dashboard` route
2. **WebSocket**: The backend may require token authentication for admin WebSocket connections
3. **Session Privacy**: User identities are protected (only session IDs shown)

## Troubleshooting

### No sessions appearing:
- Check that visitors have clicked "Talk to Muyiwa"
- Verify backend is running: `https://portfolio-backend-tjq3.onrender.com/health`
- Check browser console for errors

### WebSocket not connecting:
- Ensure WebSocket URL is correct in backend response
- Check firewall/proxy settings
- Verify CORS settings on backend

### Messages not sending:
- Check WebSocket connection status (shown in chat header)
- Verify session ID is valid
- Check backend logs for errors

## Tips for Best Experience

1. **Keep Dashboard Open**: Keep the admin dashboard open in a browser tab to receive notifications
2. **Quick Response**: Respond promptly when visitors request human support
3. **Markdown Support**: You can use markdown formatting in your messages
4. **Session Management**: Sessions remain active as long as the visitor keeps their chat open

## Future Enhancements

Consider adding:
- Browser notifications when new sessions arrive
- Email alerts for human support requests
- Chat session analytics
- Canned responses for common questions
- File/image sharing
- Session transfer back to bot

## Support

For backend API documentation and updates, check your backend repository or contact your backend developer.
