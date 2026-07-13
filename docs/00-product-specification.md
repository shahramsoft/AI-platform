\# Aspedan AI Platform

Version: 1.0

Status: Draft

Author: Shahram Foroozan

Architecture Owner: Aspedan



\---



\# Vision



Aspedan AI Platform is an enterprise AI platform that enables developers, businesses, and AI agents to collaborate through a unified gateway.



The platform must support both local and cloud LLM providers, execute tools, remember context, retrieve knowledge from repositories, and orchestrate multiple AI agents.



The platform is intended to become the internal AI operating system for Aspedan products including:



\- DiscountPrime

\- TradeHelper

\- Internal Development Tools

\- Azure DevOps

\- Git Repositories

\- Docker Infrastructure



The platform must be modular, provider-independent, and production-ready.



\---



\# Primary Goals



The platform must provide:



\- AI Gateway

\- Local LLM Support

\- Cloud LLM Support

\- Agent Runtime

\- Tool Calling

\- MCP Support

\- Memory

\- RAG

\- Repository Indexing

\- Prompt Management

\- Authentication

\- Observability

\- CLI

\- REST API

\- Future VS Code Extension



\---



\# Design Principles



The project follows these principles:



\- Clean Architecture

\- SOLID

\- Domain Driven Design

\- Hexagonal Architecture

\- Dependency Injection

\- Event Driven Design where applicable

\- Testability

\- Extensibility

\- Provider Independence



\---



\# Core Philosophy



Nothing in the system should depend directly on a specific LLM vendor.



Every provider must implement a common interface.



Business logic must never know whether the request is executed by:



\- Ollama

\- OpenRouter

\- OpenAI

\- Claude

\- Azure OpenAI

\- vLLM

\- llama.cpp



Changing providers must require configuration changes only.



\---



\# Long-Term Vision



Aspedan AI Platform should eventually become capable of:



\- autonomous software development

\- repository understanding

\- code review

\- architecture review

\- project planning

\- Azure DevOps task generation

\- pull request review

\- security review

\- documentation generation

\- test generation

\- deployment assistance



\---



\# Product Modules



The system consists of the following modules.



\## Gateway



Responsibilities



\- REST API

\- Authentication

\- Rate limiting

\- Routing

\- Streaming

\- Provider selection



\---



\## Provider Layer



Responsibilities



\- Abstract every LLM provider

\- Health checking

\- Model discovery

\- Chat

\- Embeddings

\- Vision

\- Audio (future)



Supported providers



\- Ollama

\- OpenRouter

\- OpenAI

\- Azure OpenAI

\- Anthropic

\- vLLM



\---



\## Agent Runtime



Responsibilities



\- Execute agents

\- Agent lifecycle

\- Tool execution

\- Memory integration

\- Planning

\- Multi-agent collaboration



\---



\## Tool Runtime



Responsibilities



\- Execute tools

\- Sandbox execution

\- Permissions

\- Logging



Examples



Filesystem



Git



Docker



Azure DevOps



PostgreSQL



MongoDB



HTTP



Shopify



\---



\## Memory



Responsibilities



Conversation history



Long-term memory



Short-term memory



Summaries



\---



\## RAG



Responsibilities



Repository indexing



Vector search



Embedding generation



Chunking



Document retrieval



\---



\## Prompt Engine



Responsibilities



System prompts



Developer prompts



Agent prompts



Prompt templates



Versioning



\---



\## Observability



Responsibilities



Logging



Tracing



Metrics



Provider latency



Token usage



Cost tracking



Performance monitoring



\---



\# Supported Clients



Open WebUI



CLI



REST API



VS Code Extension (future)



JetBrains Plugin (future)



\---



\# Repository Structure



apps/



gateway



cli



web



libs/



core



providers



agents



tools



memory



rag



prompt-engine



config



shared



docker/



docs/



scripts/



\---



\# Non Functional Requirements



The platform must be



Scalable



Modular



Observable



Testable



Provider independent



Cloud ready



Docker ready



CI/CD ready



Secure



Maintainable



\---



\# Coding Language



Primary language



TypeScript



Strict Mode enabled



\---



\# Runtime



Node.js 22 LTS



\---



\# Package Manager



pnpm



\---



\# Workspace



Nx Monorepo



\---



\# Framework



Fastify



\---



\# Validation



Zod



\---



\# Logging



Pino



\---



\# Testing



Vitest



\---



\# Containerization



Docker



Docker Compose



Future Kubernetes support



\---



\# Documentation



Every feature must include



Documentation



Tests



Examples



Architecture updates if necessary



\---



\# Success Criteria



Version 1.0 must be capable of



Running local models



Running cloud models



Executing tools



Managing conversations



Indexing repositories



Supporting RAG



Supporting MCP



Executing coding agents



Being used daily by Aspedan engineering team



\---



\# Out of Scope (Version 1)



GUI Framework



Mobile App



Distributed Multi-region Deployment



Billing



Marketplace



\---



End of Document

