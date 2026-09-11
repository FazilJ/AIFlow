# AIFlow Backend

AIFlow is an AI-powered customer support SaaS platform built with Node.js, Express, MongoDB, PostgreSQL, Redis, BullMQ, and Google Gemini.

The platform provides AI customer support, tool calling, multi-step workflows, retrieval-augmented generation (RAG), conversation memory, human handoff, support-agent assignment, real-time WebSocket streaming, and secure multi-tenant business isolation.

---

## 🚀 Key Features

### AI Customer Support

- Google Gemini powered AI responses
- Gemini 3.6 Flash
- Multi-step AI agent workflows
- Tool calling
- Structured tool execution
- Retry and failure handling
- AI response guardrails
- Conversation memory
- Redis response caching

### AI Tools

The AI agent can perform actions such as:

- Customer lookup
- Business information lookup
- Appointment booking
- Support ticket creation
- Multi-step customer workflows

### RAG Knowledge Base

AIFlow supports Retrieval-Augmented Generation using:

- MongoDB Atlas Vector Search
- Gemini embeddings
- Knowledge base documents
- Automatic document chunking
- Business-level knowledge isolation

Current embedding model:

```text
gemini-embedding-001