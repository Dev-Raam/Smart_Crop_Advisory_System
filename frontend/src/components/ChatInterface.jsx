import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Mic, MicOff, RotateCcw, Send } from 'lucide-react';
import { del, get, set } from 'idb-keyval';
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

const quickPrompts = [
  'What should I do for aphids on cotton?',
  'How often should I irrigate wheat this week?',
  'Tell me the best spray timing after rain',
];

const ChatInterface = ({ variant = 'page', onClose }) => {
  const { token, isOffline, language, locationInfo, weatherInfo, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const t = (key) => translate(language, key);
  const isWidget = variant === 'widget';
  const chatStorageKey = `chat_history_${user?.phone || 'guest'}_${language}`;

  useEffect(() => {
    get(chatStorageKey).then((cached) => {
      if (cached) {
        setMessages(cached);
        return;
      }
      setMessages([]);
    });
  }, [chatStorageKey]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
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
      void set(chatStorageKey, messages);
      return;
    }
    void del(chatStorageKey);
  }, [chatStorageKey, messages]);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageToSpeechCode[language] || 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (event, forcedPrompt) => {
    event?.preventDefault();
    const messageToSend = (forcedPrompt || input).trim();

    if (!messageToSend || isOffline) {
      return;
    }

    const userMessage = { role: 'user', content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(
        '/api/services/chat',
        {
          message: messageToSend,
          language,
          context: {
            locationName: locationInfo?.name,
            temperature: weatherInfo?.temperature_2m,
            humidity: weatherInfo?.relative_humidity_2m,
            windSpeed: weatherInfo?.wind_speed_10m,
          },
        },
        { headers: getAuthHeaders(token) },
      );

      const aiMessage = { role: 'ai', content: res.data.reply };
      setMessages((prev) => [...prev, aiMessage]);
      speak(res.data.reply);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: t('chatConnectionError') }]);
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

  const clearConversation = async () => {
    setMessages([]);
    await del(chatStorageKey);
  };

  return (
    <div className={isWidget ? 'flex h-full flex-col' : 'farm-section-card overflow-hidden p-0'}>
      <header className={`flex items-center gap-3 border-b border-black/5 ${isWidget ? 'px-5 py-4' : 'px-6 py-5 bg-white/80 backdrop-blur-sm'}`}>
        <div className="farm-ai-orb">
          <Bot size={isWidget ? 18 : 22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-black text-[#243224]">{t('chatbotTitle')}</h1>
          <p className="flex items-center gap-2 text-xs text-[#5e6d56]">
            <span className="h-2 w-2 rounded-full bg-[#7fd257]" />
            {locationInfo?.name || 'Ludhiana, Punjab'}
          </p>
        </div>
        {isWidget && onClose ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearConversation}
              className="rounded-full bg-[#f5f7ef] p-2 text-[#52624f]"
              aria-label="Clear conversation"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#f5f7ef] px-3 py-1.5 text-xs font-semibold text-[#52624f]"
            >
              Close
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={clearConversation}
            className="rounded-full bg-[#f5f7ef] p-2 text-[#52624f]"
            aria-label="Clear conversation"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </header>

      <div className={`flex-1 space-y-4 overflow-y-auto ${isWidget ? 'bg-[#f8faf4] px-4 py-4' : 'bg-[#f8faf4] px-6 py-6 min-h-[420px]'}`}>
        {messages.length === 0 ? (
          <div className="rounded-[28px] border border-[#e6ebda] bg-white p-5 shadow-[0_12px_32px_rgba(35,55,25,0.08)]">
            <p className="text-lg font-bold text-[#243224]">{t('namaste')}</p>
            <p className="mt-2 text-sm text-[#687764]">{t('chatbotIntro')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={(event) => handleSend(event, prompt)}
                  className="rounded-full border border-[#dbe5c7] bg-[#f6f9ef] px-3 py-2 text-xs font-semibold text-[#4f6343] transition hover:bg-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((msg, index) => (
          <div key={`${msg.role}-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-tr-sm bg-[#2d5a20] text-white'
                  : 'rounded-tl-sm border border-[#e6ebda] bg-white text-[#223222]'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-[24px] rounded-tl-sm border border-[#e6ebda] bg-white px-4 py-3 shadow-sm">
              <Loader2 className="animate-spin text-[#7baa33]" size={18} />
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className={`border-t border-black/5 bg-white ${isWidget ? 'p-4' : 'p-6'}`}>
        {isOffline ? <p className="mb-2 text-center text-xs text-red-500">{t('chatbotOffline')}</p> : null}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListen}
            disabled={isOffline}
            className={`rounded-full p-3 transition ${
              isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-[#eef5df] text-[#56784b] hover:bg-[#e3eccf]'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isOffline}
            placeholder={t('typeQuestion')}
            className="flex-1 rounded-full border border-[#dde6cd] bg-[#f6f9ef] px-4 py-3 text-sm outline-none transition focus:border-[#86c440] focus:ring-4 focus:ring-[#86c440]/10"
          />

          <button
            type="submit"
            disabled={!input.trim() || isOffline || loading}
            className="rounded-full bg-[#86c440] p-3 text-white shadow-[0_14px_34px_rgba(134,196,64,0.28)] transition hover:bg-[#6da62f] disabled:opacity-60"
          >
            {isWidget ? <Send size={18} /> : <MessageCircle size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
