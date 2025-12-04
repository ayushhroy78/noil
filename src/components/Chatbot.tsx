import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Trash2, Copy, Check, Heart, Scale, Utensils, Activity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Topic {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const topics: Topic[] = [
  { id: "general", label: "General", icon: <Bot className="w-3 h-3" />, color: "bg-primary/20 text-primary border-primary/30" },
  { id: "heart_health", label: "Heart Health", icon: <Heart className="w-3 h-3" />, color: "bg-red-500/20 text-red-600 border-red-500/30" },
  { id: "weight_loss", label: "Weight Loss", icon: <Scale className="w-3 h-3" />, color: "bg-green-500/20 text-green-600 border-green-500/30" },
  { id: "indian_recipes", label: "Indian Recipes", icon: <Utensils className="w-3 h-3" />, color: "bg-orange-500/20 text-orange-600 border-orange-500/30" },
  { id: "diabetes", label: "Diabetes", icon: <Activity className="w-3 h-3" />, color: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  { id: "family_cooking", label: "Family", icon: <Users className="w-3 h-3" />, color: "bg-purple-500/20 text-purple-600 border-purple-500/30" },
];

const quickSuggestions: Record<string, string[]> = {
  general: ["How to reduce oil intake?", "Healthy cooking tips", "Best oils for heart health"],
  heart_health: ["Which oils lower cholesterol?", "PUFA vs MUFA explained", "Heart-healthy cooking methods"],
  weight_loss: ["Calories in cooking oil", "Oil-free cooking tips", "Hidden oils in food"],
  indian_recipes: ["Low-oil tadka tips", "Healthy curry recipes", "Air fryer Indian snacks"],
  diabetes: ["Best oils for diabetics", "Low glycemic cooking", "Sugar-free Indian desserts"],
  family_cooking: ["Kid-friendly healthy meals", "Quick low-oil dinners", "Healthy school lunch ideas"],
};

const WELCOME_MESSAGE: Message = { 
  role: "assistant", 
  content: "Hi! I'm your Noil health assistant 🌿 Select a topic above for specialized advice, or ask me anything about healthy cooking and oil tracking!" 
};

// Enhanced floating background with more elements
const FloatingBubbles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Large gradient orbs */}
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl animate-pulse" />
    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
    <div className="absolute top-1/2 -right-20 w-48 h-48 bg-gradient-to-l from-green-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
    
    {/* Animated floating circles */}
    <div className="absolute top-16 left-6 w-3 h-3 bg-primary/25 rounded-full animate-float" style={{ animationDuration: "6s" }} />
    <div className="absolute top-32 right-8 w-2 h-2 bg-green-500/30 rounded-full animate-float" style={{ animationDuration: "5s", animationDelay: "1s" }} />
    <div className="absolute top-48 left-12 w-2.5 h-2.5 bg-orange-500/25 rounded-full animate-float" style={{ animationDuration: "7s", animationDelay: "2s" }} />
    <div className="absolute bottom-40 right-6 w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-float" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
    <div className="absolute bottom-24 left-8 w-2 h-2 bg-purple-500/25 rounded-full animate-float" style={{ animationDuration: "5.5s", animationDelay: "1.5s" }} />
    
    {/* Sparkle elements */}
    <div className="absolute top-24 right-16 w-1 h-1 bg-yellow-400/50 rounded-full animate-ping" style={{ animationDuration: "3s" }} />
    <div className="absolute top-56 left-4 w-1 h-1 bg-yellow-400/40 rounded-full animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
    <div className="absolute bottom-48 right-12 w-1 h-1 bg-yellow-400/30 rounded-full animate-ping" style={{ animationDuration: "3.5s", animationDelay: "2s" }} />
    
    {/* Gradient lines */}
    <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/10 to-transparent" />
    
    {/* Subtle mesh pattern */}
    <div className="absolute inset-0 opacity-[0.03]" style={{
      backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
      backgroundSize: '20px 20px'
    }} />
    
    {/* Corner decorations */}
    <svg className="absolute top-2 right-2 w-16 h-16 text-primary/5" viewBox="0 0 100 100">
      <circle cx="80" cy="20" r="15" fill="currentColor" />
      <circle cx="60" cy="10" r="8" fill="currentColor" />
      <circle cx="90" cy="40" r="6" fill="currentColor" />
    </svg>
    <svg className="absolute bottom-16 left-2 w-12 h-12 text-green-500/5" viewBox="0 0 100 100">
      <circle cx="20" cy="80" r="12" fill="currentColor" />
      <circle cx="40" cy="70" r="6" fill="currentColor" />
    </svg>
  </div>
);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("general");
  const scrollRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({ title: "Copied!", description: "Response copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const streamChat = async (userMessages: Message[]): Promise<string> => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages, topic: selectedTopic }),
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
    let streamDone = false;

    while (!streamDone) {
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
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

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
          // Incomplete JSON, put back and wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Process any remaining buffer after stream ends
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => prev.map((m, i) => 
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            ));
          }
        } catch { /* ignore partial leftovers */ }
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

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    const topic = topics.find(t => t.id === topicId);
    if (topic && topicId !== "general") {
      toast({ 
        title: `${topic.label} Mode`, 
        description: `I'll focus on ${topic.label.toLowerCase()} advice now!` 
      });
    }
  };

  const currentSuggestions = quickSuggestions[selectedTopic] || quickSuggestions.general;

  return (
    <>
      {/* Floating Chat Button with pulse effect */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? "bg-muted text-muted-foreground" 
            : "bg-primary text-primary-foreground hover:scale-110 hover:shadow-xl"
        }`}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
        )}
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-40 right-4 z-50 w-[calc(100%-2rem)] max-w-sm h-[75vh] max-h-[600px] flex flex-col shadow-2xl border-border bg-gradient-to-b from-card via-card to-card/95 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Background decorations */}
          <FloatingBubbles />
          
          {/* Header */}
          <div className="relative flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 shadow-lg">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Noil Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by AI • Your health coach</p>
            </div>
            {userId && messages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearHistory}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Topic Selector */}
          <div className="relative px-3 py-2 border-b border-border/50 bg-gradient-to-r from-secondary/30 to-transparent backdrop-blur-sm">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicChange(topic.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                    selectedTopic === topic.id
                      ? `${topic.color} border-current shadow-sm scale-105`
                      : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:scale-102"
                  }`}
                >
                  {topic.icon}
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="relative flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md shadow-md"
                          : "bg-secondary/80 text-secondary-foreground rounded-bl-md backdrop-blur-sm shadow-sm border border-border/30"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    {/* Copy button for assistant messages */}
                    {message.role === "assistant" && message.content && (
                      <button
                        onClick={() => copyToClipboard(message.content, index)}
                        className="self-start flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded hover:bg-secondary/50"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-green-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2 justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="bg-secondary/80 rounded-2xl rounded-bl-md px-4 py-3 backdrop-blur-sm shadow-sm border border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground px-2 animate-pulse">Assistant is typing...</span>
                  </div>
                </div>
              )}

              {/* Quick Suggestions - show only when no messages sent yet */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all hover:scale-105 hover:shadow-sm border border-primary/20"
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
          <div className="relative p-4 border-t border-border bg-gradient-to-t from-card via-card/95 to-card/90 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about healthy cooking..."
                className="flex-1 bg-secondary/50 border-border/50 focus-visible:ring-primary/30 focus-visible:border-primary/50"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Custom animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Chatbot;
