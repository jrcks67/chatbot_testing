# React Query Migration Guide for Chat Application

## 1. State Architecture Transformation

### Current Architecture (Recoil)
```javascript
// ❌ OLD: Managing server state with client state library
- selectedConversationAtom        → Client state (keep in Recoil/Zustand)
- conversationMessagesAtomFamily   → Server state (move to React Query)
- conversationsListAtom           → Server state (move to React Query)
- conversationStatusAtom          → Mixed (simplify)
- loadedConversationsAtom         → Not needed (React Query handles caching)
- streamingStateAtom              → Client state (keep)
```

### New Architecture (React Query + Zustand/Recoil)
```javascript
// ✅ NEW: Clear separation of concerns
React Query handles:
- All API calls and caching
- Background refetching
- Optimistic updates
- Error/loading states
- Retry logic

Zustand/Recoil handles:
- selectedConversationId
- UI state (sidebar open/closed)
- Streaming state
- Temporary form state
```

## 2. Core Implementation Changes

### Setup React Query

```javascript
// app.js
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000,        // Keep in cache for 10 minutes
      retry: 3,                       // Retry failed requests 3 times
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,   // Don't refetch on window focus for chat
    },
    mutations: {
      retry: 1,                       // Retry mutations once
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatApplication />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### API Layer (New)

```javascript
// api/chatApi.js
const API_BASE = '/api/v1';

export const chatApi = {
  // Fetch all conversations
  getConversations: async () => {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  // Fetch messages for a conversation
  getMessages: async (conversationId) => {
    const res = await fetch(`${API_BASE}/messages/${conversationId}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  // Create new conversation (returns conversation with first messages)
  createConversation: async ({ message }) => {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstMessage: message }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  // Send message (returns complete message)
  sendMessage: async ({ conversationId, message }) => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  // Stream response (returns ReadableStream)
  streamResponse: async ({ conversationId, messageId }) => {
    const res = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, messageId }),
    });
    if (!res.ok) throw new Error('Failed to start stream');
    return res.body;
  },
};
```

### Custom Hooks Layer

```javascript
// hooks/useConversations.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';

// Fetch all conversations
export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    staleTime: 30000, // Consider fresh for 30 seconds
  });
};

// Fetch messages for a conversation
export const useMessages = (conversationId) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatApi.getMessages(conversationId),
    enabled: !!conversationId && conversationId !== 'new',
    staleTime: Infinity, // Messages don't go stale
  });
};

// Create new conversation with optimistic update
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatApi.createConversation,
    onMutate: async ({ message }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      
      // Snapshot previous value
      const previousConversations = queryClient.getQueryData(['conversations']);
      
      // Optimistically update
      const tempId = `temp-${Date.now()}`;
      const newConversation = {
        id: tempId,
        title: message.slice(0, 30),
        created_at: new Date().toISOString(),
        messages: [
          { id: `temp-msg-1`, role: 'user', content: message },
          { id: `temp-msg-2`, role: 'assistant', content: '', streaming: true }
        ]
      };
      
      queryClient.setQueryData(['conversations'], old => 
        [...(old || []), newConversation]
      );
      
      return { previousConversations, tempId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(['conversations'], context.previousConversations);
      }
    },
    onSuccess: (data, variables, context) => {
      // Replace temp ID with real ID
      queryClient.setQueryData(['conversations'], old =>
        old.map(conv => 
          conv.id === context.tempId ? data.conversation : conv
        )
      );
      
      // Set messages for new conversation
      queryClient.setQueryData(['messages', data.conversation.id], data.messages);
      
      return data.conversation.id;
    },
  });
};

// Send message with optimistic update
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatApi.sendMessage,
    onMutate: async ({ conversationId, message }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      
      // Snapshot
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);
      
      // Optimistic update
      const tempUserMsg = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      
      const tempAssistantMsg = {
        id: `temp-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        streaming: true,
        timestamp: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['messages', conversationId], old => [
        ...(old || []),
        tempUserMsg,
        tempAssistantMsg,
      ]);
      
      return { previousMessages, tempAssistantMsg };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', variables.conversationId], 
          context.previousMessages
        );
      }
      
      // Show error toast
      toast.error('Failed to send message. Retrying...');
    },
    onSuccess: async (data, variables, context) => {
      // Start streaming for assistant response
      const stream = await chatApi.streamResponse({
        conversationId: variables.conversationId,
        messageId: data.assistantMessageId,
      });
      
      // Handle streaming (see streaming section below)
      handleStream(stream, variables.conversationId, context.tempAssistantMsg.id);
    },
  });
};
```

### Component Implementation

```javascript
// components/ConversationView.js
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages, useSendMessage, useCreateConversation } from '../hooks/useConversations';
import { useStreamingState } from '../store/clientState';

export const ConversationView = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const isNewConversation = conversationId === 'new';
  
  // React Query hooks
  const { data: messages = [], isLoading, error } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();
  
  // Client state
  const { isStreaming, setStreaming } = useStreamingState();
  
  const handleSendMessage = async (text) => {
    if (isNewConversation) {
      // Create new conversation
      const result = await createConversation.mutateAsync({ message: text });
      navigate(`/chat/${result}`, { replace: true });
    } else {
      // Send to existing conversation
      await sendMessage.mutateAsync({ 
        conversationId, 
        message: text 
      });
    }
  };
  
  // Beautiful loading state (React Query provides this!)
  if (isLoading) {
    return <MessageSkeleton />;
  }
  
  // Automatic error handling
  if (error) {
    return (
      <ErrorBoundary 
        error={error} 
        retry={() => queryClient.invalidateQueries(['messages', conversationId])}
      />
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <MessageList 
        messages={messages} 
        isStreaming={isStreaming}
      />
      <MessageInput 
        onSend={handleSendMessage}
        disabled={sendMessage.isPending || createConversation.isPending}
      />
    </div>
  );
};
```

### Sidebar with React Query

```javascript
// components/Sidebar.js
import { useConversations } from '../hooks/useConversations';
import { useSelectedConversation } from '../store/clientState';

export const Sidebar = () => {
  const { data: conversations = [], isLoading } = useConversations();
  const { selectedId, setSelectedId } = useSelectedConversation();
  
  // React Query automatically refetches in background!
  // No need for manual refresh logic
  
  return (
    <div className="sidebar">
      <NewChatButton />
      {isLoading ? (
        <ConversationListSkeleton />
      ) : (
        <ConversationList 
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}
    </div>
  );
};
```

## 3. Advanced Streaming with React Query

```javascript
// hooks/useStreamingMessage.js
import { useQueryClient } from '@tanstack/react-query';

export const useStreamingMessage = () => {
  const queryClient = useQueryClient();
  
  const streamMessage = async (stream, conversationId, messageId) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Mark streaming as complete
          queryClient.setQueryData(['messages', conversationId], old =>
            old.map(msg => 
              msg.id === messageId 
                ? { ...msg, streaming: false }
                : msg
            )
          );
          break;
        }
        
        const chunk = decoder.decode(value);
        
        // Update message content incrementally
        queryClient.setQueryData(['messages', conversationId], old =>
          old.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }
    } catch (error) {
      // Handle streaming error
      queryClient.setQueryData(['messages', conversationId], old =>
        old.map(msg => 
          msg.id === messageId 
            ? { ...msg, streaming: false, error: true }
            : msg
        )
      );
      
      throw error;
    }
  };
  
  return { streamMessage };
};
```

## 4. Offline Support & Background Sync

```javascript
// hooks/useOfflineSync.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetworkState } from 'react-use';

export const useOfflineQueue = () => {
  const queryClient = useQueryClient();
  const network = useNetworkState();
  
  // Persist mutations when offline
  const queuedMutations = useQueryClient().getMutationCache();
  
  // Auto-sync when back online
  useEffect(() => {
    if (network.online) {
      // Replay failed mutations
      queuedMutations.getAll().forEach(mutation => {
        if (mutation.state.status === 'error') {
          mutation.revert();
        }
      });
    }
  }, [network.online]);
};
```

## 5. Intelligent Prefetching

```javascript
// Prefetch next likely conversations
export const usePrefetchConversation = () => {
  const queryClient = useQueryClient();
  
  const prefetchMessages = (conversationId) => {
    queryClient.prefetchQuery({
      queryKey: ['messages', conversationId],
      queryFn: () => chatApi.getMessages(conversationId),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  
  // Prefetch on hover
  const handleConversationHover = (conversationId) => {
    prefetchMessages(conversationId);
  };
  
  return { handleConversationHover };
};
```

## 6. Real-time Updates with WebSocket

```javascript
// hooks/useRealtimeSync.js
export const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const ws = new WebSocket('wss://your-api/realtime');
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      if (update.type === 'NEW_MESSAGE') {
        // Invalidate and refetch
        queryClient.invalidateQueries({
          queryKey: ['messages', update.conversationId]
        });
      }
      
      if (update.type === 'CONVERSATION_UPDATED') {
        // Update cache directly
        queryClient.setQueryData(['conversations'], old =>
          old.map(conv => 
            conv.id === update.conversationId 
              ? { ...conv, ...update.data }
              : conv
          )
        );
      }
    };
    
    return () => ws.close();
  }, [queryClient]);
};
```