import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import ChatInterface from './ChatInterface';

const ChatAssistantWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-4 z-[70] h-[min(70vh,620px)] w-[min(calc(100vw-2rem),380px)] overflow-hidden rounded-[30px] border border-white/70 bg-white/96 shadow-[0_30px_80px_rgba(22,37,10,0.28)] backdrop-blur-xl md:bottom-8 md:right-8">
          <ChatInterface variant="widget" onClose={() => setOpen(false)} />
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Open AI assistant"
        onClick={() => setOpen((prev) => !prev)}
        className="farm-floating-assistant"
      >
        <span className="farm-floating-assistant-ring" />
        <span className="relative z-10 flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#dff28d] via-[#9cdd4a] to-[#3d7a1e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          {open ? <Sparkles size={24} /> : <Bot size={24} />}
        </span>
      </button>
    </>
  );
};

export default ChatAssistantWidget;
