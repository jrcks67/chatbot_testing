// import React, { useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useRecoilValue, useRecoilState, useSetRecoilState } from "recoil";
// import {
//   selectedConversationAtom,
//   conversationMessagesAtomFamily,
//   conversationStatusAtom,
//   conversationsListAtom,
//   loadedConversationsAtom,
//   streamingStateAtom,
// } from "../../stores/atoms";
// import Message from "./Message";
// import MessageInput from "./MessageInput";

// const ConversationView = () => {
//   const { conversationId: routeId } = useParams(); // "/chat/:conversationId"
//   const navigate = useNavigate();

//   const [selectedConversation, setSelectedConversation] = useRecoilState(
//     selectedConversationAtom
//   );
//   const [status, setStatus] = useRecoilState(conversationStatusAtom);
//   const [messages, setMessages] = useRecoilState(
//     conversationMessagesAtomFamily(selectedConversation || routeId)
//   );
//   const [loadedConversations, setLoadedConversations] = useRecoilState(
//     loadedConversationsAtom
//   );
//   const [streamingState, setStreamingState] = useRecoilState(streamingStateAtom);
//   const setConversations = useSetRecoilState(conversationsListAtom);

//   // Determine if this is a "new" conversation route
//   const isNewRoute = routeId === "new";
//   const isFrontendNewConversation =
//     !isNewRoute && status.newConversations.has(selectedConversation);

//   // Sync route -> selectedConversationAtom
//   useEffect(() => {
//     if (isNewRoute) {
//       setSelectedConversation(null);
//     } else {
//       setSelectedConversation(routeId);
//     }
//   }, [routeId, setSelectedConversation, isNewRoute]);

//   // Fetch existing messages if not new and not already loaded
//   useEffect(() => {
//     if (!selectedConversation || isNewRoute) return;
    
//     // Check if already loaded to prevent redundant API calls
//     if (loadedConversations.includes(selectedConversation)) return;

//     fetch(`/messages/${selectedConversation}`)
//       .then((res) => res.json())
//       .then((data) => {
//         setMessages(data);
//         // Mark as loaded
//         setLoadedConversations((old) => [...old, selectedConversation]);
//       })
//       .catch(console.error);
//   }, [selectedConversation, setMessages, isNewRoute, loadedConversations, setLoadedConversations]);


// const handleSend = async (userText) => {
//   if (!userText.trim()) return;

//   let convId = selectedConversation;
//   let shouldNavigate = false;

//   // Lazy creation for /new route
//   if (isNewRoute) {
//     convId = crypto.randomUUID();
//     shouldNavigate = true;

//     setSelectedConversation(convId);
//     setStatus((old) => ({
//       ...old,
//       newConversations: new Set(old.newConversations).add(convId),
//     }));
//   }

//   const userMsg = { id: crypto.randomUUID(), role: "user", content: userText };
//   const assistantMsg = {
//     id: crypto.randomUUID(),
//     role: "assistant",
//     content: "",
//     streaming: true,
//   };

//   // Optimistic UI
//   setMessages((old) => [...old, userMsg, assistantMsg]);

//   // Set streaming state
//   setStreamingState({
//     isStreaming: true,
//     streamingMessageId: assistantMsg.id,
//   });

//   if (shouldNavigate) {
//     navigate(`/chat/${convId}`, { replace: true });
//   }

//   // 🚀 Trigger streaming via SSE
//   startStreaming(userText, convId, assistantMsg);

//   // Move conversation to "existing"
//   setStatus((old) => {
//     const newSet = new Set(old.newConversations);
//     newSet.delete(convId);
//     const existingSet = new Set(old.existingConversations).add(convId);
//     return {
//       ...old,
//       newConversations: newSet,
//       existingConversations: existingSet,
//     };
//   });

//   // Add to sidebar if missing
//   setConversations((old) => {
//     if (!old.find((c) => c.id === convId)) {
//       return [...old, { id: convId, title: userText.slice(0, 30) }];
//     }
//     return old;
//   });
// };

//   // Send message + handle lazy creation + streaming
// //   const handleSend = async (userText) => {
// //     if (!userText.trim()) return;

// //     let convId = selectedConversation;
// //     let shouldNavigate = false;

// //     // Lazy creation for /new route
// //     if (isNewRoute) {
// //       convId = crypto.randomUUID();
// //       shouldNavigate = true;
      
// //       setSelectedConversation(convId);
// //       setStatus((old) => ({
// //         ...old,
// //         newConversations: new Set(old.newConversations).add(convId),
// //       }));
// //     }

// //     const userMsg = { id: crypto.randomUUID(), role: "user", content: userText };
// //     const assistantMsg = {
// //       id: crypto.randomUUID(),
// //       role: "assistant",
// //       content: "",
// //       streaming: true,
// //     };

// //     // Set up optimistic UI first
// //     setMessages((old) => [...old, userMsg, assistantMsg]);

// //     // Set streaming state
// //     setStreamingState({
// //       isStreaming: true,
// //       streamingMessageId: assistantMsg.id,
// //     });

// //     // Navigate AFTER setting up UI
// //     if (shouldNavigate) {
// //       navigate(`/chat/${convId}`, { replace: true });
// //     }

// //     // Backend streaming
// //     try {
// //       const response = await fetch(`/chat/completions`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ message: userText, conversation_id: convId }),
// //       });

// //       if (!response.body) return;

// //       const reader = response.body.getReader();
// //       const decoder = new TextDecoder("utf-8");
// //       let done = false;

// //       while (!done) {
// //         const { value, done: doneReading } = await reader.read();
// //         done = doneReading;
// //         if (value) {
// //           const chunk = decoder.decode(value, { stream: true });
// //           setMessages((old) =>
// //             old.map((m) =>
// //               m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m
// //             )
// //           );
// //         }
// //       }

// //       // Mark assistant message finished
// //       setMessages((old) =>
// //         old.map((m) =>
// //           m.id === assistantMsg.id ? { ...m, streaming: false } : m
// //         )
// //       );

// //       // Clear streaming state
// //       setStreamingState({
// //         isStreaming: false,
// //         streamingMessageId: null,
// //       });

// //       // Move conversation to existing
// //       setStatus((old) => {
// //         const newSet = new Set(old.newConversations);
// //         newSet.delete(convId);
// //         const existingSet = new Set(old.existingConversations).add(convId);
// //         return { ...old, newConversations: newSet, existingConversations: existingSet };
// //       });

// //       // Add to sidebar if missing
// //       setConversations((old) => {
// //         if (!old.find((c) => c.id === convId)) {
// //           return [...old, { id: convId, title: userText.slice(0, 30) }];
// //         }
// //         return old;
// //       });
// //     } catch (err) {
// //       console.error(err);
// //       // Clear streaming state on error
// //       setStreamingState({
// //         isStreaming: false,
// //         streamingMessageId: null,
// //       });
// //     }
// //   };
// // Streaming with EventSource
// const startStreaming = (userText, convId, assistantMsg) => {
//   const eventSource = new EventSource(`/chat/completions?message=${encodeURIComponent(userText)}&conversation_id=${convId}`);

//   // Each "data:" line from server will fire this
//   eventSource.onmessage = (event) => {
//     const chunk = event.data; // server-sent chunk
//     if (chunk === "[DONE]") {
//       // Close the connection
//       eventSource.close();

//       // Mark assistant message finished
//       setMessages((old) =>
//         old.map((m) =>
//           m.id === assistantMsg.id ? { ...m, streaming: false } : m
//         )
//       );

//       setStreamingState({
//         isStreaming: false,
//         streamingMessageId: null,
//       });

//       return;
//     }

//     // Append streamed content
//     setMessages((old) =>
//       old.map((m) =>
//         m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m
//       )
//     );
//   };

//   eventSource.onerror = (err) => {
//     console.error("SSE error:", err);
//     eventSource.close();
//     setStreamingState({
//       isStreaming: false,
//       streamingMessageId: null,
//     });
//   };
// };


//   if (!selectedConversation && isNewRoute) {
//     return (
//       <div className="flex flex-col h-full p-4">
//         <div className="flex-1 text-gray-400">
//           Start typing to create a new conversation...
//         </div>
//         <MessageInput onSend={handleSend} />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex-1 overflow-y-auto p-4">
//         {messages.length === 0 ? (
//           <div className="text-gray-400">No messages yet.</div>
//         ) : (
//           messages.map((m) => <Message key={m.id} message={m} />)
//         )}
//       </div>
//       <MessageInput onSend={handleSend} />
//     </div>
//   );
// };

// export default ConversationView;



// import React, { useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useRecoilState, useSetRecoilState } from "recoil";
// import {
//   selectedConversationAtom,
//   conversationMessagesAtomFamily,
//   conversationStatusAtom,
//   conversationsListAtom,
//   loadedConversationsAtom,
//   streamingStateAtom,
// } from "../../stores/atoms";
// import Message from "./Message";
// import MessageInput from "./MessageInput";

// const ConversationView = () => {
//   const { conversationId: routeId } = useParams(); // "/chat/:conversationId"
//   const navigate = useNavigate();

//   const [selectedConversation, setSelectedConversation] = useRecoilState(
//     selectedConversationAtom
//   );
//   const [status, setStatus] = useRecoilState(conversationStatusAtom);
//   const [messages, setMessages] = useRecoilState(
//     conversationMessagesAtomFamily(selectedConversation || routeId)
//   );
//   const [loadedConversations, setLoadedConversations] = useRecoilState(
//     loadedConversationsAtom
//   );
//   const [streamingState, setStreamingState] = useRecoilState(streamingStateAtom);
//   const setConversations = useSetRecoilState(conversationsListAtom);

//   // Determine if this is a "new" conversation route
//   const isNewRoute = routeId === "new";

//   // Sync route -> selectedConversationAtom
//   useEffect(() => {
//     if (isNewRoute) {
//       setSelectedConversation(null);
//     } else {
//       setSelectedConversation(routeId);
//     }
//   }, [routeId, setSelectedConversation, isNewRoute]);

//   // Fetch existing messages if not new and not already loaded
//   useEffect(() => {
//     if (!selectedConversation || isNewRoute) return;

//     if (loadedConversations.includes(selectedConversation)) return;

//     fetch(`/messages/${selectedConversation}`)
//       .then((res) => res.json())
//       .then((data) => {
//         setMessages(data);
//         setLoadedConversations((old) => [...old, selectedConversation]);
//       })
//       .catch(console.error);
//   }, [
//     selectedConversation,
//     setMessages,
//     isNewRoute,
//     loadedConversations,
//     setLoadedConversations,
//   ]);

//   // SSE streaming function
//   const startStreaming = (userText, convId, assistantMsg) => {
//     const eventSource = new EventSource(
//       `/chat/completions?message=${encodeURIComponent(
//         userText
//       )}&conversation_id=${convId}`
//     );

//     eventSource.onmessage = (event) => {
//       const chunk = event.data;
//       if (chunk === "[DONE]") {
//         eventSource.close();

//         setMessages((old) =>
//           old.map((m) =>
//             m.id === assistantMsg.id ? { ...m, streaming: false } : m
//           )
//         );

//         setStreamingState({
//           isStreaming: false,
//           streamingMessageId: null,
//         });

//         return;
//       }

//       setMessages((old) =>
//         old.map((m) =>
//           m.id === assistantMsg.id
//             ? { ...m, content: m.content + chunk }
//             : m
//         )
//       );
//     };

//     eventSource.onerror = (err) => {
//       console.error("SSE error:", err);
//       eventSource.close();
//       setStreamingState({
//         isStreaming: false,
//         streamingMessageId: null,
//       });
//     };

//     // Optional cleanup when component unmounts or new send starts
//     return () => eventSource.close();
//   };

//   const handleSend = async (userText) => {
//     if (!userText.trim()) return;

//     let convId = selectedConversation;
//     let shouldNavigate = false;

//     if (isNewRoute) {
//       convId = crypto.randomUUID();
//       shouldNavigate = true;

//       setSelectedConversation(convId);
//       setStatus((old) => ({
//         ...old,
//         newConversations: new Set(old.newConversations).add(convId),
//       }));
//     }

//     const userMsg = { id: crypto.randomUUID(), role: "user", content: userText };
//     const assistantMsg = {
//       id: crypto.randomUUID(),
//       role: "assistant",
//       content: "",
//       streaming: true,
//     };

//     setMessages((old) => [...old, userMsg, assistantMsg]);

//     setStreamingState({
//       isStreaming: true,
//       streamingMessageId: assistantMsg.id,
//     });

//     if (shouldNavigate) {
//       navigate(`/chat/${convId}`, { replace: true });
//     }

//     // Trigger streaming
//     startStreaming(userText, convId, assistantMsg);

//     // Move conversation to "existing"
//     setStatus((old) => {
//       const newSet = new Set(old.newConversations);
//       newSet.delete(convId);
//       const existingSet = new Set(old.existingConversations).add(convId);
//       return {
//         ...old,
//         newConversations: newSet,
//         existingConversations: existingSet,
//       };
//     });

//     // Add to sidebar if missing
//     setConversations((old) => {
//       if (!old.find((c) => c.id === convId)) {
//         return [...old, { id: convId, title: userText.slice(0, 30) }];
//       }
//       return old;
//     });
//   };

//   if (!selectedConversation && isNewRoute) {
//     return (
//       <div className="flex flex-col h-full p-4">
//         <div className="flex-1 text-gray-400">
//           Start typing to create a new conversation...
//         </div>
//         <MessageInput onSend={handleSend} />
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex-1 overflow-y-auto p-4">
//         {messages.length === 0 ? (
//           <div className="text-gray-400">No messages yet.</div>
//         ) : (
//           messages.map((m) => <Message key={m.id} message={m} />)
//         )}
//       </div>
//       <MessageInput onSend={handleSend} />
//     </div>
//   );
// };

// export default ConversationView;



// UI reads from atom only.

// Backend is updated per message.

// Server sync is only needed on:

// Initial load (React Query)

// Page reload / reconnect (React Query refetch)
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil";
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

// Track newly generated conversation IDs to avoid fetching them
const newlyGeneratedIds = new Set();

const generateConversationId = () => {
  const id = crypto.randomUUID();
  newlyGeneratedIds.add(id);
  return id;
};

const isNewUUID = (convId) => newlyGeneratedIds.has(convId);

const markConversationPersisted = (convId) => {
  newlyGeneratedIds.delete(convId);
};

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
  const conversations = useRecoilValue(conversationsListAtom);
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

  // Fetch existing messages only if:
  // 1. Not a new route
  // 2. Not a newly generated UUID (local conversation)
  // 3. Conversation exists in sidebar (persisted)
  // 4. Not already loaded
  useEffect(() => {
    if (!selectedConversation || isNewRoute) return;

    // Skip fetch for newly generated UUIDs
    if (isNewUUID(selectedConversation)) return;

    // Skip fetch if conversation doesn't exist in sidebar yet
    const isInSidebar = conversations.find(c => c.id === selectedConversation);
    if (!isInSidebar) return;

    // Skip fetch if already loaded
    if (loadedConversations.includes(selectedConversation)) return;

    fetch(`/api/messages/${selectedConversation}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoadedConversations(old => [...old, selectedConversation]);
      })
      .catch(console.error);
  }, [
    selectedConversation,
    setMessages,
    isNewRoute,
    loadedConversations,
    setLoadedConversations,
    conversations
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

        // Mark conversation as persisted and refresh sidebar
        markConversationPersisted(convId);
        
        // Refresh sidebar to show the new persisted conversation
        fetch("/api/conversations")
          .then(res => res.json())
          .then(data => setConversations(data))
          .catch(console.error);

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
      
      // Mark message as failed
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
    if (!userText.trim()) return;

    let convId = selectedConversation;
    let shouldNavigate = false;

    // Generate new conversation ID for /new route
    if (isNewRoute) {
      convId = generateConversationId();
      shouldNavigate = true;
      setSelectedConversation(convId);
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