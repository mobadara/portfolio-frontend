import { useState, useRef, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import { BiBot, BiSend, BiX } from 'react-icons/bi';
import { BsChatDotsFill } from 'react-icons/bs';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm Muyiwa's AI Assistant. Ask me about his skills, projects, or schedule!", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // 2. Simulate Bot Response (Replace this with your FastAPI call later)
    setTimeout(() => {
      const botMsg = { 
        id: Date.now() + 1, 
        text: "I'm currently a frontend demo. Muyiwa is building my brain with FastAPI and PyTorch right now! 🧠", 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <>
      {/* 1. THE FLOATING BUTTON (FAB) */}
      <Button 
        className="chatbot-fab d-flex align-items-center justify-content-center shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Chat"
      >
        {isOpen ? <BiX size={28} /> : <BsChatDotsFill size={24} />}
      </Button>

      {/* 2. THE CHAT WINDOW */}
      <div className={`chatbot-window shadow-lg ${isOpen ? 'open' : ''}`}>
        <Card className="h-100 border-0 overflow-hidden">
          
          {/* Header */}
          <div className="card-header bg-navy text-white d-flex align-items-center justify-content-between p-3">
            <div className="d-flex align-items-center gap-2">
                <div className="bg-white text-navy rounded-circle p-1 d-flex">
                    <BiBot size={20} />
                </div>
                <h6 className="mb-0 fw-bold">Assistant</h6>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white-50 p-0">
                <BiX size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <Card.Body className="chat-body bg-light p-3 overflow-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div 
                  className={`p-2 px-3 rounded-3 ${
                    msg.sender === 'user' 
                      ? 'bg-navy text-white rounded-bottom-right-0' // User Style
                      : 'bg-white text-dark border rounded-bottom-left-0' // Bot Style
                  }`}
                  style={{ maxWidth: '80%' }}
                >
                  <small className="d-block mb-1 opacity-75" style={{ fontSize: '0.7rem' }}>
                    {msg.sender === 'user' ? 'You' : 'AI'}
                  </small>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </Card.Body>

          {/* Input Area */}
          <div className="card-footer bg-white p-2">
            <Form onSubmit={handleSend} className="d-flex gap-2">
              <Form.Control 
                type="text" 
                placeholder="Type a message..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border-0 bg-light shadow-none"
                style={{ fontSize: '0.9rem' }}
              />
              <Button type="submit" variant="primary" className="bg-navy border-navy d-flex align-items-center justify-content-center px-3">
                <BiSend />
              </Button>
            </Form>
          </div>

        </Card>
      </div>
    </>
  );
};

export default Chatbot;