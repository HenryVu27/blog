# Context Engineering for LLMs: Complete Research Reference

> Compiled February 2026. Sources from frontier AI labs, top AI startups, academic papers, and production engineering blogs.

---

## Table of Contents

1. [Origin and Definitions](#1-origin-and-definitions)
2. [Context Engineering vs. Prompt Engineering](#2-context-engineering-vs-prompt-engineering)
3. [The Seven Components of Context](#3-the-seven-components-of-context)
4. [The Four Strategies Framework (LangChain)](#4-the-four-strategies-framework-langchain)
5. [Context Window Management Strategies](#5-context-window-management-strategies)
6. [Context Failure Modes](#6-context-failure-modes)
7. [Context Engineering in Agentic Systems](#7-context-engineering-in-agentic-systems)
8. [Memory Engineering — The Persistence Layer](#8-memory-engineering--the-persistence-layer)
9. [Memory Taxonomy (from Cognitive Science)](#9-memory-taxonomy-from-cognitive-science)
10. [How Frontier Labs Implement Memory](#10-how-frontier-labs-implement-memory)
11. [Memory Retrieval Strategies](#11-memory-retrieval-strategies)
12. [Memory Consolidation and Compression](#12-memory-consolidation-and-compression)
13. [Memory Storage Backends and Formats](#13-memory-storage-backends-and-formats)
14. [The Memory Startup Ecosystem](#14-the-memory-startup-ecosystem)
15. [Memory Security and Privacy](#15-memory-security-and-privacy)
16. [Memory by Domain](#16-memory-by-domain)
17. [Production Lessons from Industry](#17-production-lessons-from-industry)
18. [Industry Frameworks, Protocols, and Tools](#18-industry-frameworks-protocols-and-tools)
19. [Academic Papers](#19-academic-papers)
20. [Best Practices Checklist](#20-best-practices-checklist)
21. [Case Study: ADHDAgent Context Architecture](#21-case-study-adhdagent-context-architecture)
22. [Key Quotes](#22-key-quotes)
23. [Full Source Index](#23-full-source-index)

---

## 1. Origin and Definitions

The term "context engineering" entered mainstream AI discourse in mid-2025, catalyzed by two key figures within days of each other.

### Tobi Lutke (CEO, Shopify) — June 22, 2025

> "I really like the term 'context engineering' over prompt engineering. It describes the core skill better: the art of providing all the context for the task to be plausibly solvable by the LLM."

Source: https://x.com/tobi/status/1935533422589399127

### Andrej Karpathy (co-founder of OpenAI) — June 24, 2025

> "+1 for 'context engineering' over 'prompt engineering'. People associate prompts with short task descriptions you'd give an LLM in your day-to-day use. When in every industrial-strength LLM app, context engineering is the delicate art and science of filling the context window with just the right information for the next step."

Karpathy enumerated what context engineering involves: task descriptions and explanations, few-shot examples, RAG, related (possibly multimodal) data, tools, state and history, and compacting.

Source: https://x.com/karpathy/status/1937902205765607626

### Anthropic (September 29, 2025)

Context engineering is "the strategic curation of tokens within an LLM's limited attention budget" — asking "what configuration of context is most likely to generate our model's desired behavior?" across multi-turn interactions and extended time horizons.

Authors: Prithvi Rajasekaran, Ethan Dixon, Carly Ryan, Jeremy Hadfield (Anthropic Applied AI team).

Source: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

### Philipp Schmid (Hugging Face / Google)

> "The discipline of designing and building dynamic systems that provides the right information and tools, in the right format, at the right time, to give a LLM everything it needs to accomplish a task."

Source: https://www.philschmid.de/context-engineering

### Gartner (July 2025)

> "Context engineering is in, and prompt engineering is out."

Gartner defines it as "designing and structuring the relevant data, workflows and environment so AI systems can understand intent, make better decisions and deliver contextual, enterprise-aligned outcomes — without relying on manual prompts."

Source: https://www.gartner.com/en/articles/context-engineering

### LangChain (Lance Martin, July 2, 2025)

Context engineering is "the practice of strategically populating an LLM's context window with optimal information for each agent step."

Source: https://blog.langchain.com/context-engineering-for-agents/

### Addy Osmani (Google)

> "If prompt engineering was about coming up with a magical sentence, context engineering is about writing the full screenplay for the AI."

Source: https://addyo.substack.com/p/context-engineering-bringing-engineering

### Martin Fowler's Site

Identified three models for how context gets loaded:

1. **LLM-driven**: Agents autonomously load context when relevant (enables unsupervised operation but introduces unpredictability).
2. **Human-triggered**: Developers explicitly invoke context via commands (maintains control, reduces automation).
3. **Software-deterministic**: Systems load context at predetermined lifecycle moments.

Important caveat: Despite the "engineering" label, context engineering cannot guarantee outcomes. LLMs remain probabilistic — human oversight remains essential.

Source: https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html

---

## 2. Context Engineering vs. Prompt Engineering

This is one of the most actively discussed distinctions in the field.

### Comparison Table

| Dimension | Prompt Engineering | Context Engineering |
|---|---|---|
| **Focus** | How you phrase the instruction | What information fills the window |
| **Scope** | Single text string / template | Entire information architecture |
| **Nature** | Static, creative writing | Dynamic, systems design |
| **Question it answers** | "How should I phrase this?" | "What does the model need access to right now?" |
| **Analogy** | Copy-tweaking | Software architecture for LLMs |
| **Skills required** | Writing, creativity | Systems design, data engineering, software architecture |
| **When it dominates** | Self-contained tasks (summarization, classification) | Multi-step, multi-turn, agentic systems |

### Simon Willison (June 27, 2025)

Argued that "context engineering" will stick because its inferred definition is much closer to its intended meaning. He noted that "prompt engineering has a branding problem" — most people think it is "a laughably pretentious term for typing things into a chatbot." Context engineering, by contrast, implies the complexity that actually exists in production systems.

Source: https://simonwillison.net/2025/Jun/27/context-engineering/

### Drew Breunig

Drew a clean line: prompts are "disposable requests written for chatbots," while contexts are "evolving instructions curated for use in applications."

Source: https://www.dbreunig.com/2025/06/25/prompts-vs-context.html

### Key Insight

Context engineering is a **superset** of prompt engineering. Prompt engineering excels for self-contained generative tasks. As systems grow more complex — adding retrieval, tools, multi-step reasoning, and agent workflows — context engineering becomes the dominant challenge.

Source: https://www.elastic.co/search-labs/blog/context-engineering-vs-prompt-engineering

---

## 3. The Seven Components of Context

Based on Philipp Schmid's framework, corroborated across multiple sources (LangChain, Anthropic, Google).

### 3.1 Instructions / System Prompt

Behavioral guidelines, role definitions, rules, examples, and personality. The "DNA" of the agent.

**Best practice (Anthropic)**: Achieve the "right altitude" — balancing specificity with flexibility. Organize into distinct sections using XML tagging or Markdown headers. Start minimal, then iteratively add instructions based on failure modes.

**Best practice (Spotify)**: Larger, static, version-controlled prompts proved more predictable than dynamic tool-based approaches. Deliberately restricting tool access improved reliability.

### 3.2 User Prompt

The immediate task, question, or message from the human.

### 3.3 State / History (Short-term Memory)

Current conversation turns and prior exchanges. This is the "working memory" of the system.

**Critical insight (FlowHunt)**: A focused 300-token context often outperforms an unfocused 113,000-token context. What you remove can matter as much as what you keep.

**Best practice**: Don't send raw histories verbatim — greetings, acknowledgments, and off-topic content waste tokens. Use summarization or trimming strategies.

### 3.4 Long-Term Memory

Persistent knowledge across conversations — preferences, summaries, facts, learned patterns. See [Section 8](#8-memory-engineering--the-persistence-layer) for full treatment.

### 3.5 Retrieved Information (RAG)

External knowledge from documents, databases, APIs. Injected on-demand.

**Best practice (Inngest)**: Let the AI determine the context it needs ("pull, don't push"). Provide minimal foundational context and let the AI call tools as needed rather than front-loading everything.

### 3.6 Available Tools

Function definitions the system can invoke. These definitions themselves consume context tokens.

**Best practice (Inngest)**: Remove any tool used less than 10% of the time. Performance degrades as context fills.

**Best practice (Manus)**: Mask rather than remove tools — dynamic tool loading/removing breaks KV-cache. Use logits masking instead.

### 3.7 Structured Output

Response format specifications (JSON schemas, type definitions, etc.).

Source: https://www.philschmid.de/context-engineering

---

## 4. The Four Strategies Framework (LangChain)

LangChain's influential framework identifies four primary context engineering strategies. This is one of the most-cited organizational models.

### 4.1 Write Context

Store information outside the context window for later retrieval:

- **Scratchpads**: Persist information during active sessions via tool calls or state objects. The agent writes intermediate notes.
- **Memories**: Enable cross-session retention using self-generated reflections or synthesized collections.

### 4.2 Select Context

Retrieve relevant information when needed:

- Scratchpad access through tool calls.
- Memory retrieval using embeddings and knowledge graphs.
- Tool selection via RAG over descriptions (improves accuracy 3x per recent research).
- Knowledge retrieval through code indexing combining grep, semantic search, and re-ranking.

### 4.3 Compress Context

Reduce tokens while maintaining task performance:

- **Summarization**: Claude Code applies auto-compact at 95% context threshold; supports recursive or hierarchical approaches.
- **Trimming**: Remove older messages using heuristics or trained pruners (e.g., the Provence model).

### 4.4 Isolate Context

Split information across separate processing units:

- **Multi-agent systems**: Each sub-agent maintains isolated context for specific subtasks.
- **Sandboxing**: HuggingFace's CodeAgent isolates token-heavy objects in sandbox environments.
- **State schema design**: Separate LLM-exposed fields from auxiliary context storage.

Source: https://blog.langchain.com/context-engineering-for-agents/

---

## 5. Context Window Management Strategies

### 5.1 Compaction / Summarization

When approaching context limits, summarize conversation contents, preserving critical decisions while discarding redundant tool outputs.

Anthropic notes: "Compaction typically serves as the first lever in context engineering to drive better long-term coherence."

Implementation requires careful tuning to maximize recall while improving precision.

Source: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

### 5.2 Hierarchical Memory

Compress older conversation segments while preserving essential information. Recent exchanges remain verbatim while older content gets compressed into progressively more compact summaries.

Source: https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/

### 5.3 Just-in-Time Context Loading

Rather than pre-processing all relevant data, agents maintain lightweight identifiers (file paths, stored queries, web links) and dynamically load data at runtime using tools. This mirrors human cognition — we don't memorize everything, we know where to look.

Source: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

### 5.4 Context Trimming

Approaches range from simple (drop oldest N messages) to sophisticated (trained pruner models that identify which messages contribute least to task performance).

**The Provence model**: A trained context pruner that decides which messages to keep/remove. Represents the cutting edge of learned trimming.

### 5.5 Context Masking (Manus)

Selectively hide or suppress parts of the context depending on the task, user input, or execution stage. Instead of dynamically loading/removing tools (which breaks KV-cache), Manus uses context-aware state machines with logits masking.

Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus

---

## 6. Context Failure Modes

Drew Breunig identified four critical patterns for context degradation. Understanding these is essential for designing robust context systems.

### 6.1 Context Poisoning

A hallucination or error enters the context and gets repeatedly referenced, compounding mistakes over time. Google DeepMind's Gemini 2.5 technical report confirmed that if the "goals" section was poisoned, agents would develop nonsensical strategies.

**Mitigation**: Validate information before writing to long-term memory. Use structured schemas with field-level validation.

### 6.2 Context Distraction

When context grows so long that the model over-focuses on accumulated history, neglecting what it learned during training. Beyond ~100k tokens, agents tend toward repeating actions from history rather than synthesizing novel plans.

**Mitigation**: Aggressive trimming. Summarization. Removing completed/irrelevant sections.

### 6.3 Context Confusion

Superfluous information in the context is used by the model to generate low-quality responses — noise gets treated as signal.

**Mitigation**: Curate ruthlessly. Every token should earn its place.

### 6.4 Context Clash

New information and tools conflict with other information already in the prompt, creating contradictory instructions.

**Mitigation**: Hierarchy of instructions. Clear precedence rules. Testing for contradiction.

Source: https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html

---

## 7. Context Engineering in Agentic Systems

### Why It Matters More for Agents

Philipp Schmid states the core insight:

> "Most agent failures are not model failures anymore, they are context failures."

When proper context engineering is implemented, success rates can jump from ~30% to over 90%.

Source: https://www.philschmid.de/context-engineering

### Anthropic's Approach for Agents

The Anthropic Applied AI team published detailed guidance:

- **Sub-Agent Architectures**: Delegate focused tasks to specialized sub-agents with clean context windows, returning condensed summaries (1,000-2,000 tokens) to the lead agent for synthesis.
- **Structured Note-Taking**: Agents maintain persistent external memory (files, databases) documenting progress, objectives, and strategic insights, enabling coherence across context resets.
- **Guiding Principle**: "Find the smallest set of high-signal tokens that maximize the likelihood of your desired outcome."
- **Context Rot Warning**: LLMs experience diminishing recall accuracy as token counts increase due to n-squared pairwise token relationships in transformers.

Source: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

### Lessons from Manus (Yichao "Peak" Ji, July 18, 2025)

Manus, which processes millions of agentic tasks, shared six production-hardened principles:

**1. KV-Cache Hit Rate as Primary Metric**

Cached tokens on Claude Sonnet cost $0.30/MTok vs. $3/MTok uncached (10x difference). This makes cache optimization a first-order cost concern.

Rules:
- Keep prompt prefixes stable.
- Make context append-only.
- Use deterministic serialization (no random dict ordering, no timestamp in prefix).

**2. Mask Rather Than Remove Tools**

Dynamic tool loading/removing breaks KV-cache. Instead, use logits masking — tools remain in context but are suppressed at the decoding level through a context-aware state machine.

**3. File System as External Memory**

Treat the file system as unlimited, persistent memory rather than compressing observations into the context. Write results to files and reference them.

**4. Recitation for Attention Management**

Create and update `todo.md` files during complex tasks to counteract the "lost-in-the-middle" problem across ~50 average tool calls. By having the agent re-read and re-write its plan, it recites key information, keeping it in active attention.

**5. Preserve Failure Evidence**

Keep failed actions and error traces in context — models that see failures implicitly update beliefs and reduce mistake repetition. Never clean up errors.

**6. Avoid Few-Shot Brittleness**

Introduce structured variation to prevent agents from mimicking repetitive patterns. If all examples follow the same structure, the agent will cargo-cult that structure even when inappropriate.

Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus

### Google's ADK Architecture

Google's Agent Development Kit separates context into tiered storage:

- **Working Context**: Ephemeral prompt for current invocation.
- **Session**: Durable, chronological event log.
- **Memory**: Long-lived, searchable knowledge across sessions.
- **Artifacts**: Large binary/text data managed by reference.

Multi-agent patterns include "Agents as Tools" (focused prompts, no history sharing) and "Agent Transfer/Hierarchy" (full control handoff with configurable context transfer).

Source: https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/

---

## 8. Memory Engineering — The Persistence Layer

### Definition

Memory engineering is the discipline of designing persistent memory systems that enable LLMs and AI agents to retain, retrieve, and act upon information across sessions and over time. It is a critical subsystem within the broader context engineering discipline.

### Relationship to Context Engineering

```
Context Engineering (umbrella discipline)
├── System Prompt Design
├── RAG / Retrieved Information
├── Tool Definitions
├── Conversation History Management
├── Memory Engineering  ← persistent cross-session subsystem
│   ├── Semantic Memory (facts)
│   ├── Episodic Memory (experiences)
│   └── Procedural Memory (rules/skills)
└── Output Structure / Formatting
```

### Key Distinctions

- **LLM memorization** is static, in-weights retention of training data. Opaque. Happens at train time.
- **Agent memory** is online, interaction-driven, and under the agent's control. Requires explicit write/forget policies, temporal credit assignment, and provenance-aware retrieval.
- **Context engineering** handles everything the model sees — memory is one input among several.

Source: https://arxiv.org/abs/2512.13564

### MongoDB's Framing

> "Memory engineering is the missing architectural foundation for multi-agent systems. Just as databases transformed software from single-user programs to multi-user applications, shared persistent memory systems enable AI to evolve from single-agent tools to coordinated teams."

Source: https://medium.com/mongodb/why-multi-agent-systems-need-memory-engineering-153a81f8d5be

### Five Deployment Principles

1. **External-memory-first**: Don't rely on the context window as the primary memory store.
2. **Small-step editing**: Update memories incrementally, not through wholesale replacement.
3. **Long-task read/write strategies**: Define when to read and when to write during extended tasks.
4. **Timestamp alignment**: Track when memories were created and last accessed.
5. **Debiasing for privacy and evaluation**: Guard against recency bias and personal data leakage.

Source: https://arxiv.org/pdf/2509.18868

---

## 9. Memory Taxonomy (from Cognitive Science)

The field draws heavily from cognitive science and human memory research. The most widely cited framework comes from the CoALA (Cognitive Architectures for Language Agents) paper, popularized by Lilian Weng and Leonie Monigatti.

### 9.1 Working Memory (Short-term)

- **What it is**: The LLM's context window — all tokens currently visible in a single inference call.
- **Limitation**: Fixed capacity (context window size). When exceeded, oldest information rolls off.
- **Analogy**: Human working memory that holds 7 +/- 2 items.
- **Implementation**: The sliding window of messages in the current conversation.

### 9.2 Semantic Memory (Facts and Knowledge)

- Stores facts, user preferences, domain knowledge, product specifications, policies.
- Two representations per LangMem:
  - **Collections**: Searchable documents that grow over time. New facts are appended.
  - **Profiles**: Single structured documents following schemas, replaced on update.
- Example: "User's name is Henry. He prefers Python. He is a grad student at UT Dallas."

Source: https://langchain-ai.github.io/langmem/concepts/conceptual_guide/

### 9.3 Episodic Memory (Past Experiences)

- Records specific past interactions, events, and their outcomes.
- Transforms an agent from a reactive system into one that **learns from its own history**.
- Example: "Last Tuesday, the user asked about sleep strategies and found the bedtime routine tool helpful."
- Implementation: Stored in vector databases with timestamps and full interaction context.

A position paper (Feb 2025) argues: "Episodic memory is the missing piece for long-term LLM agents."

Source: https://arxiv.org/pdf/2502.06975

### 9.4 Procedural Memory (Rules and Skills)

- Encodes **how** an agent should behave — system prompts, learned procedures, response patterns.
- Begins with the system prompt and **evolves through feedback**.
- In LangMem, this is implemented as updated instructions in the agent's prompt that get refined over time.
- Example: "When the user reports a strategy outcome, always ask a follow-up about what made it work or not."

Source: https://langchain-ai.github.io/langmem/concepts/conceptual_guide/

### 9.5 Memory Type Interactions and Consolidation Pathways

- **Episodic to Semantic**: Repeated experiences get consolidated into general facts.
- **Explicit to Implicit**: Over time, explicit memories can be incorporated into fine-tuned model weights.

Source: https://arxiv.org/html/2504.15965v1

### 9.6 Leonie Monigatti's Memory Operations Taxonomy

Six core memory management operations:

1. **Generation**: Creating new memory entries from interactions.
2. **Storage**: Persisting memories in appropriate backends.
3. **Retrieval**: Finding relevant memories when needed.
4. **Integration**: Incorporating retrieved memories into the context.
5. **Updating**: Modifying existing memories when new information arrives.
6. **Deletion (Forgetting)**: Removing obsolete or incorrect memories.

Two critical challenges: **low-latency retrieval** and **automating effective forgetting** of obsolete data.

Source: https://www.leoniemonigatti.com/blog/memory-in-ai-agents.html

---

## 10. How Frontier Labs Implement Memory

### 10.1 OpenAI / ChatGPT Memory

Reverse-engineered by Manthan Gupta and others. Uses a four-layer architecture:

**Layer 1 — Session Metadata (Ephemeral)**: Device type, browser, timezone, subscription level. Expires after session.

**Layer 2 — User Memory (Long-term Facts)**: Approximately 33 persistent facts per user — name, career, projects, preferences. Injected into every prompt.

**Layer 3 — Recent Conversation Summaries**: Approximately 15 lightweight summaries with timestamps. **No vector DB, no RAG, no embedding search.** Pre-computed summaries injected directly.

**Layer 4 — Current Session (Sliding Window)**: Full message history until token limits trigger rolloff.

**Key insight**: OpenAI chose **simplicity over sophistication**. No complex retrieval — just pre-computed summaries injected directly for speed.

Sources:
- https://manthanguptaa.in/posts/chatgpt_memory/
- https://llmrefs.com/blog/reverse-engineering-chatgpt-memory
- https://help.openai.com/en/articles/8983136-what-is-memory

### 10.2 Anthropic / Claude Memory

Anthropic took a **transparent, file-based approach**:

- Memory stored in **Markdown files (CLAUDE.md)** — human-readable, editable, version-controllable.
- Claude synthesizes a "Memory summary" from past interactions, categorized into domains like "Role & Work," "Current Projects," "Personal Content."
- **Project-scoped**: Separate memories for separate projects — no cross-contamination.
- Rollout: September 2025 (Team/Enterprise), October 2025 (Pro/Max).
- **Developer API**: Memory tool launched in beta September 29, 2025 for agents to store/recall across conversations.

Sources:
- https://skywork.ai/blog/claude-memory-a-deep-dive-into-anthropics-persistent-context-solution/
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- https://www.leoniemonigatti.com/blog/claude-memory-tool.html

### 10.3 Google Gemini Memory

- Memory stored as a **single `user_context` document** with typed outline of short factual bullets.
- **Temporal grounding**: Each memory statement annotated with rationale and source date — the first mainstream chatbot to surface this explicitly.
- **Selective usage**: User data block is "off-limits by default" — model ignores it unless user explicitly invites personalization.
- Privacy-first: User can delete/reset at any time; enterprise clients can disable entirely.

Sources:
- https://www.datastudios.org/post/google-gemini-context-window-token-limits-and-memory-in-2025
- https://www.shloked.com/writing/gemini-memory

### 10.4 Comparison Table

| Aspect | OpenAI | Anthropic | Google |
|--------|--------|-----------|--------|
| Storage | Pre-computed summaries + ~33 facts | Markdown files (CLAUDE.md) | Single user_context document |
| Retrieval | Direct injection, no search | Full document in context | Injected alongside prompt |
| Scope | Global across all chats | Project-scoped | Session + opt-in personalization |
| User control | Delete individual memories | Edit files directly, toggle features | Delete/reset, enterprise disable |
| Philosophy | "Magical" personalization | Transparency + developer control | Privacy-first, selective |

Source: https://serokell.io/blog/design-patterns-for-long-term-memory-in-llm-powered-architectures

---

## 11. Memory Retrieval Strategies

### 11.1 The Stanford "Generative Agents" Formula (Park et al., 2023)

The seminal paper from Stanford/Google introduced the three-factor retrieval scoring that became the standard reference:

```
Score = alpha * Recency + beta * Importance + gamma * Relevance
```

- **Recency**: Exponential decay (decay factor ~0.99 per hour). Recently accessed memories score higher.
- **Importance**: LLM-rated on a 1-10 scale (1 = mundane like "ate breakfast", 10 = extremely poignant like "lost a family member").
- **Relevance**: Embedding cosine similarity between the current query and the memory text.

Source: https://arxiv.org/abs/2304.03442

### 11.2 Modern Advances

- **Half-life recency decay**: More nuanced temporal modeling than simple exponential.
- **LLM-based importance classification**: Moving beyond simple 1-10 scoring to richer classifications.
- **Mixture-of-Experts (MoE) gate functions**: Allow retrieval weights to be **learned and dynamically adjusted** rather than manually set. This represents a shift from static to adaptive retrieval.
- **Hybrid retrieval**: Combining dense embeddings + sparse BM25 + graph traversal for comprehensive coverage (used by Graphiti/Zep).
- **Memory strength**: Based on recency and frequency of use — frequently accessed memories gain "strength."

Source: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1591618/full

### 11.3 LangMem's Approach

Relevance combines **semantic similarity** with **importance** and **strength** (based on recency/frequency of use). Collections support growing knowledge; Profiles support fixed-schema current state.

---

## 12. Memory Consolidation and Compression

### 12.1 Rolling Summary (ConversationSummaryMemory)

After each exchange, the conversation history (including previous summary + new messages) is sent to an LLM that generates an updated, consolidated summary.

**Drawback**: An LLM call at every step adds latency and cost.

Source: https://mem0.ai/blog/llm-chat-history-summarization-guide-2025

### 12.2 Summary Buffer (ConversationSummaryBufferMemory)

Keeps **recent interactions verbatim** while maintaining a **summary of older exchanges**. When the buffer exceeds a token limit, the oldest messages are summarized and merged.

**Advantage**: Best of both worlds — detail for recent context, compression for older context.

### 12.3 Recursive Summarization

Research shows that recursively generated summaries are **mostly trustworthy**, with incorrect/inaccurate information not exceeding ~10% of summary content.

The approach: memorize small dialogue contexts, then recursively produce new memory using previous memory + following contexts.

Source: https://arxiv.org/abs/2308.15022

### 12.4 Multi-Level Memory Systems

Maintain information at different levels of abstraction:

- **Short-term**: Recent detailed interactions (verbatim).
- **Mid-term**: Summarized information from longer segments.
- **Long-term**: High-level themes and key points from entire interaction history.

### 12.5 SimpleMem's Three-Stage Pipeline (January 2026)

1. **Semantic Structured Compression**: Distills unstructured interactions into compact, multi-view indexed memory units.
2. **Online Semantic Synthesis**: Intra-session process that instantly integrates related context into unified representations.
3. **Intent-Aware Retrieval Planning**: Infers search intent to dynamically determine retrieval scope.

Result: **26.4% F1 improvement** while reducing token consumption by up to **30x**.

Source: https://arxiv.org/abs/2601.02553

### 12.6 Consolidation Pathways

- **Episodic to Semantic**: Repeated experiences consolidated into general facts. (e.g., 5 positive outcomes for "visual timer" → "Visual timers are a proven strategy for this family.")
- **Explicit to Implicit**: Explicit memories can eventually be incorporated into fine-tuned model weights.

---

## 13. Memory Storage Backends and Formats

### 13.1 Storage Formats

| Format | Strengths | Notes |
|--------|-----------|-------|
| **Markdown** | Token-efficient, human-readable | Anthropic's choice for CLAUDE.md |
| **JSON** | Reliable structured parsing across models | Gold standard for structured key-value data |
| **YAML** | May be strongest format for accuracy in some models | Needs per-model testing |
| **Markdown-KV** | Highest accuracy (60.7%) in one benchmark, 16 points ahead of CSV | Non-standardized key:value pairs in markdown |
| **XML** | Strong section delimiters, supported well by Claude | Anthropic recommends XML tags for structuring |

**Critical finding**: Models from different providers respond differently to format changes. You MUST test formats for your specific model.

Source: https://www.improvingagents.com/blog/best-nested-data-format/

### 13.2 Storage Backends

**Vector Databases** (Pinecone, Weaviate, Qdrant, ChromaDB):
- Store embeddings of memory items for semantic similarity search.
- Core of RAG-based memory systems.
- Enable "meaning-based" retrieval — finding memories by what they mean, not exact keywords.

**Knowledge Graphs** (Neo4j, Neptune, Graphiti/Zep):
- Store memories as nodes and relationships in directed labeled graphs.
- Enable complex relational queries, temporal reasoning, and multi-hop retrieval.
- Zep's Graphiti engine provides temporal awareness — tracking how facts change over time.
- Emerging consensus: industry moving from "raw text + vector search" toward structured graph approaches.

Source: https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/

**Hybrid approaches**: Many production systems combine vector + graph + structured storage. Cognee combines vector search + graph databases + self-improvement in a unified stack.

**Plain text / Markdown files**: Claude's approach. Simple, version-controllable, transparent.

**SQLite / Relational**: For structured profiles, session metadata, and indexed lookups.

---

## 14. The Memory Startup Ecosystem

### 14.1 Mem0

- **What it is**: Memory orchestration layer between AI agents and storage systems.
- **Performance**: 91% lower p95 latency, 90%+ token cost savings, 26% improvement over OpenAI on LLM-as-a-Judge metric.
- **Graph variant (Mem0g)**: Stores memories as directed labeled graphs for relational reasoning.
- **Scale**: 186 million API calls per month (Q3 2025), growing 30% MoM.
- **Funding**: $24M raised (YC, Peak XV, Basis Set). Exclusive memory provider for AWS Agent SDK.
- **Integration**: Works with OpenAI, LangGraph, CrewAI, Flowise, Langflow.

Sources:
- https://mem0.ai/research
- https://arxiv.org/abs/2504.19413
- https://techcrunch.com/2025/10/28/mem0-raises-24m-from-yc-peak-xv-and-basis-set-to-build-the-memory-layer-for-ai-apps/

### 14.2 Letta (formerly MemGPT)

- **Concept**: Virtual context management inspired by OS memory hierarchies (RAM + disk paging).
- **Architecture**: Two tiers — archival memory (long-term) and recall memory (conversation history).
- **Key innovation**: Creates "the illusion of an unbounded context window" within token limits.
- **2026 development**: Introducing Context Repositories with git-based versioning.
- **Education**: DeepLearning.AI course "LLMs as Operating Systems: Agent Memory."

Sources:
- https://docs.letta.com/concepts/memgpt/
- https://github.com/letta-ai/letta
- https://www.letta.com/blog/benchmarking-ai-agent-memory

### 14.3 Zep / Graphiti

- **Core technology**: Temporal knowledge graph that tracks how facts change over time.
- **Performance**: 94.8% on DMR benchmark (vs. 93.4% for MemGPT). Sub-200ms retrieval.
- **Graphiti engine**: Incremental data updates, efficient retrieval, precise historical queries without complete graph recomputation.
- **Integration**: Amazon Neptune partnership for enterprise deployment.

Sources:
- https://arxiv.org/abs/2501.13956
- https://github.com/getzep/graphiti
- https://aws.amazon.com/about-aws/whats-new/2025/09/aws-neptune-zep-integration-long-term-memory-genai/

### 14.4 Supermemory

- **Focus**: Universal memory API with industry-leading speed (10x faster than Zep, 25x faster than Mem0).
- **Technology**: Semantic memory at scale with temporal awareness on top of vector-based recall.
- **Benchmark**: Created memorybench, an open-source evaluation framework.
- **Funding**: $3M raised led by Susa Ventures, backed by Cloudflare CTO.
- **Founded by**: A 19-year-old, backed by Google execs.

Sources:
- https://supermemory.ai/
- https://supermemory.ai/research
- https://techcrunch.com/2025/10/06/a-19-year-old-nabs-backing-from-google-execs-for-his-ai-memory-startup-supermemory/

### 14.5 LangMem (LangChain)

- **Three memory types**: Semantic (Collections + Profiles), Episodic (past successful interactions), Procedural (evolving system instructions).
- **Two formation modes**: Hot path (during conversation) and background (post-conversation reflection).
- **Storage**: Integrates with LangGraph's long-term memory layer. Namespace-based organization.
- **Framework-agnostic**: Core API works with any storage system.

Sources:
- https://blog.langchain.com/langmem-sdk-launch/
- https://langchain-ai.github.io/langmem/concepts/conceptual_guide/

### 14.6 Cognee

- **Approach**: Knowledge engine combining vector search + graph databases + self-improvement.
- **Pipeline**: Ingestion (30+ sources) → Enrichment (embeddings + graph "memify") → Retrieval.
- **Inspiration**: Human cognitive architecture. Mimics how humans construct mental maps.

Sources:
- https://github.com/topoteretes/cognee
- https://www.cognee.ai/blog/fundamentals/llm-memory-cognitive-architectures-with-ai

### 14.7 MemOS (Multiple Implementations)

- **MemTensor's MemOS**: AI memory OS enabling persistent skill memory for cross-task reuse. Three memory types: Parametric, Activation, Plaintext.
- **BAI-LAB's MemoryOS**: Hierarchical storage architecture. EMNLP 2025 Oral.
- **Key innovation**: Treats memory as a first-class operating system resource.

Sources:
- https://github.com/MemTensor/MemOS
- https://github.com/BAI-LAB/MemoryOS
- https://arxiv.org/abs/2505.22101

### 14.8 ENGRAM

- **Design**: Lightweight memory orchestration using three canonical types through a single router and retriever.
- **Performance**: SOTA on LoCoMo benchmark. Exceeds full-context baseline by 15 points on LongMemEval while using only ~1% of tokens.
- **Philosophy**: Simple typed memory + semantic retrieval outperforms complex graph construction.

Source: https://arxiv.org/abs/2511.12960

---

## 15. Memory Security and Privacy

### 15.1 Privacy Risks

- **Data memorization and leakage**: Models can output training data verbatim through prompting. Larger models memorize more.
- **Deep inference**: LLMs can use "seemingly normal, harmless data" to infer private information — democratizing surveillance capabilities.
- **Permanent storage concern**: Once information enters an LLM's memory, it is difficult to fully erase.
- **Cross-context leakage**: Global memory systems risk surfacing personal information in unrelated contexts. Simon Willison documented ChatGPT unexpectedly injecting his location from memory into a generated image.

Source: https://news.northeastern.edu/2025/11/21/five-ways-llms-expose-your-personal-data/

### 15.2 Memory Security Attacks

**MINJA (Memory Injection Attack)**: Injects malicious records through queries, achieving 95%+ injection success rates. Advanced detectors miss 66% of poisoned entries because they appear harmless in isolation.

**MemoryGraft**: Implants malicious "successful experiences" into long-term memory, exploiting the agent's tendency to replicate patterns from past successes.

**Self-reinforcing attacks**: Turn the agent's learning process against itself — the more the agent learns from poisoned memories, the worse it gets.

**A-MEMGUARD**: A proactive defense framework for LLM-based agent memory (proposed 2025).

Sources:
- https://www.lakera.ai/blog/agentic-ai-threats-p1
- https://unit42.paloaltonetworks.com/indirect-prompt-injection-poisons-ai-longterm-memory/
- https://arxiv.org/html/2503.03704v2
- https://www.arxiv.org/pdf/2510.02373

### 15.3 Mitigation Strategies

- Anonymize and aggregate data before training/fine-tuning.
- Namespace-based isolation (user_id) to prevent cross-user memory contamination.
- Project-scoped memory (Anthropic's approach) to prevent context leakage.
- User controls: ability to view, edit, delete memories.
- Explicit opt-in for sensitive information storage.
- Enterprise compliance features to disable memory entirely.

---

## 16. Memory by Domain

### 16.1 Coding Assistants

- **Claude Code**: Uses `CLAUDE.md` files as persistent memory — project conventions, architecture decisions, coding standards. Files loaded into context at every session start. Distributed rules via `.claude/rules/` directory.
- **Cursor**: `.cursorrules` file for project-specific context. Requires more explicit specification.
- **Windsurf**: Cascade Memory System ("Flow") that follows coding logic across files and sessions, plus semantic indexing.
- **Mem0 OpenMemory**: MCP server adding persistent memory to Cursor, Windsurf, VS Code agents.

Sources:
- https://docs.anthropic.com/en/docs/claude-code/memory
- https://www.humanlayer.dev/blog/writing-a-good-claude-md
- https://mem0.ai/openmemory

### 16.2 Healthcare

- Memory must operate within **clinician-informed bounds**.
- RAG-based memory grounds responses in **physician-verified knowledge bases**, mitigating hallucination risk.
- **Privacy is paramount**: Patient data requires anonymization, federated learning approaches, compliance with HIPAA/regulations.
- Less than a third of studies address ethical, regulatory, and patient safety implications — a significant gap.

Source: https://www.mdpi.com/2078-2489/16/7/549

### 16.3 Education

- **Personalization** uses Long-Term Memory for stable traits (topic mastery, misconceptions, learning style) and Working Memory for session context.
- Khanmigo and Eedi demonstrate memory-based adaptive tutoring.
- AI tutors with memory significantly improve learning outcomes vs. traditional instruction.

Source: https://mem0.ai/usecase/education

### 16.4 Customer Service

- Semantic memory stores product specs, pricing, policies.
- Episodic memory tracks interaction history per customer.
- Cross-session persistence ensures customers don't repeat themselves.

---

## 17. Production Lessons from Industry

### 17.1 Spotify's Background Coding Agents (November 2025)

Six essential principles:

1. **Tailor instructions to the specific agent** — Claude Code prefers end-state descriptions over step-by-step.
2. **State preconditions** — explicitly specify when the agent should NOT act.
3. **Use concrete code examples** — they "heavily influence the outcome."
4. **Define verifiable goals** — tests > vague objectives.
5. **Isolate changes** — single modifications per prompt.
6. **Request feedback from the agent itself** about what was missing.

**Counterintuitive finding**: Deliberately restricting tool access improved reliability. More tools introduce "more dimensions of unpredictability."

Source: https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2

### 17.2 Inngest's Five Production Lessons

1. **Let the AI determine the context it needs (Pull, don't Push)**: Provide minimal foundational context and let the AI call tools as needed.
2. **Architecture depends on your model choice**: Different models have different strengths. Match context strategy to model capabilities.
3. **Fewer tools win**: Remove any tool used less than 10% of the time.
4. **Plan for rate limits and parallel execution**: Multiple agents requesting the same files simultaneously can cause 70% context-gathering overlap.
5. **Build for fast iteration with observability**: Log every tool call with full inputs, outputs, and timing. Transform observability data into evaluation datasets.

Source: https://www.inngest.com/blog/five-lessons-for-context-engineering

---

## 18. Industry Frameworks, Protocols, and Tools

### 18.1 Frameworks

| Framework/Tool | Organization | Purpose |
|---|---|---|
| **LangGraph** | LangChain | Agent orchestration with checkpointing, long-term memory, state schema design, multi-agent architectures |
| **LangMem** | LangChain | Memory management abstractions for LangGraph agents |
| **LangGraph Bigtool** | LangChain | Semantic search over tool descriptions for large tool collections |
| **Google ADK** | Google | Multi-agent-native framework with tiered storage, compiled views, pipeline processing |
| **Model Context Protocol (MCP)** | Anthropic | Open standard for connecting LLMs with external tools, data sources, and services |
| **OpenAI Agents SDK** | OpenAI | RunContextWrapper for structured state persistence, hooks, and context injection |
| **Claude Agent SDK** | Anthropic | Building agents with context management, tool search, programmatic tool calling |
| **ACE Framework** | Academic | Agentic Context Engineering — treats contexts as evolving playbooks |

### 18.2 Model Context Protocol (MCP)

Introduced by Anthropic in November 2024, adopted by OpenAI in March 2025 and Google DeepMind thereafter. MCP provides a universal interface for reading files, executing functions, and handling contextual prompts through three core primitives: **tools**, **resources**, and **prompts**. SDKs available in Python, TypeScript, C#, and Java.

Source: https://www.anthropic.com/news/model-context-protocol

### 18.3 Context Engineering in AI Coding Assistants

| Tool | Context Approach |
|------|-----------------|
| **Claude Code** | `CLAUDE.md` + `.claude/rules/` — versioned, transparent, hierarchical |
| **Cursor** | `.cursorrules` — explicit developer-specified context |
| **Windsurf** | Automated RAG indexing — system determines relevant files |
| **GitHub Copilot** | Editor context + recent files + repository structure |

Source: https://claude.com/blog/using-claude-md-files

---

## 19. Academic Papers

### 19.1 Surveys and Comprehensive Reviews

1. **"A Survey of Context Engineering for Large Language Models"** (July 2025, arXiv:2507.13334)
   - Analyzed over 1,400 papers. Examines context retrieval/generation, context processing, and context management as formal subdisciplines.
   - https://arxiv.org/abs/2507.13334

2. **"A Survey on the Memory Mechanism of Large Language Model-based Agents"** (2024, arXiv:2404.13501)
   - Accepted by ACM Transactions on Information Systems (TOIS).
   - https://dl.acm.org/doi/10.1145/3748302

3. **"Memory in the Age of AI Agents"** (December 2025, arXiv:2512.13564)
   - Major survey distinguishing LLM memorization from agent memory across four dimensions.
   - https://arxiv.org/abs/2512.13564

4. **"From Human Memory to AI Memory"** (April 2025, arXiv:2504.15965)
   - Examines memory from perspectives of object, form, and time.
   - https://arxiv.org/html/2504.15965v1

### 19.2 Foundational Papers

5. **"Generative Agents: Interactive Simulacra of Human Behavior"** (Park et al., 2023, arXiv:2304.03442)
   - Stanford/Google. The "Smallville" paper. Introduced recency + importance + relevance retrieval formula.
   - https://arxiv.org/abs/2304.03442

6. **"MemGPT: Towards LLMs as Operating Systems"** (Packer et al., 2023)
   - OS-inspired virtual context management with archival and recall memory.
   - https://research.memgpt.ai/

7. **"LLM Powered Autonomous Agents"** (Lilian Weng, June 2023)
   - The canonical blog post defining Agent = LLM + Memory + Planning + Tool Use.
   - https://lilianweng.github.io/posts/2023-06-23-agent/

### 19.3 Context Engineering Papers (2025-2026)

8. **"Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models"** (October 2025, arXiv:2510.04618)
   - Introduces the ACE framework for contexts that evolve through generation, reflection, and curation.
   - https://arxiv.org/abs/2510.04618

9. **"Context Engineering 2.0: The Context of Context Engineering"** (October 2025, arXiv:2510.26493)
   - Traces the evolution from early 1990s HCI frameworks to today's human-agent interaction paradigms.
   - https://arxiv.org/abs/2510.26493

10. **"Everything is Context: Agentic File System Abstraction for Context Engineering"** (December 2025, arXiv:2512.05470)
    - Proposes a Unix-inspired file-system abstraction for managing heterogeneous context artifacts.
    - https://arxiv.org/abs/2512.05470

11. **"Context Engineering for AI Agents in Open-Source Software"** (October 2025, arXiv:2510.21413)
    - Studies adoption of AI context files across 466 open-source projects.
    - https://arxiv.org/abs/2510.21413

### 19.4 Memory System Papers (2025-2026)

12. **"A-MEM: Agentic Memory for LLM Agents"** (February 2025, NeurIPS 2025)
    - Zettelkasten-inspired dynamic memory organization with interconnected knowledge networks.
    - https://arxiv.org/abs/2502.12110

13. **"ENGRAM: Effective, Lightweight Memory Orchestration for Conversational Agents"** (November 2025)
    - Three-type router achieving SOTA on LoCoMo with ~1% of tokens.
    - https://arxiv.org/abs/2511.12960

14. **"Zep: A Temporal Knowledge Graph Architecture for Agent Memory"** (January 2025)
    - Temporal knowledge graph outperforming MemGPT. 94.8% DMR benchmark.
    - https://arxiv.org/abs/2501.13956

15. **"Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory"** (April 2025)
    - Production memory architecture with graph variant. 186M API calls/month.
    - https://arxiv.org/abs/2504.19413

16. **"SimpleMem: Efficient Lifelong Memory for LLM Agents"** (January 2026)
    - Three-stage semantic compression pipeline. 26.4% F1 improvement, 30x token reduction.
    - https://arxiv.org/abs/2601.02553

17. **"AriGraph: Learning Knowledge Graph World Models with Episodic Memory for LLM Agents"** (IJCAI 2025)
    - Episodic + semantic knowledge graph learning.
    - https://arxiv.org/abs/2407.04363

18. **"Cognitive Memory in Large Language Models"** (April 2025)
    - Cognitive science-inspired memory modeling.
    - https://arxiv.org/html/2504.02441v1

### 19.5 Workshops and Community

19. **"MemAgents: Memory for LLM-Based Agentic Systems"** — ICLR 2026 Workshop
    - Signals academic community's recognition of memory as a first-class research topic.
    - https://openreview.net/pdf?id=U51WxL382H

### 19.6 Curated Collections

- **Awesome-Context-Engineering**: https://github.com/Meirtz/Awesome-Context-Engineering
- **Awesome-Memory-for-Agents** (Tsinghua C3I): https://github.com/TsinghuaC3I/Awesome-Memory-for-Agents
- **LLM Agent Memory Survey**: https://github.com/nuster1128/LLM_Agent_Memory_Survey
- **Agent-Memory-Paper-List**: https://github.com/Shichun-Liu/Agent-Memory-Paper-List

---

## 20. Best Practices Checklist

Synthesized across all sources.

### Context Engineering Best Practices

1. **Start minimal, iterate based on failures** — Don't front-load context. Add instructions only when you observe specific failure modes. (Anthropic, Spotify)

2. **Less is more** — A focused 300-token context often outperforms 113,000 unfocused tokens. Curate ruthlessly. (FlowHunt)

3. **Structure your context** — Use XML tags, Markdown headers, and clear delimiters. LLMs respond better to structured input than unstructured dumps. (Anthropic, Google)

4. **Pull, don't push** — Let agents dynamically retrieve context via tools rather than pre-loading everything. (Inngest, Anthropic)

5. **Isolate with sub-agents** — Give specialized sub-agents clean, focused context windows rather than one massive shared context. (Anthropic, Google ADK)

6. **Compress proactively** — Summarize older conversation history. Keep recent messages verbatim, compress older ones. (LangChain, Claude Code)

7. **Preserve cache stability** — Keep prompt prefixes stable. Make context append-only. Any mutation invalidates KV-cache (10x cost difference). (Manus)

8. **Minimize tools** — Remove tools used less than 10% of the time. Fewer tools = fewer dimensions of unpredictability. (Inngest, Spotify)

9. **Keep failure traces** — Don't clean up errors from context. Models learn from seeing what went wrong. (Manus)

10. **Build observability** — Log every tool call with inputs, outputs, and timing. Use this data for evaluation and iteration. (Inngest)

11. **Match architecture to model** — Different models excel at different things. Design context strategy around your model's strengths. (Inngest)

12. **Version control your context** — Treat system prompts and rules files as code. Static, versioned prompts are more reliable than dynamic ones. (Spotify)

### Memory Engineering Best Practices

13. **Implement all three memory types** — Semantic (facts), episodic (experiences), and procedural (learned patterns). Most systems only implement semantic. (LangMem, ENGRAM)

14. **Use dual-path memory formation** — Hot path (during conversation) for immediate needs + background path (post-conversation reflection) for comprehensive extraction. (LangMem)

15. **Design for forgetting** — Memory systems that never forget accumulate noise. Implement decay, expiration, and active deletion of obsolete memories. (Leonie Monigatti)

16. **Consolidate episodic to semantic** — Repeated experiences should be compressed into general facts. Don't keep 50 episodes when a single fact captures the pattern. (CoALA, A-MEM)

17. **Use importance + recency + relevance scoring** — Don't retrieve memories by recency alone. Weight by importance and semantic relevance to the current query. (Stanford Generative Agents)

18. **Test storage formats per model** — Markdown-KV, JSON, YAML, and XML all perform differently. Benchmark for your specific model. (Improving Agents)

19. **Scope memory appropriately** — Project-scoped > global. Prevent cross-context contamination. (Anthropic)

20. **Guard against memory attacks** — Validate before writing to long-term memory. Use structured schemas. Implement namespace isolation. (MINJA, MemoryGraft research)

---

## 21. Case Study: ADHDAgent Context Architecture

This section documents the actual context engineering patterns used in the ADHDAgent project as a concrete case study.

### Architecture Overview

The ADHDAgent uses a **layered context assembly with progressive compression** pattern. A ReAct agent (LangGraph `create_react_agent`) receives a dynamically-assembled system prompt + trimmed conversation history on every LLM call.

### What the LLM Actually Sees (Token Budget)

```
SystemMessage (~2,000-4,050 tokens depending on session maturity)
│
├── <conversation_state>          50-100 tok   [EVERY TURN]
│   Turn count, phase, datetime, last tools used, active topic
│
├── <identity>                    ~350 tok     [STATIC]
│   personality.md — coach name "Ally", personality traits, voice guidelines
│
├── <boundaries>                  ~280 tok     [STATIC]
│   5 hard scope rules + output gate consequence awareness
│
├── <family-context>              80-700 tok   [DYNAMIC]
│   ├── ## What You Know About This Family (structured profile fields)
│   ├── ## Session Summary (rolling summary + episodic memory bullets)
│   └── ## Goals and Progress (capped: 5 active, 2 completed, 3 outcomes)
│
├── <personalization>             ~60 tok      [STATIC]
├── <approach>                    ~100 tok     [STATIC]
├── <tools>                       ~100 tok     [STATIC]
├── <search-results>              ~100 tok     [STATIC]
├── <response-guide>              ~150 tok     [STATIC]
├── <reasoning>                   ~60 tok      [STATIC]
├── <examples>                    ~550 tok     [STATIC]
│   6 few-shot exchanges (frustration, homework, regression, medication redirect, overwhelm, brief)
│
└── <prior-search-evidence>       0-1,500 tok  [CONDITIONAL]
    Last 3 search_knowledge_base results from tool_results table

Conversation History (trimmed)    500-3,000 tok
│   6 turns / 12 messages max, char-budgeted at CONTEXT_MAX_CHARS=120,000
│   Messages from turns already covered by rolling summary are EXCLUDED
│
└── ToolMessage results            0-10,000 tok [ON-DEMAND]
    Up to 5 RAG document results per search_knowledge_base call
```

### Techniques Used

| Category | Technique | Implementation |
|----------|-----------|----------------|
| **Structure** | XML-tagged sections | `<identity>`, `<boundaries>`, `<family-context>`, etc. |
| **Structure** | Conversation state metadata | Turn count, phase, datetime, last tools, active topic in XML block |
| **Few-shot** | 6 canonical examples | Static, covering key coaching scenarios |
| **Compression** | Rolling summary | Every 5 turns, via Gemini Flash. Progressive accumulation. |
| **Compression** | History trimming | 6-turn window + char budget. Messages below summary cutoff excluded. |
| **Semantic memory** | Family profile | Structured schema (child_name, child_age, challenges, strategies, etc.) |
| **Semantic memory** | Active strategies | Tracked in separate table, shown in structured facts |
| **Episodic memory** | Outcome events | Created on track_outcome tool call, stored with emotion + strategy + turn |
| **RAG** | On-demand retrieval | Agent calls search_knowledge_base tool when needed (pull, not push) |
| **RAG** | Hybrid search | Dense + sparse vectors + RRF fusion + tag boosting + cross-encoder reranking |
| **RAG** | Query rewriting | LLM rewrites queries with conversation context and family profile |
| **RAG** | Cross-turn persistence | `<prior-search-evidence>` in system prompt + ToolMessage in history |
| **Caching** | Prompt cache with mutation detection | Cache-busting when state-mutating tools run |
| **Dual-path updates** | Foreground tool + background extraction | Profile updated both ways — immediate and async |
| **Routing** | Dual-model routing | Flash for simple messages, Pro with thinking for complex |
| **Guardrails** | Isolated gate calls | Input/output gates run outside main context — no contamination |
| **Observability** | Turn quality analysis | ConversationAnalyzer runs every turn (does NOT feed back into context) |

### Gaps Identified

| Gap | Impact | What Research Recommends |
|-----|--------|--------------------------|
| **No procedural memory** | High | System prompt should evolve based on what works. LangMem: extract and inject learned patterns. |
| **No episodic → semantic consolidation** | High | 5 positive outcomes for same strategy should become a semantic fact. Stanford, A-MEM. |
| **No importance scoring** | High | Episodes retrieved by recency only. Should weight importance + relevance. Stanford formula. |
| **No forgetting/decay** | High | Episodes, tool_results, active_strategies never expire. Monigatti: forgetting is essential. |
| **No cross-session memory** | Medium | Everything scoped to single session. All frontier labs support cross-session. |
| **No scratchpad/working notes** | Medium | No intermediate reasoning persistence across ReAct iterations. Manus: todo.md pattern. |
| **No phase-aware prompting** | Medium | Same examples/instructions regardless of intake vs. progress monitoring phase. |
| **No analyzer feedback loop** | Medium | Quality issues detected but never injected into context. |
| **No emotion-aware prioritization** | Medium | Emotion inferred but not used to weight context. |
| **Static few-shot examples** | Low | 6 fixed examples. Research shows semantic selection per query is better. |
| **KV-cache not optimized** | Low | Volatile fields (`<conversation_state>`) at START of prompt, breaking cache prefix. |

---

## 22. Key Quotes

| Who | Quote | Source |
|---|---|---|
| **Andrej Karpathy** | "Context engineering is the delicate art and science of filling the context window with just the right information for the next step." | [X/Twitter](https://x.com/karpathy/status/1937902205765607626) |
| **Tobi Lutke** | "The art of providing all the context for the task to be plausibly solvable by the LLM." | [X/Twitter](https://x.com/tobi/status/1935533422589399127) |
| **Simon Willison** | Context engineering will stick because its "inferred definition is much closer to its intended meaning." | [simonwillison.net](https://simonwillison.net/2025/Jun/27/context-engineering/) |
| **Anthropic** | "Find the smallest set of high-signal tokens that maximize the likelihood of your desired outcome." | [Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) |
| **Philipp Schmid** | "Most agent failures are not model failures anymore, they are context failures." | [philschmid.de](https://www.philschmid.de/context-engineering) |
| **Gartner** | "Context engineering is in, and prompt engineering is out." | [Gartner](https://www.gartner.com/en/articles/context-engineering) |
| **Addy Osmani** | "If prompt engineering was about coming up with a magical sentence, context engineering is about writing the full screenplay for the AI." | [Substack](https://addyo.substack.com/p/context-engineering-bringing-engineering) |
| **Manus (Peak Ji)** | "KV-cache hit rate is the most critical optimization metric for production agents." | [manus.im](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) |
| **MongoDB** | "Memory engineering is the missing architectural foundation for multi-agent systems." | [Medium](https://medium.com/mongodb/why-multi-agent-systems-need-memory-engineering-153a81f8d5be) |
| **Lilian Weng** | "Agent = LLM + Memory + Planning + Tool Use" | [Lil'Log](https://lilianweng.github.io/posts/2023-06-23-agent/) |

---

## 23. Full Source Index

### Frontier Lab Publications

1. [Anthropic: Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
2. [Anthropic: Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
3. [Anthropic: Managing Context on the Developer Platform](https://www.anthropic.com/news/context-management)
4. [Anthropic: Claude Memory Tool Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
5. [Anthropic: Claude Code Memory Docs](https://docs.anthropic.com/en/docs/claude-code/memory)
6. [Claude Blog: Using CLAUDE.md Files](https://claude.com/blog/using-claude-md-files)
7. [Google Developers Blog: Architecting Multi-Agent Framework](https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/)
8. [OpenAI: ChatGPT Memory FAQ](https://help.openai.com/en/articles/8983136-what-is-memory)
9. [OpenAI Cookbook: Session Memory](https://cookbook.openai.com/examples/agents_sdk/session_memory)

### Industry Engineering Blogs

10. [LangChain: Context Engineering for Agents](https://blog.langchain.com/context-engineering-for-agents/)
11. [LangChain: LangMem SDK Launch](https://blog.langchain.com/langmem-sdk-launch/)
12. [LangMem Conceptual Guide](https://langchain-ai.github.io/langmem/concepts/conceptual_guide/)
13. [LangChain Memory Overview Docs](https://docs.langchain.com/oss/python/concepts/memory)
14. [Manus: Context Engineering for AI Agents](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
15. [Spotify: Context Engineering for Background Coding Agents](https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2)
16. [Inngest: Five Critical Lessons for Context Engineering](https://www.inngest.com/blog/five-lessons-for-context-engineering)
17. [Philipp Schmid: Context Engineering](https://www.philschmid.de/context-engineering)
18. [Philipp Schmid: Gemini with Memory](https://www.philschmid.de/gemini-with-memory)

### Notable Individuals

19. [Andrej Karpathy on X](https://x.com/karpathy/status/1937902205765607626)
20. [Tobi Lutke on X](https://x.com/tobi/status/1935533422589399127)
21. [Simon Willison: Context Engineering](https://simonwillison.net/2025/Jun/27/context-engineering/)
22. [Simon Willison: Context Engineering Tag](https://simonwillison.net/tags/context-engineering/)
23. [Addy Osmani: Context Engineering](https://addyo.substack.com/p/context-engineering-bringing-engineering)
24. [Lilian Weng: LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/)
25. [Lilian Weng: Prompt Engineering](https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/)
26. [Martin Fowler: Context Engineering for Coding Agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html)
27. [Drew Breunig: How Contexts Fail](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html)
28. [Drew Breunig: Prompts vs. Context](https://www.dbreunig.com/2025/06/25/prompts-vs-context.html)
29. [Lance Martin: Context Engineering](https://rlancemartin.github.io/2025/06/23/context_engineering/)
30. [Leonie Monigatti: Memory in AI Agents](https://www.leoniemonigatti.com/blog/memory-in-ai-agents.html)
31. [Leonie Monigatti: From RAG to Agent Memory](https://www.leoniemonigatti.com/blog/from-rag-to-agent-memory.html)
32. [Leonie Monigatti: Claude Memory Tool](https://www.leoniemonigatti.com/blog/claude-memory-tool.html)
33. [Manthan Gupta: Reverse Engineering ChatGPT Memory](https://manthanguptaa.in/posts/chatgpt_memory/)
34. [Manthan Gupta: Reverse Engineering Claude Memory](https://manthanguptaa.in/posts/claude_memory/)
35. [Shlok Khemani: ChatGPT Memory and the Bitter Lesson](https://www.shloked.com/writing/chatgpt-memory-bitter-lesson)
36. [Shlok Khemani: Gemini Memory](https://www.shloked.com/writing/gemini-memory)

### Analyst and Reference Sites

37. [Gartner: Context Engineering](https://www.gartner.com/en/articles/context-engineering)
38. [Elastic Search Labs: Context vs. Prompt Engineering](https://www.elastic.co/search-labs/blog/context-engineering-vs-prompt-engineering)
39. [FlowHunt: Context Engineering Definitive Guide](https://www.flowhunt.io/blog/context-engineering/)
40. [Prompting Guide: Context Engineering](https://www.promptingguide.ai/guides/context-engineering-guide)
41. [Neo4j: Context Engineering vs. Prompt Engineering](https://neo4j.com/blog/agentic-ai/context-engineering-vs-prompt-engineering/)
42. [The New Stack: Memory as Context Engineering](https://thenewstack.io/memory-for-ai-agents-a-new-paradigm-of-context-engineering/)
43. [Serokell: Design Patterns for LLM Memory](https://serokell.io/blog/design-patterns-for-long-term-memory-in-llm-powered-architectures)
44. [HumanLayer: Writing a Good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

### Memory Startups

45. [Mem0](https://mem0.ai/) — [Research](https://mem0.ai/research) — [Blog](https://mem0.ai/blog/context-engineering-ai-agents-guide)
46. [Letta](https://docs.letta.com/concepts/memgpt/) — [GitHub](https://github.com/letta-ai/letta) — [Benchmark](https://www.letta.com/blog/benchmarking-ai-agent-memory)
47. [Zep / Graphiti](https://github.com/getzep/graphiti) — [AWS Integration](https://aws.amazon.com/about-aws/whats-new/2025/09/aws-neptune-zep-integration-long-term-memory-genai/)
48. [Supermemory](https://supermemory.ai/) — [Research](https://supermemory.ai/research)
49. [Cognee](https://github.com/topoteretes/cognee) — [Blog](https://www.cognee.ai/blog/fundamentals/llm-memory-cognitive-architectures-with-ai)
50. [Mem0 OpenMemory](https://mem0.ai/openmemory)
51. [Improving Agents: Best Data Format](https://www.improvingagents.com/blog/best-nested-data-format/)

### Storage and Infrastructure

52. [Pinecone: Vector Database](https://www.pinecone.io/learn/vector-database/)
53. [FreeCodeCamp: Vector Stores in LLM Memory](https://www.freecodecamp.org/news/how-ai-agents-remember-things-vector-stores-in-llm-memory/)
54. [Neo4j: Graphiti Knowledge Graph Memory](https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/)
55. [AWS Neptune + Zep](https://aws.amazon.com/about-aws/whats-new/2025/09/aws-neptune-zep-integration-long-term-memory-genai/)
56. [AWS + Mem0 Integration](https://aws.amazon.com/blogs/database/build-persistent-memory-for-agentic-ai-applications-with-mem0-open-source-amazon-elasticache-for-valkey-and-amazon-neptune-analytics/)

### Security

57. [Lakera: Agentic AI Memory Threats](https://www.lakera.ai/blog/agentic-ai-threats-p1)
58. [Palo Alto Unit 42: Memory Poisoning](https://unit42.paloaltonetworks.com/indirect-prompt-injection-poisons-ai-longterm-memory/)
59. [MINJA Paper](https://arxiv.org/html/2503.03704v2)
60. [A-MEMGUARD Paper](https://www.arxiv.org/pdf/2510.02373)
61. [Northeastern: LLM Privacy Risks](https://news.northeastern.edu/2025/11/21/five-ways-llms-expose-your-personal-data/)

### Academic Papers (arXiv / conferences)

62. [arXiv:2507.13334 — Survey of Context Engineering](https://arxiv.org/abs/2507.13334)
63. [arXiv:2510.04618 — Agentic Context Engineering (ACE)](https://arxiv.org/abs/2510.04618)
64. [arXiv:2510.26493 — Context Engineering 2.0](https://arxiv.org/abs/2510.26493)
65. [arXiv:2512.05470 — Everything is Context](https://arxiv.org/abs/2512.05470)
66. [arXiv:2510.21413 — Context Engineering in Open-Source](https://arxiv.org/abs/2510.21413)
67. [arXiv:2304.03442 — Generative Agents (Stanford)](https://arxiv.org/abs/2304.03442)
68. [MemGPT Research](https://research.memgpt.ai/)
69. [arXiv:2502.12110 — A-MEM (NeurIPS 2025)](https://arxiv.org/abs/2502.12110)
70. [arXiv:2511.12960 — ENGRAM](https://arxiv.org/abs/2511.12960)
71. [arXiv:2501.13956 — Zep Temporal Knowledge Graph](https://arxiv.org/abs/2501.13956)
72. [arXiv:2504.19413 — Mem0](https://arxiv.org/abs/2504.19413)
73. [arXiv:2601.02553 — SimpleMem](https://arxiv.org/abs/2601.02553)
74. [arXiv:2407.04363 — AriGraph (IJCAI 2025)](https://arxiv.org/abs/2407.04363)
75. [arXiv:2504.02441 — Cognitive Memory in LLMs](https://arxiv.org/html/2504.02441v1)
76. [arXiv:2308.15022 — Recursive Summarization](https://arxiv.org/abs/2308.15022)
77. [arXiv:2404.13501 — Memory Mechanism Survey (ACM TOIS)](https://dl.acm.org/doi/10.1145/3748302)
78. [arXiv:2512.13564 — Memory in the Age of AI Agents](https://arxiv.org/abs/2512.13564)
79. [arXiv:2504.15965 — From Human Memory to AI Memory](https://arxiv.org/html/2504.15965v1)
80. [arXiv:2502.06975 — Episodic Memory Position Paper](https://arxiv.org/pdf/2502.06975)
81. [arXiv:2505.22101 — MemOS](https://arxiv.org/abs/2505.22101)
82. [arXiv:2509.18868 — Memory Deployment Principles](https://arxiv.org/pdf/2509.18868)
83. [ICLR 2026 MemAgents Workshop](https://openreview.net/pdf?id=U51WxL382H)

### GitHub Collections

84. [Awesome-Context-Engineering](https://github.com/Meirtz/Awesome-Context-Engineering)
85. [Context-Engineering (Karpathy-inspired handbook)](https://github.com/davidkimai/Context-Engineering)
86. [Awesome-Memory-for-Agents (Tsinghua C3I)](https://github.com/TsinghuaC3I/Awesome-Memory-for-Agents)
87. [LLM Agent Memory Survey](https://github.com/nuster1128/LLM_Agent_Memory_Survey)
88. [Agent-Memory-Paper-List](https://github.com/Shichun-Liu/Agent-Memory-Paper-List)

### Domain-Specific

89. [Mem0: Education Use Case](https://mem0.ai/usecase/education)
90. [MDPI: LLMs in Medical Chatbots](https://www.mdpi.com/2078-2489/16/7/549)
91. [Healthcare AI Guardrails Paper](https://arxiv.org/html/2409.17190v1)
92. [Nature: AI Tutors with Memory](https://www.nature.com/articles/s41598-025-97652-6)
93. [DataCamp: How LLM Memory Works](https://www.datacamp.com/blog/how-does-llm-memory-work)
94. [Machine Learning Mastery: 3 Types of Long-term Memory](https://machinelearningmastery.com/beyond-short-term-memory-the-3-types-of-long-term-memory-ai-agents-need/)
95. [Frontiers: Memory Retrieval in Generative Agents](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1591618/full)
96. [DeepLearning.AI: LLMs as Operating Systems Course](https://www.deeplearning.ai/short-courses/llms-as-operating-systems-agent-memory/)

### Funding/Market Coverage

97. [TechCrunch: Mem0 $24M Raise](https://techcrunch.com/2025/10/28/mem0-raises-24m-from-yc-peak-xv-and-basis-set-to-build-the-memory-layer-for-ai-apps/)
98. [TechCrunch: Supermemory $3M Raise](https://techcrunch.com/2025/10/06/a-19-year-old-nabs-backing-from-google-execs-for-his-ai-memory-startup-supermemory/)
99. [Medium: Semantic vs Episodic vs Procedural Memory in AI Agents](https://medium.com/womenintechnology/semantic-vs-episodic-vs-procedural-memory-in-ai-agents-and-why-you-need-all-three-8479cd1c7ba6)
100. [Supermemory Blog: 3 Ways to Build LLMs with Long-term Memory](https://supermemory.ai/blog/3-ways-to-build-llms-with-long-term-memory/)
