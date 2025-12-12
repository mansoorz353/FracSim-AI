import React, { useState, useRef, useEffect } from 'react';
import { generateText, generateImage, editImage, generateVideo } from '../services/geminiService';
import { ChatMessage, AspectRatio } from '../types';

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'init', role: 'model', content: "Hello. I am your engineering assistant. I can help answer technical questions, generate diagrams (images), edit schematics, or create simulation videos using Veo. How can I assist?", type: 'text', timestamp: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Feature Toggles
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [mode, setMode] = useState<'chat' | 'image' | 'video'>('chat');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio['16:9']);
  
  // File Upload for Image Editing/Video
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'user',
          content: `Uploaded image for ${mode === 'video' ? 'video generation' : 'editing'}`,
          type: 'image',
          mediaUrl: reader.result as string,
          timestamp: Date.now()
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: 'text',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Logic Router
      if (mode === 'image') {
        // Generate Image
        const imageUrl = await generateImage(userMsg.content, aspectRatio);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          content: `Generated image with aspect ratio ${aspectRatio}`,
          type: 'image',
          mediaUrl: imageUrl,
          timestamp: Date.now()
        }]);
      } 
      else if (mode === 'video') {
         if (!selectedImage) {
             throw new Error("Please upload an image first to animate with Veo.");
         }
         // Check Key and Generate
         try {
             const videoUrl = await generateVideo(userMsg.content || "Animate this", selectedImage, aspectRatio === '9:16' ? '9:16' : '16:9');
             setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                content: "Here is your Veo generated video.",
                type: 'video',
                mediaUrl: videoUrl,
                timestamp: Date.now()
             }]);
         } catch (err: any) {
             if (err.message === "API_KEY_REQUIRED") {
                 // Render a button in chat to select key
                 setMessages(prev => [...prev, {
                     id: Date.now().toString(),
                     role: 'model',
                     content: "Veo requires a paid API key. Please select one below.",
                     type: 'text',
                     timestamp: Date.now()
                 }]);
                 // We handle the UI action separately or let the user click a global button
                 // For this demo, we'll auto-trigger the modal if we can, or show a button
                 window.aistudio.openSelectKey();
             } else {
                 throw err;
             }
         }
      } 
      else if (selectedImage && mode === 'chat') {
        // Image Editing (Nano Banana)
        const editedUrl = await editImage(selectedImage, userMsg.content);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            content: "Here is the edited image.",
            type: 'image',
            mediaUrl: editedUrl,
            timestamp: Date.now()
        }]);
      }
      else {
        // Text/Thinking/Search
        const { text, grounding } = await generateText(userMsg.content, useSearch, useThinking);
        let content = text;
        if (grounding.length > 0) {
            const links = grounding.map((g: any) => g.web?.uri).filter(Boolean).join('\n');
            content += `\n\nSources:\n${links}`;
        }
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          content: content,
          type: 'text',
          timestamp: Date.now(),
          isThinking: useThinking
        }]);
      }

    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: `Error: ${error.message}`,
        type: 'text',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null); // Clear image after use
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      {/* Header / Controls */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="material-icons">engineering</span> AI Assistant
        </h2>
        
        <div className="flex flex-wrap gap-2 text-xs mb-3">
          <button onClick={() => setMode('chat')} className={`px-3 py-1 rounded ${mode === 'chat' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Chat / Edit</button>
          <button onClick={() => setMode('image')} className={`px-3 py-1 rounded ${mode === 'image' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Generate Image</button>
          <button onClick={() => setMode('video')} className={`px-3 py-1 rounded ${mode === 'video' ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Generate Video (Veo)</button>
        </div>

        {mode === 'chat' && (
            <div className="flex gap-4">
                <label className="flex items-center text-slate-300 text-xs cursor-pointer">
                    <input type="checkbox" checked={useSearch} onChange={e => { setUseSearch(e.target.checked); if(e.target.checked) setUseThinking(false); }} className="mr-2" />
                    Google Search
                </label>
                <label className="flex items-center text-slate-300 text-xs cursor-pointer">
                    <input type="checkbox" checked={useThinking} onChange={e => { setUseThinking(e.target.checked); if(e.target.checked) setUseSearch(false); }} className="mr-2" />
                    Thinking Mode (Complex)
                </label>
            </div>
        )}

        {(mode === 'image' || mode === 'video') && (
             <select 
                value={aspectRatio} 
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="bg-slate-700 text-white text-xs p-1 rounded mt-2 border border-slate-600"
             >
                 {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
             </select>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
               {msg.isThinking && <div className="text-xs text-purple-300 mb-1 italic">Thinking...</div>}
               {msg.type === 'text' && <div className="whitespace-pre-wrap text-sm">{msg.content}</div>}
               {msg.type === 'image' && (
                 <div>
                    <p className="text-xs mb-1 opacity-70">{msg.content}</p>
                    <img src={msg.mediaUrl} alt="Generated" className="rounded max-w-full border border-slate-600" />
                 </div>
               )}
               {msg.type === 'video' && (
                 <div>
                    <p className="text-xs mb-1 opacity-70">{msg.content}</p>
                    <video controls src={msg.mediaUrl} className="rounded max-w-full border border-slate-600" />
                 </div>
               )}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-slate-400 text-xs text-center animate-pulse">AI is working...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        {(mode === 'chat' || mode === 'video') && (
            <div className="mb-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded flex items-center gap-1"
                >
                    <span className="text-lg">+</span> {selectedImage ? "Image Selected" : "Upload Image"}
                </button>
            </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
            placeholder={mode === 'video' ? "Describe the video motion..." : "Type your query or prompt..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};