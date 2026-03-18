# Changes Needed for AdminChat.jsx

## 1. Add state for delete message feature (after line 28):
```javascript
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

## 2. Fix WebSocket URL handling in connectWebSocket (around line 230):
Change from:
```javascript
const rawUrl = typeof wsConfig === 'string' ? wsConfig : wsConfig?.url;
let wsUrl = toWebSocketUrl(rawUrl);
```

To:
```javascript
let wsUrl;
if (typeof wsConfig === 'string') {
  wsUrl = toWebSocketUrl(wsConfig);
} else if (wsConfig?.url) {
  wsUrl = toWebSocketUrl(wsConfig.url);
} else {
  throw new Error('Invalid websocket config');
}
```

## 3. Add delete message handler functions (before handleDeleteSession):
```javascript
const handleDeleteMessage = async (messageId) => {
  setDeleteMessageId(messageId);
  setShowDeleteConfirm(true);
};

const confirmDeleteMessage = async () => {
  if (!deleteMessageId || isDeletingMessage) return;
  
  setIsDeletingMessage(true);
  setShowDeleteConfirm(false);
  setError(null);
  
  try {
    const response = await fetch(
      buildAdminUrl(`${ADMIN_ROUTES.chatSessions}/${sessionId}/messages/${deleteMessageId}`),
      {
        method: 'DELETE',
        headers: withAuthHeaders(token)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete message');
    }

    setMessages(prev => prev.filter(msg => msg.id !== deleteMessageId));
    alert('Message deleted. Session termination email sent to user.');
  } catch (err) {
    setError(err.message || 'Failed to delete message');
  } finally {
    setIsDeletingMessage(false);
    setDeleteMessageId(null);
  }
};

const cancelDeleteMessage = () => {
  setShowDeleteConfirm(false);
  setDeleteMessageId(null);
};
```

## 4. Update message rendering to add delete button and modal
Around line 595-615 in messages.map, update the structure to add delete button for user messages and add modal at end of return().
