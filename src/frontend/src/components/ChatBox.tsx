import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AIChatMessage, AIChatRequest } from '@/types';
import { messagesApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatBoxProps {
  className?: string;
}

export default function ChatBox({ className }: ChatBoxProps) {
  const { token, user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Don't render if no token
  if (!token || !user) {
    return null;
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  // Load initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = user?.role === 'league'
        ? "Hi! I'm RefNexus Agent. I can help you find referees, schedule games, and manage your league. What would you like to do today?"
        : "Hi! I'm RefNexus Agent. I can help you find games, manage your availability, and view assignments. How can I assist you?";
      
      setMessages([{
        role: 'assistant',
        content: greeting,
      }]);
    }
  }, [user]);

  // Send a message to AI
  const handleSendMessage = async () => {
    if (!token || !newMessage.trim() || isLoading) return;
    
    const userMessage = newMessage.trim();
    setNewMessage('');
    
    // Add user message to chat
    const updatedMessages: AIChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const request: AIChatRequest = {
        message: userMessage,
        conversation_history: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      };
      
      const response = await messagesApi.aiChat(token, request);
      
      // Add AI response to chat
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: response.response },
      ]);

      // Show action results if any
      if (response.actions && response.actions.length > 0) {
        response.actions.forEach(action => {
          console.log(`AI performed action: ${action.function}`, action.result);
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive',
      });
      
      // Remove the user message if request failed
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    const greeting = user?.role === 'league'
      ? "Hi! I'm RefNexus Agent. I can help you find referees, schedule games, and manage your league. What would you like to do today?"
      : "Hi! I'm RefNexus Agent. I can help you find games, manage your availability, and view assignments. How can I assist you?";
    
    setMessages([{
      role: 'assistant',
      content: greeting,
    }]);
  };

  // Example prompts based on user role
  const examplePrompts = user?.role === 'league' ? [
    "Find me a certified referee for next Saturday",
    "Schedule a U12 game at Lincoln Field",
    "Show me all open games this week",
  ] : [
    "What games are available near me?",
    "Show my upcoming assignments",
    "Find games this weekend",
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>RefNexus Agent</CardTitle>
              <CardDescription>Ask me anything about scheduling and assignments</CardDescription>
            </div>
          </div>
          {messages.length > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearChat}
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={index}
                  className={cn(
                    'flex',
                    isUser ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-4 py-3',
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium text-primary">RefNexus Agent</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Example prompts (show when only greeting message) */}
        {messages.length === 1 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="space-y-1">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-2 px-3"
                  onClick={() => {
                    setNewMessage(prompt);
                  }}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center">
          Powered by AI • Context-aware assistance
        </p>
      </CardContent>
    </Card>
  );
}
