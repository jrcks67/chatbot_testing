import React, { useState } from "react";

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form
      className="flex p-2 border-t border-gray-300"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        className="flex-1 p-2 border rounded"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput;
