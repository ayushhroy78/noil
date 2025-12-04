import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Mic, MicOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Type declarations for Speech Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const quickSuggestions = [
  "How to reduce oil intake?",
  "Healthy cooking tips",
  "Best oils for heart health",
  "Daily oil limit for adults",
  "Low-oil recipe ideas",
];

const WELCOME_MESSAGE: Message = { 
  role: "assistant", 
  content: "Hi! I'm your Noil health assistant 🌿 How can I help you with healthy cooking and oil tracking today?" 
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();

  // Load user and chat history
  useEffect(() => {
    const loadUserAndHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        
        if (data && data.length > 0) {
          setMessages(data as Message[]);
        }
      }
    };
    loadUserAndHistory();
  }, []);

  // Initialize Speech Recognition
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Update input with current transcript
        const currentTranscript = finalTranscript || interimTranscript;
        setInput(currentTranscript);
        finalTranscriptRef.current = finalTranscript;
        
        console.log('Speech recognition result:', { finalTranscript, interimTranscript });
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Auto-send if we have a final transcript
        if (finalTranscriptRef.current.trim()) {
          const transcript = finalTranscriptRef.current.trim();
          finalTranscriptRef.current = "";
          // Use setTimeout to ensure state updates have propagated
          setTimeout(() => {
            setInput(transcript);
            // Trigger send
            const sendButton = document.querySelector('[data-voice-send]') as HTMLButtonElement;
            if (sendButton && transcript) {
              sendButton.click();
            }
          }, 100);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        finalTranscriptRef.current = "";
        
        const errorMessages: Record<string, string> = {
          'not-allowed': "Please allow microphone access to use voice input.",
          'no-speech': "No speech detected. Please try again.",
          'audio-capture': "No microphone found. Please check your device.",
          'network': "Network error. Please check your connection.",
          'aborted': "Voice input was cancelled.",
        };

        if (event.error !== 'aborted') {
          toast({
            title: "Voice Input Error",
            description: errorMessages[event.error] || `Error: ${event.error}`,
            variant: "destructive",
          });
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      finalTranscriptRef.current = "";
      setInput("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Speech recognition started');
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        toast({
          title: "Voice Input Error",
          description: "Failed to start voice input. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const streamChat = async (userMessages: Message[]): Promise<string> => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && prev.length > 1) {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
    return assistantContent;
  };

  const saveMessage = async (message: Message) => {
    if (!userId) return;
    await supabase.from("chat_messages").insert({
      user_id: userId,
      role: message.role,
      content: message.content,
    });
  };

  const clearHistory = async () => {
    if (!userId) return;
    await supabase.from("chat_messages").delete().eq("user_id", userId);
    setMessages([WELCOME_MESSAGE]);
    toast({ title: "Chat cleared", description: "Your conversation history has been deleted." });
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage: Message = { role: "user", content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Save user message
    await saveMessage(userMessage);

    try {
      const assistantContent = await streamChat(newMessages.filter(m => m.content));
      // Save assistant message after streaming completes
      if (assistantContent) {
        await saveMessage({ role: "assistant", content: assistantContent });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages(prev => {
        if (prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1]?.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? "bg-muted text-muted-foreground" 
            : "bg-primary text-primary-foreground hover:scale-110"
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-40 right-4 z-50 w-[calc(100%-2rem)] max-w-sm h-[70vh] max-h-[550px] flex flex-col shadow-xl border-border bg-card animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-primary/5 rounded-t-lg">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Noil Assistant</h3>
              <p className="text-xs text-muted-foreground">Your health coach</p>
            </div>
            {userId && messages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearHistory}
                className="text-muted-foreground hover:text-destructive"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Suggestions - show only when no messages sent yet */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Button
                onClick={toggleListening}
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={`flex-shrink-0 ${isListening ? "animate-pulse" : ""}`}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Ask about healthy cooking..."}
                className="flex-1 bg-secondary border-0"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-primary hover:bg-primary/90"
                data-voice-send
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
