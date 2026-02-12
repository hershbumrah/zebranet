import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationParticipant, Message, RefereeLookup } from '@/types';
import { API_BASE_URL, messagesApi, refsApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface InboxProps {
  className?: string;
}

type ChatUser = {
  user_id: number;
  email: string;
  name?: string;
  role: 'referee' | 'league';
};

export default function Inbox({ className }: InboxProps) {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<ConversationParticipant[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RefereeLookup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isLeague = user?.role === 'league';

  const displayConversations = useMemo(
    () => conversations,
    [conversations]
  );

  const loadConversations = async () => {
    if (!token) return;
    try {
      const data = await messagesApi.getConversations(token);
      setConversations(data);
    } catch (error) {
      toast({
        title: 'Failed to load conversations',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const loadConversation = async (otherUserId: number) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await messagesApi.getConversation(token, otherUserId);
      setMessages(data.reverse());
      await messagesApi.markConversationRead(token, otherUserId);
      await loadConversations();
    } catch (error) {
      toast({
        title: 'Failed to load messages',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!token || !selectedUser || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const sent = await messagesApi.send(token, {
        recipient_id: selectedUser.user_id,
        content,
      });
      setMessages((prev) => [...prev, sent]);
      await loadConversations();
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectConversation = async (participant: ConversationParticipant) => {
    setSelectedUser({
      user_id: participant.user_id,
      email: participant.email,
      name: participant.name,
      role: participant.role,
    });
    await loadConversation(participant.user_id);
  };

  const handleLookup = async () => {
    if (!token || !searchQuery.trim()) return;
    try {
      const results = await refsApi.lookup(token, searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectSearchResult = async (ref: RefereeLookup) => {
    const chatUser: ChatUser = {
      user_id: ref.user_id,
      email: ref.email,
      name: ref.full_name,
      role: 'referee',
    };
    setSelectedUser(chatUser);
    setMessages([]);
    await loadConversation(ref.user_id);
  };

  useEffect(() => {
    loadConversations();
  }, [token]);

  if (!token || !user) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
        <CardDescription>Direct messages between leagues and referees</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          {isLeague && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search refs by name or email"
                />
                <Button size="icon" onClick={handleLookup}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="rounded-md border">
                  <ScrollArea className="h-48">
                    <div className="divide-y">
                      {searchResults.map((ref) => {
                        const imageUrl = ref.profile_image_url
                          ? ref.profile_image_url.startsWith('http')
                            ? ref.profile_image_url
                            : `${API_BASE_URL}${ref.profile_image_url}`
                          : '';
                        return (
                        <button
                          key={ref.user_id}
                          className="w-full text-left px-3 py-2 hover:bg-muted"
                          onClick={() => handleSelectSearchResult(ref)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {imageUrl ? (
                                <AvatarImage src={imageUrl} alt={ref.full_name || ref.email} />
                              ) : null}
                              <AvatarFallback>
                                {(ref.full_name || ref.email || "R").slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">
                                {ref.full_name || ref.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {ref.email}
                                {ref.cert_level ? ` • ${ref.cert_level}` : ''}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          <div className="rounded-md border">
            <div className="px-3 py-2 text-xs text-muted-foreground">Conversations</div>
            <ScrollArea className="h-72">
              <div className="divide-y">
                {displayConversations.length === 0 && (
                  <div className="px-3 py-6 text-sm text-muted-foreground">No conversations yet.</div>
                )}
                {displayConversations.map((participant) => (
                  <button
                    key={participant.user_id}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-muted',
                      selectedUser?.user_id === participant.user_id && 'bg-muted'
                    )}
                    onClick={() => handleSelectConversation(participant)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {participant.name || participant.email}
                      </div>
                      {participant.unread_count > 0 && (
                        <Badge variant="destructive">{participant.unread_count}</Badge>
                      )}
                    </div>
                    {participant.last_message && (
                      <div className="text-xs text-muted-foreground truncate">
                        {participant.last_message}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-md border">
          <div className="px-3 py-2 border-b">
            <div className="font-medium">
              {selectedUser ? selectedUser.name || selectedUser.email : 'Select a conversation'}
            </div>
            {selectedUser && (
              <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
            )}
          </div>

          <ScrollArea className="h-80 px-3 py-3">
            {isLoading && (
              <div className="text-sm text-muted-foreground">Loading messages...</div>
            )}
            {!isLoading && messages.length === 0 && (
              <div className="text-sm text-muted-foreground">No messages yet.</div>
            )}
            <div className="space-y-3">
              {messages.map((message) => {
                const isSent = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={cn('flex', isSent ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                        isSent ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedUser ? 'Type your message...' : 'Select a conversation to start'}
                disabled={!selectedUser}
              />
              <Button type="submit" size="icon" disabled={!selectedUser || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
