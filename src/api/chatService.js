
// api/chatService.js - Real API integration layer
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const ACCESS_TOKEN = import.meta.env.VITE_ACCESS_TOKEN;

const getAuthHeaders = () => ({
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
});

const getAuthHeadersFormData = () => ({
  'Authorization': `Bearer ${ACCESS_TOKEN}`
});

export const chatAPI = {
  // 1. Load conversations
  getConversations: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/conversations/`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return await response.json();
    } catch (error) {
      console.error('Failed to load conversations:', error);
      throw error;
    }
  },

  // 2. Load messages for conversation
  getMessages: async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/messages/${conversationId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return await response.json();
    } catch (error) {
      console.error('Failed to load messages:', error);
      throw error;
    }
  },

  // 3. Send message (returns response for SSE setup)
  sendMessage: async (messageData) => {
    try {
      const payload = {
        conversation_id: messageData.conversation_id === 'new' ? null : messageData.conversation_id,
        content: messageData.content,
        model: messageData.model || 'gpt-4',
        provider: messageData.provider || 'openai',
        stream: true,
        metadata: {}
      };

      // Add file references to metadata
      if (messageData.resume?.id) {
        payload.metadata.resume_id = messageData.resume.id;
      }
      if (messageData.template?.id) {
        payload.metadata.template_id = messageData.template.id;
      }

      const response = await fetch(`${API_BASE}/api/v1/chat/completions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to send message');
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  // 4. Get templates
  getTemplates: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        active_only: filters.active_only ?? true,
        limit: filters.limit ?? 50,
        offset: filters.offset ?? 0,
        ...(filters.job_title && { job_title: filters.job_title })
      });
      
      const response = await fetch(`${API_BASE}/api/v1/templates/?${queryParams}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return await response.json();
    } catch (error) {
      console.error('Failed to load templates:', error);
      throw error;
    }
  },

  // 5. Get candidates/resumes
  getCandidates: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        limit: filters.limit ?? 50,
        offset: filters.offset ?? 0,
        ...(filters.search && { search: filters.search }),
        ...(filters.skills && { skills: filters.skills }),
        ...(filters.min_experience && { min_experience: filters.min_experience })
      });
      
      const response = await fetch(`${API_BASE}/api/v1/candidates/?${queryParams}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch candidates');
      return await response.json();
    } catch (error) {
      console.error('Failed to load candidates:', error);
      throw error;
    }
  },

  // 6. Upload file
  uploadFile: async (file, type) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch(`${API_BASE}/api/v1/upload/`, {
        method: 'POST',
        headers: getAuthHeadersFormData(),
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload file');
      return await response.json();
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
};