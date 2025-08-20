from fastapi import FastAPI
from typing import List, Optional
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from enum import Enum
from uuid import UUID
import uuid
from openai import OpenAI
from dotenv import load_dotenv
import os
import asyncio

from fastapi import BackgroundTasks

load_dotenv()

# Models
class RoleEnum(str, Enum):
    system = "system"
    user = "user"
    assistant = "assistant"

class Conversations(BaseModel):
    id: UUID
    title: str

class Message(BaseModel):
    id: OopUUID
    conversation_id: UUID
    role: RoleEnum
    content: str


class DataStore():
    def __init__(self):
        self.conversations:List[Conversations] = []
        self.messages:List[Message] = [] 

data = DataStore()

app = FastAPI()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/conserversations", response_model=List[Conversations])
def get_conversations():
    return data.conversations

@app.get("/messages/{conversation_id}", response_model=List[Message])
def get_messages(conversation_id: UUID):
    return [message for message in data.messages if message.conversation_id == conversation_id]

async def event_number_generator():
    for i in range(10):
        yield f"data: {i} \n\n"
        await asyncio.sleep(1)



@app.get("/testing-sse")
async def sse_testing():
    return StreamingResponse(event_number_generator(), media_type="text/event-stream")

def save_message_to_db(conversation_id: UUID, role: RoleEnum, content: str):
    data.messages.append(Message(id=uuid.uuid4(),conversation_id=conversation_id, role=role, content=content))


@app.post("/chat/completions")
def chat_completions(prompt: Message, background_tasks: BackgroundTasks):

    if not prompt.conversation_id in data.conversations:
        data.conversations.append(Conversations(id=uuid.uuid4(), title="Untitled"))
    
    data.messages.append(Message(id=prompt.id, conversation_id=prompt.conversation_id, role=RoleEnum.user, content=prompt.content))

    # llm prompt 
    # 1. get list of messages for a particular conversation id

    conversation_messages = [message for message in data.messages if message.conversation_id == prompt.conversation_id]
    # create the message format needed by openai {role: "user/system/tool/assistant", content:""}
    llm_prompt = []
    # adding the system prompt 
    llm_prompt.append({
        "role": RoleEnum.system.value,
        "content": "You are a helpful assistant"
    })
    for message in conversation_messages:
        llm_prompt.append({
            "role": message.role.value,
            "content": message.content
        })

  
    llm_response = client.chat.completions.create(model="gpt-4o",messages=llm_prompt, stream=True)

    full_response=[""]
    def event_generator():
        for chunk in llm_response:
            delta = chunk.choices[0].delta
            if delta.content:
                full_response[0] += delta.content
                yield f"data: {delta.content}\n\n" # SSE requires this format
    
    background_tasks.add_task(save_message_to_db, prompt.conversation_id, RoleEnum.assistant, full_response[0])

    return StreamingResponse(event_generator(), media_type="text/event-stream")



