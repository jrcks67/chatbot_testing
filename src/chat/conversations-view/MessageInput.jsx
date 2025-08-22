// import React, { useState } from "react";

// const MessageInput = ({ onSend }) => {
//   const [text, setText] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!text.trim()) return;
//     onSend(text.trim());
//     setText("");
//   };

//   return (
//     <form
//       className="flex p-2 border-t border-gray-300"
//       onSubmit={handleSubmit}
//     >
//       <input
//         type="text"
//         className="flex-1 p-2 border rounded"
//         placeholder="Type a message..."
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//       />
//       <button
//         type="submit"
//         className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
//       >
//         Send
//       </button>
//     </form>
//   );
// };

// export default MessageInput;


// import React, { useState } from "react";
// import { useRecoilValue } from "recoil";
// import { streamingStateAtom } from "../../stores/atoms";

// const MessageInput = ({ onSend }) => {
//   const [text, setText] = useState("");
//   const streamingState = useRecoilValue(streamingStateAtom);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!text.trim()) return;
//     onSend(text.trim());
//     setText("");
//   };

//   return (
//     <form
//       className="flex p-2 border-t border-gray-300"
//       onSubmit={handleSubmit}
//     >
//       <input
//         type="text"
//         className="flex-1 p-2 border rounded"
//         placeholder={
//           streamingState.isStreaming ? "Assistant is typing..." : "Type a message..."
//         }
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         disabled={streamingState.isStreaming} // prevent sending while streaming
//       />
//       <button
//         type="submit"
//         className={`ml-2 px-4 py-2 rounded text-white ${
//           streamingState.isStreaming ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"
//         }`}
//         disabled={streamingState.isStreaming}
//       >
//         Send
//       </button>
//     </form>
//   );
// };

// export default MessageInput;


import React, { useState } from "react";

const MessageInput = ({ onSend, disabled = false }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    
    onSend(text.trim());
    setText(""); // clear input after sending
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form
        className="flex gap-2"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className={`flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
          }`}
          placeholder={disabled ? "AI is responding..." : "Type your message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            disabled || !text.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {disabled ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;