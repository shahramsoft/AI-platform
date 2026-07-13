\# Aspedan AI Platform



\# Coding Standards



Version: 1.0



Status: Approved



\---



\# Purpose



This document defines all coding standards for the Aspedan AI Platform.



Every contributor, AI coding agent, and human developer must follow these standards.



Violating these rules is considered a failed implementation.



\---



\# Core Principles



The project follows



\- SOLID

\- Clean Code

\- Clean Architecture

\- Domain Driven Design

\- DRY

\- KISS

\- Composition over Inheritance

\- Explicit over Implicit



\---



\# Philosophy



Code is written for humans first.



Optimization comes after readability.



Every class should have one responsibility.



Every function should be understandable in under one minute.



\---



\# TypeScript Rules



Always enable



Strict Mode



No implicit any



No implicit returns



No unchecked indexed access



No unused locals



No unused parameters



Never disable strict mode.



\---



\# Type Usage



Allowed



interface



type



generic



readonly



discriminated unions



Forbidden



any



as any



unknown without validation



non-null assertion (!)



Example



Bad



let value:any



Good



let value:ChatRequest



\---



\# Naming



Folders



kebab-case



Files



kebab-case



Classes



PascalCase



Interfaces



PascalCase



Types



PascalCase



Enums



PascalCase



Functions



camelCase



Variables



camelCase



Constants



UPPER\_CASE



Booleans



must start with



is



has



can



should



Examples



isAuthenticated



hasPermission



canExecute



\---



\# File Size



Preferred



300 lines



Maximum



500 lines



If a file exceeds the limit



Split it.



\---



\# Function Size



Preferred



30 lines



Maximum



50 lines



Large functions indicate missing abstraction.



\---



\# Class Size



Preferred



250 lines



Maximum



400 lines



Large classes indicate multiple responsibilities.



\---



\# Method Rules



Every method should



Do one thing.



Return one thing.



Have one reason to change.



\---



\# Constructor Rules



Never inject unnecessary dependencies.



Maximum constructor parameters



6



If more than six



Create a Facade.



\---



\# Dependency Injection



Required.



Never instantiate services manually.



Forbidden



new Provider()



Allowed



ProviderFactory



DI Container



Factory



\---



\# Error Handling



Never throw generic Error.



Bad



throw new Error()



Good



throw new ProviderUnavailableError()



Create domain specific errors.



\---



\# Result Pattern



Prefer



Result<T>



Instead of



throwing exceptions



For expected business failures.



\---



\# Async Rules



Always use async/await.



Never use nested promises.



Never mix callbacks and promises.



\---



\# Logging



Use structured logging only.



Never



console.log



Use



Pino



Log Levels



trace



debug



info



warn



error



fatal



Never log



Passwords



Tokens



Secrets



Personal data



\---



\# Validation



All external input



must be validated.



Use



Zod



Never trust



HTTP input



CLI input



Tool input



Provider response



\---



\# Null Handling



Never assume values exist.



Validate.



Avoid



!



Prefer



Optional chaining



Null checks



Guards



\---



\# Configuration



Never hardcode



URLs



API Keys



Passwords



Ports



Model names



Use Config Service.



\---



\# Imports



Allowed



@aspedan/core



@aspedan/providers



Forbidden



../../../../provider



Relative imports between libraries are forbidden.



\---



\# Comments



Good code needs fewer comments.



Comment



Why



Not



What



\---



\# TODO



Every TODO



must contain



Owner



Date



Reason



Example



TODO(shahram,2026-08)



Replace fake provider.



\---



\# Testing



Every public service



must have tests.



Unit tests



Integration tests



Provider tests



Tool tests



Agent tests



\---



\# Coverage



Minimum



80%



Critical libraries



95%



\---



\# Mocking



Mock



Providers



Database



Filesystem



Docker



Network



Never mock



Business rules



\---



\# Security



Never execute shell commands directly.



Always sanitize



User input



Tool parameters



Filesystem paths



Never expose



Stack traces



Secrets



Environment variables



\---



\# Performance



Avoid unnecessary allocations.



Reuse objects when appropriate.



Avoid blocking operations.



Prefer streams for large data.



\---



\# Provider Rules



Providers only



translate requests.



Providers



must not



contain business logic.



\---



\# Agent Rules



Agents



plan



reason



coordinate



Agents



must not



know implementation details.



\---



\# Tool Rules



One tool



One responsibility.



Never create giant tools.



\---



\# HTTP Rules



Routes



only



delegate



No business logic.



No provider logic.



No repository logic.



\---



\# Services



Business logic belongs here.



Services orchestrate.



Services do not render HTTP.



\---



\# Repository Rules



Repositories



only



persist data.



Repositories



never



contain business logic.



\---



\# Events



Prefer events



over direct coupling.



\---



\# Circular Dependencies



Forbidden.



Nx dependency graph



must remain acyclic.



\---



\# Public API



Every library exports



only



through



src/index.ts



Never import internal implementation.



\---



\# Architecture Decision Records



Every architectural change



requires



an ADR.



\---



\# Commit Messages



Use Conventional Commits.



Examples



feat:



fix:



docs:



refactor:



test:



perf:



build:



ci:



\---



\# Pull Requests



Every PR must include



Description



Reason



Screenshots (if UI)



Tests



Documentation updates



\---



\# AI Generated Code



AI generated code



must



compile



pass lint



pass tests



follow architecture



follow naming



follow documentation



\---



\# Forbidden Practices



Using any



Using console.log



Business logic in routes



Business logic in providers



Circular dependency



Relative imports across libraries



God classes



God services



Static mutable state



Hardcoded secrets



Hardcoded provider names



Magic strings



Magic numbers



Copy/Paste programming



\---



\# Definition of Done



A task is complete only if



Build succeeds



Lint succeeds



Tests succeed



Documentation updated



No architecture violations



No TODO without owner



No warnings



No duplicated code



No forbidden practices



\---



\# AI Coding Rules



Claude Code



Codex



Gemini CLI



Cursor



must



Never invent architecture.



Never change folder structure.



Never bypass ProviderFactory.



Never bypass Tool Runtime.



Never bypass Agent Runtime.



Never introduce framework dependencies into Domain.



Always update tests.



Always update documentation.



Always respect this document.



\---



End of Document

