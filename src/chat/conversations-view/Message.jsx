import React from "react";

const Message = ({ message }) => {
  return (
    <div
      className={`my-2 p-2 rounded ${
        message.role === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
      }`}
    >
      <div className="text-sm text-gray-700">
        {message.content}
        {message.streaming && <span className="blinking-cursor">|</span>}
      </div>
    </div>
  );
};

export default Message;
