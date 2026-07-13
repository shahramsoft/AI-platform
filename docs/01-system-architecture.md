\# Aspedan AI Platform

\# System Architecture



Version: 1.0

Status: Draft



\---



\# Purpose



This document defines the high-level architecture of Aspedan AI Platform.



The architecture must remain provider-independent, modular, testable, and scalable.



\---



\# Architectural Style



The platform follows:



\- Clean Architecture

\- Hexagonal Architecture

\- Domain Driven Design

\- Dependency Injection

\- Event Driven Principles (where applicable)



\---



\# High Level Architecture



&#x20;                       Clients

&#x20;                           │

&#x20;       ┌───────────────────┼────────────────────┐

&#x20;       │                   │                    │

&#x20;   Open WebUI             CLI               VS Code

&#x20;       │                   │                    │

&#x20;       └───────────────────┼────────────────────┘

&#x20;                           │

&#x20;                   AI Gateway API

&#x20;                           │

&#x20;       ┌───────────────────┼───────────────────┐

&#x20;       │                   │                   │

&#x20;    Chat Service      Agent Runtime      Memory Service

&#x20;       │                   │                   │

&#x20;       └───────────────────┼───────────────────┘

&#x20;                           │

&#x20;                   Provider Factory

&#x20;                           │

&#x20;       ┌───────────────────┼────────────────────┐

&#x20;       │                   │                    │

&#x20;     Ollama           OpenRouter          OpenAI

&#x20;       │

&#x20;       ▼

&#x20;    Models



\---



\# Architectural Layers



The platform contains five major layers.



1\. Presentation Layer

2\. Application Layer

3\. Domain Layer

4\. Infrastructure Layer

5\. External Systems



\---



\# Presentation Layer



Responsibilities



\- HTTP APIs

\- Authentication

\- Validation

\- Serialization



Examples



\- Fastify Routes

\- REST Controllers

\- CLI Commands



Rules



\- No business logic allowed

\- No provider calls allowed

\- No database access allowed



Presentation layer only delegates requests.



\---



\# Application Layer



Responsibilities



\- Use Cases

\- Workflows

\- Orchestration



Examples



\- Chat Service

\- Agent Service

\- Memory Service

\- Tool Service



Rules



\- May call domain layer

\- May call infrastructure abstractions

\- Must not call providers directly



\---



\# Domain Layer



Responsibilities



\- Business Rules

\- Interfaces

\- Contracts

\- Domain Models



Examples



ChatRequest



ChatResponse



Agent



Tool



Memory



Provider



Rules



\- No HTTP

\- No Database

\- No Framework Dependencies

\- Pure TypeScript



The domain layer must remain framework independent.



\---



\# Infrastructure Layer



Responsibilities



\- Ollama Integration

\- OpenAI Integration

\- OpenRouter Integration

\- MongoDB

\- PostgreSQL

\- Elasticsearch



Examples



OllamaProvider



OpenAIProvider



GitTool



FilesystemTool



DockerTool



Rules



Infrastructure implements interfaces defined in domain.



Never the opposite.



\---



\# Dependency Direction



Allowed



Presentation

&#x20;   ↓



Application

&#x20;   ↓



Domain



Infrastructure

&#x20;   ↓



Domain



Not Allowed



Domain

&#x20;   ↓

Infrastructure



Domain

&#x20;   ↓

Presentation



Application

&#x20;   ↓

Presentation



\---



\# Gateway Architecture



Gateway is the entry point of the platform.



Responsibilities



\- Routing

\- Authentication

\- Request Validation

\- Logging

\- Streaming

\- Rate Limiting



Gateway must not contain business logic.



Gateway delegates requests to services.



\---



\# Provider Architecture



Every provider must implement AIProvider.



Example



AIProvider



├── OllamaProvider

├── OpenAIProvider

├── OpenRouterProvider

├── ClaudeProvider

└── AzureProvider



The rest of the platform must never know which provider is executing the request.



\---



\# Provider Factory



Provider creation must be centralized.



Bad



new OllamaProvider()



Good



ProviderFactory.create()



Benefits



\- Provider switching

\- Easier testing

\- Configuration driven



\---



\# Agent Architecture



Agent Runtime manages all agents.



Agent



├── Planner Agent

├── Coding Agent

├── Review Agent

├── Documentation Agent

└── Deployment Agent



Every agent implements Agent interface.



\---



\# Tool Architecture



Every tool implements Tool interface.



Tool



├── Filesystem Tool

├── Git Tool

├── Docker Tool

├── PostgreSQL Tool

├── MongoDB Tool

├── Shopify Tool

└── Azure DevOps Tool



Tools must be independent.



Tools may not call each other directly.



All execution goes through Tool Runtime.



\---



\# Memory Architecture



Memory consists of



Short Term Memory



Long Term Memory



Conversation Memory



Summary Memory



Memory Provider



Future providers



\- PostgreSQL

\- MongoDB

\- Redis



\---



\# RAG Architecture



Pipeline



Documents



↓



Chunking



↓



Embeddings



↓



Vector Store



↓



Retrieval



↓



Context Injection



↓



LLM



\---



\# Repository Intelligence



Repository indexing must support



Source Code



Markdown



Architecture Documents



ADR Documents



Pull Requests



Git History



Issues



Azure DevOps Work Items



\---



\# MCP Architecture



MCP acts as integration layer.



MCP Server



↓



Tool Runtime



↓



External Systems



Examples



GitHub



Azure DevOps



Shopify



Slack



Jira



PostgreSQL



MongoDB



\---



\# Configuration Architecture



Configuration must be centralized.



Sources



Environment Variables



Config Files



Secret Providers



Rules



No hardcoded URLs



No hardcoded secrets



\---



\# Observability Architecture



Every operation must be observable.



Metrics



Provider latency



Request count



Token usage



Agent execution time



Tool execution time



Errors



Tracing



Request lifecycle



Provider lifecycle



Agent lifecycle



\---



\# Security Architecture



Authentication



Authorization



Input Validation



Rate Limiting



Audit Logs



Secret Management



Future



RBAC



SSO



OIDC



\---



\# Deployment Architecture



Phase 1



Docker Compose



Phase 2



Kubernetes



Phase 3



Multi-Node Deployment



\---



\# Future Architecture



Multi Agent Collaboration



Distributed Memory



Distributed RAG



Autonomous Planning



Autonomous Coding



Repository Understanding



Architecture Understanding



Business Understanding



\---



\# Architecture Principles



Principle 1



Business logic never depends on provider.



Principle 2



Domain layer never depends on framework.



Principle 3



Provider switching requires configuration only.



Principle 4



All integrations go through abstractions.



Principle 5



Every component must be testable.



Principle 6



Everything must be observable.



Principle 7



Everything must be replaceable.



\---



\# Definition of Done



Architecture is considered successful when:



\- Providers are interchangeable

\- Agents are interchangeable

\- Tools are interchangeable

\- Clients are interchangeable

\- Tests can run without external systems

\- No business logic exists in gateway

\- Domain remains framework independent



End of Document

