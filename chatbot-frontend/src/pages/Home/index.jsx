import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './style.css';

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [threadId, setThreadId] = useState(null);
  const messageWindowRef = useRef(null);

  useEffect(() => {
    const createThread = async () => {
      const threadFromApi = await api.post('/thread');
      setThreadId(threadFromApi.data.id);
    };

    createThread();
  }, []);

  const toggleClass = (element, className) => {
    element.classList.toggle(className);
  };

  const handleHeaderClick = () => {
    const chatbot = document.querySelector('.chatbot');
    toggleClass(chatbot, 'chatbot--closed');
    if (!chatbot.classList.contains('chatbot--closed')) {
      document.querySelector('.chatbot__input').focus();
    }
  };

  const handleSubmit = () => {
    validateMessage();
  };

  const validateMessage = () => {
    const safeText = inputValue.trim();
    if (safeText) {
      resetInputField();
      addUserMessage(safeText);
      sendMessage(safeText);
    }
  };

  const resetInputField = () => {
    setInputValue('');
  };

  const addUserMessage = (content) => {
    setMessages((prevMessages) => [...prevMessages, { type: 'user', content }]);
  };

  const addAIMessage = (content, isLoading = false) => {
    setMessages((prevMessages) => [...prevMessages, { type: 'ai', content, isLoading }]);
  };

  const removeLoader = () => {
    setMessages((msgs) => msgs.filter((msg) => !msg.isLoading));
  };

  const sendMessage = async (text) => {
    if (!threadId) {
      console.error('Thread ID not defined');
      return;
    }

    addAIMessage('...', true);
    try {
      const response = await api.post('/mensagem', {
        threadId,
        conteudoMensagem: text,
      });
      removeLoader();
      setResponse(response.data.resposta);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const setResponse = (content) => {
    addAIMessage(content);
  };

  useEffect(() => {
    if (messageWindowRef.current) {
      messageWindowRef.current.scrollTop = messageWindowRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chatbot chatbot--closed">
      <div className="chatbot__header" onClick={handleHeaderClick}>
        <p>
          <strong>O que deseja saber?</strong> <span className="u-text-highlight">Pergunte aqui!</span>
        </p>
        <svg className="chatbot__close-button icon-speech" viewBox="0 0 32 32">
          <use xlinkHref="#icon-speech" />
        </svg>
        <svg className="chatbot__close-button icon-close" viewBox="0 0 32 32">
          <use xlinkHref="#icon-close" />
        </svg>
      </div>
      <div className="chatbot__message-window" ref={messageWindowRef}>
        <ul className="chatbot__messages">
          {messages.map((msg, index) => (
            <li key={index} className={`is-${msg.type} animation`}>
              {msg.type === 'ai' && (
                <div className="is-ai__profile-picture">
                  <svg className="icon-avatar" viewBox="0 0 32 32">
                    <use xlinkHref="#avatar" />
                  </svg>
                </div>
              )}
              <span className={`chatbot__arrow chatbot__arrow--${msg.type === 'user' ? 'right' : 'left'}`}></span>
              <div className="chatbot__message">{msg.content}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="chatbot__entry chatbot--closed">
        <input
          type="text"
          className="chatbot__input"
          placeholder="Escreva sua mensagem..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') validateMessage();
          }}
        />
        <svg className="chatbot__submit" viewBox="0 0 32 32" onClick={handleSubmit}>
          <use xlinkHref="#icon-send" />
        </svg>
      </div>
    </div>
  );
};

export default Home;