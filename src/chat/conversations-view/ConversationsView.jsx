import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil";
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
  const { conversationId: routeId } = useParams(); // "/chat/:conversationId"
  const navigate = useNavigate();

  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const [status, setStatus] = useRecoilState(conversationStatusAtom);
  const [messages, setMessages] = useRecoilState(
    conversationMessagesAtomFamily(selectedConversation || routeId)
  );
  const [loadedConversations, setLoadedConversations] = useRecoilState(
    loadedConversationsAtom
  );
  const [streamingState, setStreamingState] = useRecoilState(streamingStateAtom);
  const setConversations = useSetRecoilState(conversationsListAtom);

  // Determine if this is a "new" conversation route
  const isNewRoute = routeId === "new";
  const isFrontendNewConversation =
    !isNewRoute && status.newConversations.has(selectedConversation);

  // Sync route -> selectedConversationAtom
  useEffect(() => {
    if (isNewRoute) {
      setSelectedConversation(null);
    } else {
      setSelectedConversation(routeId);
    }
  }, [routeId, setSelectedConversation, isNewRoute]);

  // Fetch existing messages if not new and not already loaded
  useEffect(() => {
    if (!selectedConversation || isNewRoute) return;
    
    // Check if already loaded to prevent redundant API calls
    if (loadedConversations.includes(selectedConversation)) return;

    fetch(`/api/v1/messages/${selectedConversation}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        // Mark as loaded
        setLoadedConversations((old) => [...old, selectedConversation]);
      })
      .catch(console.error);
  }, [selectedConversation, setMessages, isNewRoute, loadedConversations, setLoadedConversations]);

  // Send message + handle lazy creation + streaming
  const handleSend = async (userText) => {
    if (!userText.trim()) return;

    let convId = selectedConversation;
    let shouldNavigate = false;

    // Lazy creation for /new route
    if (isNewRoute) {
      convId = crypto.randomUUID();
      shouldNavigate = true;
      
      setSelectedConversation(convId);
      setStatus((old) => ({
        ...old,
        newConversations: new Set(old.newConversations).add(convId),
      }));
    }

    const userMsg = { id: crypto.randomUUID(), role: "user", content: userText };
    const assistantMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      streaming: true,
    };

    // Set up optimistic UI first
    setMessages((old) => [...old, userMsg, assistantMsg]);

    // Set streaming state
    setStreamingState({
      isStreaming: true,
      streamingMessageId: assistantMsg.id,
    });

    // Navigate AFTER setting up UI
    if (shouldNavigate) {
      navigate(`/chat/${convId}`, { replace: true });
    }

    // Backend streaming
    try {
      const response = await fetch(`/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, conversation_id: convId }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages((old) =>
            old.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      }

      // Mark assistant message finished
      setMessages((old) =>
        old.map((m) =>
          m.id === assistantMsg.id ? { ...m, streaming: false } : m
        )
      );

      // Clear streaming state
      setStreamingState({
        isStreaming: false,
        streamingMessageId: null,
      });

      // Move conversation to existing
      setStatus((old) => {
        const newSet = new Set(old.newConversations);
        newSet.delete(convId);
        const existingSet = new Set(old.existingConversations).add(convId);
        return { ...old, newConversations: newSet, existingConversations: existingSet };
      });

      // Add to sidebar if missing
      setConversations((old) => {
        if (!old.find((c) => c.id === convId)) {
          return [...old, { id: convId, title: userText.slice(0, 30) }];
        }
        return old;
      });
    } catch (err) {
      console.error(err);
      // Clear streaming state on error
      setStreamingState({
        isStreaming: false,
        streamingMessageId: null,
      });
    }
  };

  if (!selectedConversation && isNewRoute) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex-1 text-gray-400">
          Start typing to create a new conversation...
        </div>
        <MessageInput onSend={handleSend} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-gray-400">No messages yet.</div>
        ) : (
          messages.map((m) => <Message key={m.id} message={m} />)
        )}
      </div>
      <MessageInput onSend={handleSend} />
    </div>
  );
};

export default ConversationView;