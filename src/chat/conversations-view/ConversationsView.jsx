import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  selectedConversationAtom,
  conversationMessagesAtomFamily,
  conversationStatusAtom,
  conversationsListAtom,
  loadedConversationsAtom,
  streamingStateAtom,
} from "../../stores/atoms";
import Message from "./Message";
import MessageInput from "./MessageInput";

const ConversationView = () => {
  const { conversationId: routeId } = useParams();
  const navigate = useNavigate();

  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const [status, setStatus] = useRecoilState(conversationStatusAtom);
  const [messages, setMessages] = useRecoilState(
    conversationMessagesAtomFamily(selectedConversation || routeId)
  );
  const [loadedConversations, setLoadedConversations] = useRecoilState(loadedConversationsAtom);
  const [streamingState, setStreamingState] = useRecoilState(streamingStateAtom);
  const setConversations = useSetRecoilState(conversationsListAtom);

  const isNewRoute = routeId === "new";

  // Sync route -> selectedConversationAtom
  useEffect(() => {
    if (isNewRoute) {
      setSelectedConversation(null);
    } else {
      setSelectedConversation(routeId);
    }
  }, [routeId, setSelectedConversation, isNewRoute]);

  // Fetch existing messages if:
  // 1. A conversation is selected
  // 2. It's not a "new" conversation (i.e., it's persisted)
  // 3. Its messages haven't been loaded yet
  useEffect(() => {
    if (
      !selectedConversation ||
      status.newConversations.has(selectedConversation) ||
      loadedConversations.has(selectedConversation)
    ) {
      return;
    }

    fetch(`/api/messages/${selectedConversation}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        // Mark as loaded
        setLoadedConversations(oldSet => new Set(oldSet).add(selectedConversation));
      })
      .catch(console.error);
  }, [
    selectedConversation,
    status.newConversations,
    loadedConversations,
    setMessages,
    setLoadedConversations,
  ]);

  // SSE streaming function
  const startStreaming = (userText, convId, assistantMsg) => {
    const eventSource = new EventSource(
      `/api/chat/completions?message=${encodeURIComponent(userText)}&conversation_id=${convId}`
    );

    setStreamingState({
      isStreaming: true,
      streamingMessageId: assistantMsg.id,
    });

    eventSource.onmessage = (event) => {
      const chunk = event.data;
      if (chunk === "[DONE]") {
        eventSource.close();

        // Mark message as complete
        setMessages(old =>
          old.map(m => m.id === assistantMsg.id ? { ...m, streaming: false } : m)
        );

        setStreamingState({
          isStreaming: false,
          streamingMessageId: null,
        });

        // Finalize conversation: move from "new" to "existing"
        setStatus(oldStatus => {
          const newConversations = new Set(oldStatus.newConversations);
          newConversations.delete(convId);
          const existingConversations = new Set(oldStatus.existingConversations).add(convId);
          return { newConversations, existingConversations };
        });
        
        // Optimistically add to sidebar if it's a new conversation
        setConversations(oldList => {
          if (!oldList.find(c => c.id === convId)) {
            return [
              ...oldList,
              { id: convId, title: userText.slice(0, 30) }
            ];
          }
          return oldList;
        });

        return;
      }

      // Append chunk to assistant message
      setMessages(old =>
        old.map(m => 
          m.id === assistantMsg.id 
            ? { ...m, content: m.content + chunk } 
            : m
        )
      );
    };

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
      eventSource.close();
      
      setMessages(old =>
        old.map(m => 
          m.id === assistantMsg.id 
            ? { ...m, streaming: false, error: true } 
            : m
        )
      );

      setStreamingState({
        isStreaming: false,
        streamingMessageId: null,
      });
    };

    return () => eventSource.close();
  };

  const handleSend = async (userText) => {
    if (!userText.trim() || streamingState.isStreaming) return;

    let convId = selectedConversation;
    let shouldNavigate = false;

    // Handle lazy conversation creation
    if (isNewRoute) {
      convId = crypto.randomUUID();
      shouldNavigate = true;

      // Set active conversation and mark as new
      setSelectedConversation(convId);
      setStatus(oldStatus => ({
        ...oldStatus,
        newConversations: new Set(oldStatus.newConversations).add(convId),
      }));
    }

    // Create optimistic messages
    const userMsg = { 
      id: crypto.randomUUID(), 
      role: "user", 
      content: userText,
      timestamp: new Date().toISOString()
    };
    
    const assistantMsg = { 
      id: crypto.randomUUID(), 
      role: "assistant", 
      content: "", 
      streaming: true,
      timestamp: new Date().toISOString()
    };

    // Add messages to atom immediately
    setMessages(old => [...old, userMsg, assistantMsg]);

    // Navigate to new conversation route if needed
    if (shouldNavigate) {
      navigate(`/chat/${convId}`, { replace: true });
    }

    // Start streaming AI response
    startStreaming(userText, convId, assistantMsg);

    // Persist user message to backend (async)
    fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        conversation_id: convId, 
        message: userMsg 
      }),
    }).catch(console.error);
  };

  // Render new conversation state
  if (!selectedConversation && isNewRoute) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <h2 className="text-xl mb-2">Start a new conversation</h2>
            <p>Type your message below to begin...</p>
          </div>
        </div>
        <MessageInput onSend={handleSend} disabled={streamingState.isStreaming} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(m => <Message key={m.id} message={m} />)
        )}
      </div>
      <MessageInput 
        onSend={handleSend} 
        disabled={streamingState.isStreaming}
      />
    </div>
  );
};

export default ConversationView;