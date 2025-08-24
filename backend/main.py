import asyncio
import os
import uuid
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()


# --- Pydantic Models ---
class Conversation(BaseModel):
    id: uuid.UUID
    title: str

class Message(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str # "user" or "assistant"
    content: str
    timestamp: str

class SendMessageRequest(BaseModel):
    conversation_id: uuid.UUID
    message: Message

# --- In-Memory Data Store ---
class DataStore:
    def __init__(self):
        self.conversations: List[Conversation] = []
        self.messages: List[Message] = []

data_store = DataStore()

# --- FastAPI App Initialization ---
app = FastAPI()

# --- OpenAI Client ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API Endpoints ---
@app.get("/api/conversations", response_model=List[Conversation])
async def get_conversations():
    """Fetch all conversations for the sidebar."""
    return data_store.conversations

@app.get("/api/messages/{conversation_id}", response_model=List[Message])
async def get_messages(conversation_id: uuid.UUID):
    """Fetch all messages for a given conversation."""
    return [
        msg for msg in data_store.messages if msg.conversation_id == conversation_id
    ]

@app.post("/api/chat/send")
async def send_message(req: SendMessageRequest):
    """
    Persist a user's message to the data store.
    This is called right after the user sends a message.
    """
    # Check if conversation exists, if not, create it
    if not any(c.id == req.conversation_id for c in data_store.conversations):
        # The title is created optimistically on the frontend
        # We can update it here if needed, or just create a placeholder
        new_conv = Conversation(id=req.conversation_id, title=req.message.content[:30])
        data_store.conversations.insert(0, new_conv)
    
    data_store.messages.append(req.message)
    return {"status": "ok"}


@app.get("/api/chat/completions")
async def chat_completions(message: str, conversation_id: str):
    """
    This endpoint is for streaming back the AI's response.
    """
    conv_id = uuid.UUID(conversation_id)

    # Get the message history for the conversation
    conversation_messages = [
        msg for msg in data_store.messages if msg.conversation_id == conv_id
    ]

    # Format messages for the OpenAI API
    llm_prompt = [{"role": "system", "content": "You are a helpful assistant."}]
    for msg in conversation_messages:
        llm_prompt.append({"role": msg.role, "content": msg.content})

    async def event_generator():
        try:
            stream = client.chat.completions.create(
                model="gpt-4o",
                messages=llm_prompt,
                stream=True,
            )

            assistant_response_content = ""
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    content_chunk = delta.content
                    assistant_response_content += content_chunk
                    yield f"data: {content_chunk}\n\n"

            # Once streaming is done, save the full assistant message
            assistant_message = Message(
                id=uuid.uuid4(),
                conversation_id=conv_id,
                role="assistant",
                content=assistant_response_content,
                timestamp=str(uuid.uuid4()) # Placeholder, ideally use a proper timestamp
            )
            data_store.messages.append(assistant_message)

        except Exception as e:
            print(f"Error during streaming: {e}")
        finally:
            # Signal the end of the stream to the client
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# To run this app:
# uvicorn main:app --reload
