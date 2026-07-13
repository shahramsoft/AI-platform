\# Aspedan AI Platform

\# Folder Structure



Version: 1.0



\---



\# Purpose



This document defines the physical structure of the repository.



Every source file must belong to a well-defined module.



No file should exist without a clear architectural responsibility.



\---



\# Repository Layout



```

AspedanAIPlatform/



├── apps/

├── libs/

├── docker/

├── docs/

├── scripts/

├── tools/

├── .github/

├── package.json

├── nx.json

├── tsconfig.base.json

├── pnpm-workspace.yaml

└── README.md

```



\---



\# apps/



Applications are executable entry points.



Applications may reference libraries.



Libraries may never reference applications.



Applications must remain thin.



Applications contain no business logic.



\---



\## apps/gateway



Responsibilities



\- Fastify Server

\- REST API

\- Authentication

\- Request Validation

\- Streaming

\- Provider Routing



Contains



```

gateway/



src/



routes/



controllers/



plugins/



middlewares/



config/



main.ts

```



\---



\## apps/cli



Responsibilities



Developer CLI



Examples



```

ai chat



ai models



ai doctor



ai memory



ai index

```



\---



\## apps/web



Future dashboard.



No business logic.



\---



\# libs/



Everything reusable belongs inside libs.



Libraries must never depend on applications.



\---



\# libs/core



Contains



Pure domain models.



Examples



```

ChatRequest



ChatResponse



Agent



Tool



Provider



Memory



Errors



Events

```



Rules



No HTTP



No Fastify



No MongoDB



No Ollama



Pure TypeScript only.



\---



\# libs/providers



Contains provider implementations.



Examples



```

ollama



openrouter



openai



anthropic



azure



vllm

```



Each provider must implement



AIProvider



\---



\# libs/gateway



Contains reusable gateway services.



Examples



```

Authentication



Streaming



Validation



Serialization



ProviderResolver

```



\---



\# libs/agents



Contains agent implementations.



Examples



```

PlannerAgent



CodingAgent



ReviewAgent



ArchitectureAgent



DocumentationAgent



DeploymentAgent

```



Every agent implements



Agent interface.



\---



\# libs/tools



Contains tool implementations.



Examples



Filesystem



Git



Docker



Shell



HTTP



MongoDB



PostgreSQL



Redis



Shopify



Azure DevOps



GitHub



Slack



\---



\# libs/memory



Contains memory engine.



Examples



Conversation Memory



Summary Memory



Embedding Memory



Long Term Memory



\---



\# libs/rag



Contains



Chunking



Embedding



Retrieval



Repository Indexing



Vector Search



\---



\# libs/vector-store



Examples



Qdrant



Chroma



Milvus



PGVector



\---



\# libs/config



Contains



Configuration Loader



Environment



Secrets



Feature Flags



\---



\# libs/logger



Contains



Pino configuration



Request logging



Structured logging



Audit logging



\---



\# libs/auth



Contains



Authentication



Authorization



JWT



API Keys



RBAC



Future SSO



\---



\# libs/events



Contains



Event Bus



Event Models



Publishers



Subscribers



\---



\# libs/shared



Contains



Utilities



Extensions



Helpers



Result<T>



Date Utilities



String Utilities



Validation Helpers



\---



\# docs/



Contains



Architecture



ADR



API



Roadmaps



Coding Standards



Prompt Rules



\---



\# docker/



Contains



docker-compose.yml



Dockerfiles



Development Images



Production Images



\---



\# scripts/



Contains



Development scripts



Migration scripts



Bootstrap scripts



Release scripts



\---



\# tools/



Contains



Nx generators



Workspace tools



Code generation templates



\---



\# Test Structure



Every library owns its tests.



Example



```

libs/



providers/



src/



tests/



ollama.provider.spec.ts

```



Never create one global test folder.



\---



\# Naming Rules



Folders



kebab-case



Examples



provider-factory



agent-runtime



prompt-engine



\---



Files



kebab-case



Examples



chat-service.ts



provider.ts



ollama-provider.ts



memory-service.ts



\---



Interfaces



PascalCase



Examples



AIProvider



Agent



Tool



MemoryProvider



\---



Classes



PascalCase



Examples



ChatService



ProviderFactory



PlannerAgent



\---



Enums



PascalCase



\---



Types



PascalCase



\---



Variables



camelCase



\---



Constants



UPPER\_CASE



\---



\# Import Rules



Allowed



```

@aspedan/core



@aspedan/providers



@aspedan/tools

```



Never



```

../../../provider



../../../../shared

```



Relative imports across libraries are forbidden.



\---



\# Dependency Rules



Allowed



Application



↓



Application Services



↓



Domain



Infrastructure



↓



Domain



Forbidden



Application



↓



Infrastructure directly



Domain



↓



Infrastructure



Domain



↓



Fastify



Domain



↓



Axios



\---



\# Maximum File Size



300 lines preferred



500 absolute maximum



\---



\# Maximum Function Size



40 lines preferred



80 absolute maximum



\---



\# Maximum Class Size



300 lines preferred



500 absolute maximum



\---



\# Cyclic Dependencies



Never allowed.



Nx dependency graph must remain acyclic.



\---



\# Public API



Every library exports only through



```

src/index.ts

```



Never import internal files directly.



Allowed



```

@aspedan/providers

```



Forbidden



```

@aspedan/providers/lib/ollama-provider

```



\---



\# Documentation



Every library contains



README.md



Architecture.md (optional)



Examples



\---



\# Definition of Done



A folder structure is considered valid when



Every file has one responsibility.



Applications remain thin.



Libraries remain reusable.



No circular dependency exists.



No relative import crosses library boundaries.



Every library has a public API.



End of Document

