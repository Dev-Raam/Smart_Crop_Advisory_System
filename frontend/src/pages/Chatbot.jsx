import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { useAuth } from '../context/AuthContext';
import { api, getAuthHeaders } from '../lib/api';
import { translate } from '../utils/translations';

const languageToSpeechCode = {
  en: 'en-US',
  hi: 'hi-IN',
  pa: 'pa-IN',
  gu: 'gu-IN',
  te: 'te-IN',
};

const Chatbot = () => {
  const { token, isOffline, language } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const t = (key) => translate(language, key);

  useEffect(() => {
    get('chat_history').then((cached) => {
      if (cached) {
        setMessages(cached);
      }
    });
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      void set('chat_history', messages);
    }
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isOffline) {
      return;
    }

    const messageToSend = input.trim();
    const userMessage = { role: 'user', content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(
        '/api/services/chat',
        { message: messageToSend, language },
        { headers: getAuthHeaders(token) },
      );

      const aiMessage = { role: 'ai', content: res.data.reply };
      setMessages((prev) => [...prev, aiMessage]);
      speak(res.data.reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: t('chatConnectionError') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleListen = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      window.alert(t('speechNotSupported'));
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.lang = languageToSpeechCode[language] || 'en-US';
    recognition.start();
    setIsListening(true);
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageToSpeechCode[language] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen max-w-3xl mx-auto w-full">
      <header className="p-4 bg-white shadow-sm z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <MessageCircle size={24} />
        </div>
        <div>
          <h1 className="font-bold text-gray-800">{t('chatbotTitle')}</h1>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> {t('online')}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p className="text-lg">{t('namaste')}</p>
            <p className="text-sm">{t('chatbotIntro')}</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl rounded-tl-sm">
              <Loader2 className="animate-spin text-blue-500" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 pb-safe">
        {isOffline && (
          <p className="text-xs text-red-500 mb-2 text-center">{t('chatbotOffline')}</p>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={toggleListen}
            disabled={isOffline}
            className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isOffline}
            placeholder={t('typeQuestion')}
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />

          <button
            type="submit"
            disabled={!input.trim() || isOffline || loading}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
