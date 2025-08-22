// import React from "react";

// const Message = ({ message }) => {
//   return (
//     <div
//       className={`my-2 p-2 rounded ${
//         message.role === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
//       }`}
//     >
//       <div className="text-sm text-gray-700">
//         {message.content}
//         {message.streaming && <span className="blinking-cursor">|</span>}
//       </div>
//     </div>
//   );
// };

// export default Message;


// import React from "react";

// const Message = ({ message }) => {
//   return (
//     <div
//       className={`my-2 p-2 rounded max-w-[75%] ${
//         message.role === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
//       }`}
//     >
//       <div className="text-sm text-gray-700">
//         {message.content}
//         {message.streaming && <span className="blinking-cursor">|</span>}
//       </div>
//     </div>
//   );
// };

// export default Message;


import React from "react";

const Message = ({ message }) => {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div 
        className={`max-w-[80%] p-4 rounded-lg ${
          isUser 
            ? "bg-blue-500 text-white rounded-br-sm" 
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        }`}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {message.streaming && (
            <span className="inline-block w-2 h-5 bg-current opacity-75 animate-pulse ml-1">
              |
            </span>
          )}
        </div>

        {/* Error state */}
        {message.error && (
          <div className="mt-2 text-red-500 text-sm">
            ⚠️ Failed to send message
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div className={`text-xs mt-2 opacity-70 ${
            isUser ? "text-blue-100" : "text-gray-500"
          }`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
