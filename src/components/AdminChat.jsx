import React, { useState } from 'react';
import { BiArrowBack, BiSmile, BiPaperclip, BiSend, BiMicrophone } from 'react-icons/bi';

const AdminChat = ({ sessionId, onClose, displayName, statusLabel, isMobileView }) => {
  const [inputText, setInputText] = useState('');

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Handle your file upload logic here
      console.log('File selected:', file.name);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      // TODO: Handle your send message logic here
      console.log('Sending message:', inputText);
      setInputText('');
    }
  };

  return (
    <div className="d-flex flex-column h-100 admin-chat-container">
      {/* --- HEADER --- */}
      <div className="my-chat-header d-flex align-items-center px-2 px-md-3">
        <div className="my-chat-header-left">
          {/* Back Button (Mobile Only) */}
          {isMobileView && (
            <button className="my-header-back-btn" onClick={onClose} aria-label="Go back">
              <BiArrowBack size={24} />
            </button>
          )}
          
          {/* Avatar */}
          <div className="my-chat-avatar">
            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          
          {/* Name & Status (Perfectly aligned vertically) */}
          <div className="my-chat-user-meta ms-2">
            <span className="my-chat-title">{displayName}</span>
            <span className="my-connection-text">{statusLabel}</span>
          </div>
        </div>
        
        {/* Additional Header Actions (Dropdowns, etc.) */}
        <div className="my-chat-header-actions">
           {/* Add your existing header actions/dropdowns here */}
        </div>
      </div>

      {/* --- CHAT BODY --- */}
      <div className="my-chat-body flex-grow-1 overflow-auto p-3">
        
        {/* Chat from User (Floats Left) */}
        <div className="my-msg-row-user mb-2">
          <div className="my-message-bubble my-message-user p-2 rounded">
            Hello, I need some assistance with my account.
            <div className="my-message-time text-end mt-1">10:00 AM</div>
          </div>
        </div>

        {/* Chat from Admin/Me (Floats Right) */}
        <div className="my-msg-row-admin mb-2">
          <div className="my-message-bubble my-message-admin p-2 rounded">
            Hi there! I'd be happy to help you with that.
            <div className="my-message-time text-end mt-1">10:01 AM</div>
          </div>
        </div>
        
      </div>

      {/* --- INPUT AREA (WhatsApp Style) --- */}
      <div className="my-input-wrap d-flex align-items-end p-2 gap-2">
        
        {/* White pill wrapper for input and inner buttons */}
        <div className="my-chat-input-wrapper d-flex align-items-center flex-grow-1">
          
          {/* Emoji Button (Left) */}
          <button className="btn btn-link p-1 my-action-icon text-decoration-none shadow-none" title="Emojis">
            <BiSmile size={24} />
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            className="my-chat-input-field form-control border-0 shadow-none bg-transparent"
            placeholder="Type a message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />

          {/* Attach File Button (Right - Docs & Images Only) */}
          <label className="btn btn-link p-1 mb-0 my-action-icon cursor-pointer shadow-none" title="Attach file">
            <BiPaperclip size={24} style={{ transform: 'rotate(45deg)' }} />
            <input
              type="file"
              accept=".doc,.docx,.pdf,image/*"
              hidden
              onChange={handleFileAttach}
            />
          </label>
          
        </div>

        {/* Floating Send/Mic Button (Far Right) */}
        <button
          className="my-send-mic-btn d-flex align-items-center justify-content-center"
          onClick={inputText.trim() ? handleSendMessage : undefined}
          title={inputText.trim() ? "Send message" : "Record voice message"}
        >
          {inputText.trim() ? (
            <BiSend size={20} color="white" />
          ) : (
            <BiMicrophone size={24} color="white" />
          )}
        </button>
        
      </div>
    </div>
  );
};

export default AdminChat;