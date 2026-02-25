# Part 3: Memory Engineering -- Deep Research Document

> Compiled February 24, 2026. Supplementary research for the memory engineering deep dive.
> This document goes deeper than the existing context-engineering-research.md sections 8-16.

---

## Table of Contents

1. [The Memory Problem](#1-the-memory-problem)
2. [Memory Taxonomy](#2-memory-taxonomy)
3. [How Frontier Labs Implement Memory](#3-how-frontier-labs-implement-memory)
4. [Memory Retrieval](#4-memory-retrieval)
5. [Consolidation & Compression](#5-consolidation--compression)
6. [The Memory Startup Landscape](#6-the-memory-startup-landscape)
7. [Memory Security](#7-memory-security)
8. [Practitioner Perspectives](#8-practitioner-perspectives)

---

## 1. The Memory Problem

### 1.1 LongMemEval Benchmark (ICLR 2025)

**Paper:** Di Wu, Hongwei Wang, Wenhao Yu, Yuwei Zhang, Kai-Wei Chang, Dong Yu. "LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory." arXiv:2410.10813. Accepted at ICLR 2025.

**Source:** https://arxiv.org/abs/2410.10813
**Project page:** https://xiaowu0162.github.io/long-mem-eval/
**GitHub:** https://github.com/xiaowu0162/LongMemEval

#### Structure

- **500 manually curated questions** testing five core memory abilities.
- Freely extensible user-assistant chat histories simulating:
  - **LongMemEval_S**: ~115,000 tokens
  - **LongMemEval_M**: up to ~1.5 million tokens
- Seven question types across five capabilities.

#### The Five Capabilities Tested

1. **Information Extraction**: Recall specific information from extensive interactive histories, including details mentioned by either user or assistant.
2. **Multi-Session Reasoning**: Synthesize information across multiple history sessions to answer complex questions involving aggregation and comparison.
3. **Temporal Reasoning**: Awareness of temporal aspects of user information, including explicit time mentions and timestamp metadata.
4. **Knowledge Updates**: Recognize changes in user's personal information and dynamically update knowledge over time.
5. **Abstention**: Identify questions seeking unknown information (not mentioned by user in interaction history) and answer "I don't know."

#### Key Findings

- **30% accuracy degradation**: Commercial chat assistants and long-context LLMs show ~30% accuracy drop on memorizing information across sustained interactions.
- **Performance degradation with context length**: Performance may degrade as high as **73% drop** compared to performance when no prior context is added.
- **GPT-4o and Gemini Pro**: Showed accuracy drops of **16% and 14% relatively** between no-context and 64k-token scenarios.
- **Performance by question type (non-thinking mode)**: Models generally perform best on knowledge-update, followed by multi-session, then temporal reasoning.
- **Focused vs. full prompts**: Claude Sonnet 4 in non-thinking mode showed stronger performance on focused prompts compared to full prompts. This trend holds across GPT, Gemini, and Qwen model families.

#### Optimization Insights from the Paper

- **Fact-Augmented Key Expansion**: Expanding keys with extracted user facts improves memory recall by **+4% recall@k** and downstream QA by **+5% accuracy**.
- **Temporal reasoning improvements**: Simple time-aware indexing + query expansion strategy improves memory recall for temporal reasoning by **7-11%**.
- **Reading strategy**: Chain-of-Note + structured JSON prompt format improves reading accuracy by as much as **10 absolute points** across three LLMs.
- **Thinking mode gains**: For models that support thinking modes, notable gains are observed on both focused and full prompts when enabled, but a performance gap between the two input lengths persists even with full reasoning.

### 1.2 The Fundamental Problem: Fixed Window vs. Unbounded Information

The core tension in memory engineering: an LLM's context window is fixed (even at 200k tokens), but user information accumulates without bound across sessions, days, months. No retrieval system can perfectly compress months of interaction into a window-sized representation.

Context rot (Chroma Research): increasing input tokens degrades LLM performance. The model's ability to attend to relevant information diminishes as the context fills. A focused 300-token context often outperforms an unfocused 113,000-token context (FlowHunt finding documented in existing research).

**Source:** https://research.trychroma.com/context-rot

### 1.3 Why "Just Use a Longer Context Window" Doesn't Solve It

Even with 1M+ token context windows (Gemini), the problem isn't capacity alone:

- **Attention degradation**: n-squared pairwise token relationships in transformers cause recall accuracy to diminish as token counts increase (Anthropic's "context rot" warning).
- **Cost**: Longer contexts are dramatically more expensive. Processing 1M tokens for every query to recall a single user preference is economically absurd.
- **Latency**: Linear relationship between context length and time-to-first-token.
- **Lost in the middle**: Models disproportionately attend to the beginning and end of context, missing information in the middle.

---

## 2. Memory Taxonomy

### 2.1 CoALA Paper: Cognitive Architectures for Language Agents

**Paper:** Theodore Sumers, Shunyu Yao, Karthik Narasimhan, Thomas Griffiths. "Cognitive Architectures for Language Agents." arXiv:2309.02427. Published in Transactions on Machine Learning Research (02/2024).

**Source:** https://arxiv.org/abs/2309.02427

#### Framework Summary

CoALA draws on cognitive science and symbolic AI to propose a modular framework describing language agents with:

1. **Modular memory components** (working + long-term)
2. **Structured action space** (internal cognitive + external environment actions)
3. **Generalized decision-making process** (interactive loop with planning and execution)

#### Memory Taxonomy

**Working Memory:**
- Maintains active, readily available information as symbolic variables for the current decision cycle.
- Includes: perceptual inputs, active knowledge (generated by reasoning or retrieved from long-term memory), and core information carried over from the previous decision cycle (e.g., agent's active goals).
- Maps to: the LLM's context window.

**Long-Term Memory (three types):**

| Type | What It Stores | Example | LLM Implementation |
|------|---------------|---------|---------------------|
| **Semantic** | Structured factual knowledge: facts, definitions, rules, concepts | "User prefers Python over JavaScript" | Vector DB entries, structured profiles, knowledge graphs |
| **Episodic** | Records of past events and experiences | "Last Tuesday, the visual timer strategy worked for homework" | Timestamped interaction logs, few-shot examples |
| **Procedural** | Skills, rules, learned behaviors for automatic task performance | "When user reports regression, ask about sleep and routine changes first" | System prompt refinements, learned instructions |

#### Action Space

CoALA divides actions into:

- **Internal cognitive actions**: retrieval (read from LTM to WM), reasoning (process WM via LLM), learning (write from WM to LTM)
- **External environment actions**: physical, dialogue, digital tool use

#### Decision-Making Loop

Each cycle: retrieval + reasoning to plan -> propose and evaluate candidate actions -> select best action -> execute -> observe -> repeat.

**Key insight**: CoALA retrospectively organizes a large body of existing agent work and prospectively identifies actionable research directions. The taxonomy has become the standard reference for agent memory design.

**Source (Cognee's explanation):** https://www.cognee.ai/blog/fundamentals/cognitive-architectures-for-language-agents-explained

### 2.2 Leonie Monigatti's Memory Operations Framework

**Source:** https://www.leoniemonigatti.com/blog/memory-in-ai-agents.html

Monigatti (Developer Advocate at Weaviate) synthesized six core memory management operations, building on Richmond Alake's framework:

1. **Generation (ADD)**: Creating new memory entries from interactions. The system detects salient facts, preferences, or events and generates structured memory records.
2. **Storage**: Persisting memories in appropriate backends (vector DB, knowledge graph, markdown files, SQL).
3. **Retrieval**: Finding relevant memories when needed. Combines semantic similarity, keyword matching, temporal filtering, and importance scoring.
4. **Integration**: Incorporating retrieved memories into the current context window. Deciding where in the prompt to place memories, how to format them, how many to include.
5. **Updating (UPDATE)**: Modifying existing memories when new information arrives. Identifying outdated facts, resolving conflicts, merging overlapping memories.
6. **Deletion / Forgetting (DELETE)**: Removing obsolete or incorrect memories. Preventing memory bloat. Decay-based expiration.

**Two critical challenges Monigatti identifies:**
- **Low-latency retrieval**: Memory must not add perceptible latency to the user experience.
- **Automating effective forgetting**: Systems that never forget accumulate noise and eventually degrade retrieval quality.

**Additional blog posts by Monigatti:**
- "The Evolution from RAG to Agentic RAG to Agent Memory": https://www.leoniemonigatti.com/blog/from-rag-to-agent-memory.html
- "Exploring Anthropic's Memory Tool": https://www.leoniemonigatti.com/blog/claude-memory-tool.html
- "Virtual context management with MemGPT and Letta": https://www.leoniemonigatti.com/blog/memgpt.html

### 2.3 The Episodic Memory Position Paper

**Source:** https://arxiv.org/pdf/2502.06975

A February 2025 position paper argues: "Episodic memory is the missing piece for long-term LLM agents." Most production systems implement only semantic memory (facts). Episodic memory (specific past experiences with outcomes) transforms agents from reactive systems into ones that learn from their own history.

### 2.4 Consolidation Pathways (Cognitive Science Mapping)

The cognitive science literature identifies two key consolidation pathways applicable to LLM memory:

1. **Episodic -> Semantic**: Repeated experiences get consolidated into general facts. Example: five positive outcomes with "visual timer" strategy -> "Visual timers are a proven strategy for this family."
2. **Explicit -> Implicit**: Over time, explicit memories can be incorporated into fine-tuned model weights (though this pathway is largely theoretical in current LLM systems).

**Source:** https://arxiv.org/html/2504.15965v1

---

## 3. How Frontier Labs Implement Memory

### 3.1 OpenAI / ChatGPT Memory (Detailed)

#### The Four-Layer Architecture (Reverse-Engineered)

**Primary source:** Manthan Gupta, "I Reverse Engineered ChatGPT's Memory System, and Here's What I Found!"
**URL:** https://manthanguptaa.in/posts/chatgpt_memory/
**Corroboration:** https://llmrefs.com/blog/reverse-engineering-chatgpt-memory

**Important caveat**: Everything below comes from reverse engineering through conversation, not official OpenAI documentation.

The context ChatGPT assembles for each message:

```
[0] System Instructions
[1] Developer Instructions
[2] Session Metadata (ephemeral)
[3] User Memory (long-term facts)
[4] Recent Conversation Summaries
[5] Current Session Messages (sliding window)
```

**Layer 1: Session Metadata (Ephemeral)**
- Injected once per session.
- Contains: device type, browser, timezone, subscription level, usage patterns.
- Expires when session ends.

**Layer 2: User Memory (Long-Term Facts)**
- Approximately **33 persistent facts** per user (based on Gupta's account).
- Stored as explicit fact strings: name, career, projects, preferences, recurring interests.
- Injected into **every** future prompt as a distinct block of text.
- Two storage triggers: (1) Direct user command ("Remember that I..."), (2) Model detection with implicit consent.
- Dedicated tool `memory_user_edits` for storage and deletion.
- Memory organization follows a pattern: first paragraphs focus on professional life (work, projects, technical skills), final paragraphs describe how users interact with ChatGPT itself.

**Layer 3: Recent Conversation Summaries**
- Approximately **15 lightweight summaries** with timestamps at any given time.
- Only summarizes snippets from the **user's** messages, not the assistant's replies.
- **No vector DB. No RAG. No embedding search.** Pre-computed summaries injected directly.
- This is the key architectural choice: simplicity over sophistication. Trades depth for speed.

**Layer 4: Current Session (Sliding Window)**
- Full message history until token limits trigger rolloff.
- As session grows, older messages drop off, but memory facts and conversation summaries remain.

**Key insight (Gupta's analysis):** "ChatGPT's memory system is far simpler than expected. No vector databases. No RAG over conversation history. Everything is pre-computed summaries injected directly for speed."

#### April 2025 Memory Update

**Source:** https://techcrunch.com/2025/04/10/openai-updates-chatgpt-to-reference-your-other-chats/
**Official announcement:** https://x.com/OpenAI/status/1910378768172212636

On April 10, 2025, OpenAI announced a significant expansion:
- ChatGPT can now **reference all past conversations** (not just saved memories).
- Two types of memory: (1) **Saved Memories** (explicitly stored facts, like custom instructions), (2) **Referenced Chat History** (ChatGPT can use information from past chats to inform future ones).
- Example: If you once said you like Thai food, it may factor that into "What should I have for lunch?"
- Rollout: Plus and Pro users first. Team, Enterprise, Edu users followed.
- Excluded from EU, UK, Iceland, Liechtenstein, Norway, Switzerland due to regulatory requirements.

**Shlok Khemani's analysis ("ChatGPT Memory and the Bitter Lesson"):**
- https://www.shloked.com/writing/chatgpt-memory-bitter-lesson
- OpenAI's approach is "pragmatic over principled" -- simple heuristics at scale rather than sophisticated memory architectures.

#### Simon Willison's Privacy Concern

Willison documented ChatGPT unexpectedly injecting his location from memory into a generated image. He uploaded a photo of his dog and asked ChatGPT to put it in a pelican costume. The generated image included a "Half Moon Bay" sign. When he asked why, ChatGPT replied: "Because you've mentioned being in Half Moon Bay before."

This is a "context collapse" problem: data from different spheres of activity (location history, image generation) spills together, blurring boundaries.

**Source:** https://simonwillison.net/tags/chatgpt/

### 3.2 Anthropic / Claude Memory (Detailed)

#### Architecture: Transparent, File-Based

**Sources:**
- https://skywork.ai/blog/claude-memory-a-deep-dive-into-anthropics-persistent-context-solution/
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- https://www.leoniemonigatti.com/blog/claude-memory-tool.html
- https://docs.anthropic.com/en/docs/claude-code/memory

**Design philosophy:** Transparency and user control over "magical" personalization.

**CLAUDE.md File Architecture:**
- Memory stored in **Markdown files (CLAUDE.md)** -- human-readable, editable, version-controllable.
- All memory files automatically loaded into Claude Code's context when launched.
- Content directly injected into the model's prompt context for every session.
- Model uses its large context window (200k tokens) to find relevant information within pre-loaded text.
- **Project-scoped**: Separate memories for separate projects, preventing cross-contamination.

**Memory Hierarchy in Claude Code:**
- `~/.claude/CLAUDE.md` -- Global user instructions (applies to all projects).
- `<project-root>/CLAUDE.md` -- Project-level instructions (checked into codebase).
- `.claude/rules/` -- Distributed rules directory for modular, granular instructions.

**Auto Memory (distinct from CLAUDE.md):**
- A persistent directory where Claude records learnings, patterns, and insights as it works.
- Unlike CLAUDE.md (instructions you write for Claude), auto memory contains **notes Claude writes for itself** based on session discoveries.

#### Claude Memory Tool API (Beta)

**Launched:** September 29, 2025
**Beta header required:** `context-management-2025-06-27`
**Available on:** Claude API, Amazon Bedrock, Google Cloud Vertex AI.

**How it works:**
- Client-side tool: Claude makes tool calls to perform memory operations. Your application executes them locally.
- Claude creates, reads, updates, and deletes files in a `/memories` directory.
- Complete developer control over where and how memory is stored.
- Uses visible tool calls -- you can inspect exactly what's being stored and retrieved.

**Performance metrics (Anthropic internal):**
- **84% token reduction** in extended workflows.
- **39% improvement** when combining memory with context editing on agentic search tasks.

**Rollout timeline:**
- September 2025: Team and Enterprise users.
- October 2025: Pro and Max subscribers.
- Memory tool beta: September 29, 2025.

**Source:** https://www.anthropic.com/news/context-management

#### Manthan Gupta's Reverse Engineering of Claude Memory

**Source:** https://manthanguptaa.in/posts/claude_memory/

Gupta found that Claude uses a fundamentally different architecture from ChatGPT:
- **On-demand tools and selective retrieval** (vs. ChatGPT's always-injected approach).
- Claude can search past conversations by topic or keyword **when it deems necessary**.
- `memory_user_edits` tool for explicit memory management.
- User memories = Claude's equivalent of ChatGPT's long-term facts, storing distilled, stable facts.

### 3.3 Google / Gemini Memory (Detailed)

**Sources:**
- https://www.shloked.com/writing/gemini-memory
- https://www.datastudios.org/post/google-gemini-context-window-token-limits-and-memory-in-2025

#### Architecture: Single Structured Document

**Storage:** A single `user_context` document with typed outline of short factual bullets.

**Schema structure:**
- Demographic information (name, age, location, education, work history)
- Interests and preferences (technologies, topics, long-term goals)
- Relationships (important people)
- Dated events, projects, and plans (tagged with approximate time)

#### Temporal Grounding (Unique Feature)

Each memory statement is annotated with:
- **Rationale** pointing back to the source interaction.
- **Source date** of the original conversation.

This makes Gemini **the first mainstream chatbot to surface temporal grounding explicitly**. The model knows something "because you said X on date Y," enabling it to interpret time-bound information as historical context rather than permanent identity traits.

Example: "considering a move to San Francisco (updated June 2024)" in late 2025 is interpreted as historical context, not present intention.

#### Access Control: Privacy-First

- The user data block is **off-limits by default**.
- The model is told the user profile is present but must **ignore it unless explicitly invited** for personalization.
- Can only reach into `user_context` when queries contain **trigger phrases** like "based on what you know about me."
- User can delete/reset at any time.
- Enterprise clients can disable entirely.
- Activity data management offers **three-month auto-delete windows**.

**Source (Shlok's deep analysis):** https://www.shloked.com/writing/gemini-memory

### 3.4 Updated Comparison Table

| Aspect | OpenAI (ChatGPT) | Anthropic (Claude) | Google (Gemini) |
|--------|-------------------|--------------------|--------------------|
| **Storage** | ~33 facts + ~15 pre-computed summaries | Markdown files (CLAUDE.md) + /memories | Single user_context document |
| **Retrieval** | Direct injection (no search) | On-demand tool-based retrieval | Injected alongside prompt, off by default |
| **Scope** | Global across all chats (April 2025: references all past chats) | Project-scoped | Session + opt-in personalization |
| **Temporal awareness** | Timestamps on summaries | File modification dates | Explicit temporal grounding with source dates |
| **Transparency** | Opaque (reverse-engineered) | Fully transparent (visible files, visible tool calls) | Semi-transparent (settings page) |
| **User control** | View/delete individual memories | Edit files directly, full control over /memories | Delete/reset, enterprise disable, 3-month auto-delete |
| **Retrieval mechanism** | No vector DB, no RAG | Context window search over loaded files | Single document injection |
| **Key performance claim** | -- | 84% token reduction, 39% improvement on agentic search | -- |
| **Philosophy** | Simplicity and speed | Transparency and developer control | Privacy-first, selective |
| **April 2025+ changes** | References all past conversations | Auto-memory (notes Claude writes for itself) | Rolled out globally late 2025 |

---

## 4. Memory Retrieval

### 4.1 The Stanford Generative Agents Formula (Detailed)

**Paper:** Joon Sung Park et al., "Generative Agents: Interactive Simulacra of Human Behavior." arXiv:2304.03442.
**Source:** https://arxiv.org/abs/2304.03442

The retrieval function scores all memories as a weighted combination:

```
Score = alpha_recency * Recency + alpha_importance * Importance + alpha_relevance * Relevance
```

**In the implementation, all alpha values are set to 1.** (Equal weighting.)

**Component details:**

| Component | How It's Computed | Range | Key Details |
|-----------|-------------------|-------|-------------|
| **Recency** | Exponential decay function over hours since last retrieved | [0, 1] after min-max normalization | Decay factor = 0.995 per sandbox game hour. Recently accessed memories score higher. |
| **Importance** | LLM-rated on 1-10 scale | [0, 1] after min-max normalization | 1 = mundane (e.g., "ate breakfast"), 10 = extremely poignant (e.g., "lost a family member"). Distinguishes core from mundane memories. |
| **Relevance** | Cosine similarity between memory embedding and query embedding | [0, 1] after min-max normalization | Uses language model embedding vectors. Enables "meaning-based" retrieval. |

**Score normalization:** All three scores normalized to [0, 1] using min-max scaling. Top-ranked memories that fit within the language model's context window are included in the prompt.

### 4.2 Modern Advances in Memory Retrieval

**Source:** https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1591618/full

Frontiers in Psychology published a 2025 paper "Enhancing memory retrieval in generative agents through LLM-trained cross attention networks" documenting several advances beyond the Stanford formula:

1. **Half-life recency decay**: More nuanced temporal modeling than simple exponential. Models "memory strength" that increases with repeated access but decays over time.
2. **LLM-based importance classification**: Moving beyond simple 1-10 scoring to richer, multi-dimensional importance assessments.
3. **Mixture-of-Experts (MoE) gate functions**: Allow retrieval weights to be **learned and dynamically adjusted** rather than manually set. This represents a shift from static to adaptive retrieval.
4. **Memory strength based on frequency**: Frequently accessed memories gain "strength," independent of recency.
5. **Cross-attention networks**: Training dedicated neural networks to perform the retrieval scoring, rather than relying on handcrafted formulas.

### 4.3 Hybrid Retrieval (Zep/Graphiti Approach)

Combining multiple retrieval signals:
- Dense embeddings (semantic similarity)
- Sparse BM25 (keyword matching)
- Graph traversal (relational reasoning)
- Temporal filtering (time-aware queries)

This is the approach used by Zep's Graphiti engine. See Section 6.3 for details.

### 4.4 LangMem's Approach

**Source:** https://langchain-ai.github.io/langmem/concepts/conceptual_guide/

Relevance combines:
- **Semantic similarity** (embedding cosine distance)
- **Importance** (LLM-assigned or heuristic)
- **Strength** (based on recency/frequency of use)

Two storage patterns:
- **Collections**: Searchable documents that grow over time. New facts appended.
- **Profiles**: Single structured documents following schemas, replaced on update.

---

## 5. Consolidation & Compression

### 5.1 SimpleMem: Three-Stage Semantic Compression (January 2026)

**Paper:** Jiaqi Liu, Yaofeng Su, Peng Xia, Siwei Han, Zeyu Zheng, Cihang Xie, Mingyu Ding, Huaxiu Yao. "SimpleMem: Efficient Lifelong Memory for LLM Agents." arXiv:2601.02553.
**Source:** https://arxiv.org/abs/2601.02553
**GitHub:** https://github.com/aiming-lab/SimpleMem

#### The Three Stages

1. **Semantic Structured Compression**: Distills unstructured interactions into compact, multi-view indexed memory units. Takes raw conversation and produces structured, tagged memory records.

2. **Online Semantic Synthesis**: Intra-session process that instantly integrates related context into unified abstract representations. Eliminates redundancy by merging overlapping memories in real-time.

3. **Intent-Aware Retrieval Planning**: Infers search intent to dynamically determine retrieval scope. Constructs precise context efficiently by understanding what the query actually needs.

#### Performance

- **26.4% F1 improvement** on LoCoMo benchmark.
- Token consumption reduced by up to **30x**.
- "Semantic lossless compression" -- preserves information density while dramatically reducing token count.

### 5.2 RCC: Never Compress Instructions with Context

**Paper:** "Recurrent Context Compression: Efficiently Expanding the Context Window of LLM." arXiv:2406.06110.
**Source:** https://arxiv.org/abs/2406.06110

**The critical finding:** When both context and instructions are compressed simultaneously, the model often struggles to follow instructions correctly, resulting in poor controllability. This issue was not emphasized in previous studies.

**Details:**
- Compression rate up to **32x** on text reconstruction tasks with BLEU4 close to 0.95.
- Nearly **100% accuracy** on passkey retrieval with sequence length of 1M tokens.
- **Solution: Instruction Reconstruction** -- reconstruct instructions separately from compressed context. Instructions are preserved and reconstructed during the compression process, maintaining the model's ability to follow commands.

**Practical takeaway for Part 3:** When building memory compression systems, always keep system instructions and procedural memory separate from the episodic/semantic context being compressed. Compressing them together degrades instruction following.

### 5.3 Consolidation Pathways in Practice

**Episodic to Semantic consolidation is the key pathway.** Repeated experiences should be compressed into general facts. The workflow:

1. Store individual interactions as episodic records (timestamped, contextual).
2. After N occurrences of a similar pattern, consolidate into a semantic fact.
3. Archive or delete the original episodes (or keep for provenance).

Example from the ADHDAgent case study in the existing research:
- 5 positive outcomes with "visual timer" strategy (episodic records)
- Consolidated to: "Visual timers are a proven strategy for this family" (semantic fact)

### 5.4 Multi-Level Memory Hierarchy

Most production systems converge on a three-tier model:

| Tier | Content | Token Budget | Update Frequency |
|------|---------|-------------|------------------|
| **Short-term** | Recent verbatim interactions | Largest | Every turn |
| **Mid-term** | Summarized recent sessions | Medium | Every N turns or end-of-session |
| **Long-term** | Consolidated facts, preferences, skills | Smallest | Episodic consolidation triggers |

---

## 6. The Memory Startup Landscape (Deep Comparison)

### 6.1 Mem0

**Sources:**
- Paper: https://arxiv.org/abs/2504.19413
- Pricing: https://mem0.ai/pricing
- Research: https://mem0.ai/research
- Blog: https://mem0.ai/blog/graph-memory-solutions-ai-agents

**Architecture:**
- Memory orchestration layer between AI agents and storage systems.
- Hybrid datastore: graph + vector + key-value.
- Doesn't just store data -- actively curates it. Updates, enriches, or cleans memory as new information arrives.
- Hierarchical memory at user, session, and agent levels.
- Graph variant (Mem0g) stores memories as directed labeled graphs for relational reasoning.
- MMR-based reranking + metadata-based filtering for refined retrieval.
- Versioned APIs.

**Performance:**
- 91% lower p95 latency vs. baseline.
- 90%+ token cost savings.
- 26% improvement over OpenAI on LLM-as-a-Judge metric.
- 186 million API calls per month (Q3 2025), growing 30% MoM.
- On multi-hop queries: F1 score 28.64, J score 51.15 (outperforms others clearly).

**Pricing (2025-2026):**
- Free: 10K memories, 1K retrieval calls/month.
- Starter: $19/month for 50K memories.
- Pro: $249/month (includes graph memory -- the most interesting feature is paywalled).
- Enterprise: Custom.
- Open-source self-hosting available (core platform is free).

**Funding:** $24M raised (YC, Peak XV, Basis Set). Exclusive memory provider for AWS Agent SDK.

**Limitations noted by practitioners:**
- Graph memory (the most compelling feature) requires Pro tier ($249/month).
- Self-hosting is a secondary concern; managed service is the priority.
- Context lengths can be so long that Mem0 cannot process and produce responses in reasonable time (noted in benchmark missing results).

### 6.2 Letta (formerly MemGPT)

**Sources:**
- Docs: https://docs.letta.com/concepts/memgpt/
- Blog: https://www.letta.com/blog/benchmarking-ai-agent-memory
- Context Repos: https://www.letta.com/blog/context-repositories
- GitHub: https://github.com/letta-ai/letta

**Architecture:**
- Virtual context management inspired by OS memory hierarchies (RAM + disk paging).
- Two tiers: archival memory (long-term) + recall memory (conversation history).
- Creates "the illusion of an unbounded context window" within token limits.
- Self-editing memory loops to manage ephemeral content efficiently.

**Key Benchmark Finding ("Is a Filesystem All You Need?"):**
- A simple Letta agent achieves **74.0% on LoCoMo** with GPT-4o-mini and minimal prompt tuning.
- This is **above Mem0's reported 68.5%** for their top-performing graph variant.
- "Agents are highly effective at using tools, especially filesystem operations. Specialized memory tools are less effective than simply allowing the agent to autonomously search through data with iterative querying."

**Source:** https://www.letta.com/blog/benchmarking-ai-agent-memory

**Context Repositories (February 2026):**
- Git-backed memory: every change automatically versioned with informative commit messages.
- Agents can write scripts and spawn memory subagents to restructure prior context programmatically.
- Built-in skills: `/init` for learning from old sessions, reflection for learning from recent history, defragmentation to reorganize memory over time.
- Enable with `/memfs enable`, inspect with `/memory`.
- Philosophy: "agents that can carry their memories across model generations will outlast any single foundation model."

**Source:** https://www.letta.com/blog/context-repositories

**DeepLearning.AI course:** "LLMs as Operating Systems: Agent Memory" (with Andrew Ng's platform).

### 6.3 Zep / Graphiti

**Sources:**
- Paper: https://arxiv.org/abs/2501.13956
- GitHub: https://github.com/getzep/graphiti
- Neo4j partnership: https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/

**Architecture (Temporal Knowledge Graph):**

The formal definition: G = (N, E, phi), where N = nodes, E = edges, phi: E -> N x N = incidence function.

Three hierarchical tiers:

1. **Episode Subgraph**: Records episodic memory. Each node = raw event or message annotated with original event timestamp. Includes JSON documents, conversation logs, transactional snapshots. Maintained as ground truth corpus.

2. **Semantic Entity Subgraph**: Extracted facts between pairs of entities. Each fact = self-contained proposition with entity names as an atomic unit of context-free information. Same fact can be extracted multiple times between different entities (hyper-edges).

3. **Community Subgraph**: Community detection via label propagation algorithm (not Leiden). Enables maintaining accurate community representations as new data enters the graph.

**Temporal Management (four timestamps per edge):**
- `t'_created`: When the fact was created in the system.
- `t'_expired`: When the fact was invalidated in the system.
- `t_valid`: When the fact started being true in the real world.
- `t_invalid`: When the fact stopped being true in the real world.

This dual-timestamp approach allows tracking both system events and real-world validity periods.

**Performance:**
- **94.8% on DMR benchmark** (vs. 93.4% for MemGPT).
- Sub-200ms retrieval latency.
- p95 search latency: 0.632 seconds.

**Zep's response to Mem0's claims ("Is Mem0 Really SOTA?"):**
- https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/
- Zep achieves 75.14% score, outperforming Mem0's best configuration by ~10% relative improvement.
- Zep's p95 search latency (0.632s) faster than Mem0's reported Zep latency (0.778s) and slightly faster than Mem0's own graph search (0.657s).

**Integration:** Amazon Neptune partnership for enterprise deployment.

### 6.4 Supermemory

**Sources:**
- https://supermemory.ai/
- https://supermemory.ai/research
- https://github.com/supermemoryai/memorybench

**Key claims:**
- Universal memory API with industry-leading speed.
- **10x faster than Zep, 25x faster than Mem0** (retrieval in milliseconds).
- Semantic memory at scale with temporal awareness on vector-based recall.

**MemoryBench (open-source benchmark framework):**
- Created by Supermemory.
- Unified benchmark for evaluating conversational memory and RAG.
- Includes: LoCoMo (temporal reasoning), LongMemEval (long-term memory), ConvoMem (conversational memory).
- Single CLI for fair, reproducible evaluation across providers.

**Source:** https://github.com/supermemoryai/memorybench

**Background:**
- $3M raised (Susa Ventures, backed by Cloudflare CTO).
- Founded by a 19-year-old, backed by Google execs.

### 6.5 LangMem (LangChain)

**Sources:**
- Blog: https://blog.langchain.com/langmem-sdk-launch/
- Docs: https://langchain-ai.github.io/langmem/concepts/conceptual_guide/
- GitHub: https://github.com/langchain-ai/langmem

**Architecture:**

Three memory types with two formation modes:

| Memory Type | What It Stores | Formation |
|-------------|---------------|-----------|
| **Semantic** | Facts (Collections = searchable, growing docs; Profiles = fixed-schema, replaced on update) | Both hot path and background |
| **Episodic** | Past interactions, distilled into few-shot examples | Primarily background |
| **Procedural** | Evolved system instructions, learned behaviors | Background (prompt refinement) |

**Two formation modes:**
- **Hot path**: During conversation. Agent uses built-in tools to record and search information in real-time as dialog progresses. Immediate needs.
- **Background**: Post-conversation reflection. Automatic extraction, consolidation, and update of agent knowledge. Comprehensive analysis.

**DeepLearning.AI course:** "Long-Term Agentic Memory with LangGraph" -- https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/

### 6.6 Cognee

**Sources:**
- GitHub: https://github.com/topoteretes/cognee
- Blog: https://www.cognee.ai/blog/fundamentals/llm-memory-cognitive-architectures-with-ai
- Evaluation: https://www.cognee.ai/blog/deep-dives/ai-memory-tools-evaluation

**Architecture:**
- Knowledge engine combining vector search + graph databases + self-improvement.
- Pipeline: Ingestion (30+ sources) -> Enrichment (embeddings + graph "memify") -> Retrieval.
- Supported graph backends: Kuzu, Neo4j, Memgraph, NetworkX.
- Human cognitive architecture inspiration: mimics how humans construct mental maps.

**"Memify" pipeline:**
- Raw data -> embedding generation -> triplet extraction (subject-relation-object) -> knowledge graph construction.
- Entities represented with granular, context-rich connections rather than flat vector similarities.

**Performance (2025):**
- Evaluated on HotPotQA, TwoWikiMultiHop, Musique benchmarks.
- Graph-completion retrievers consistently outperform simpler retrievers in correctness and performance.
- ~1 GB processed in 40 minutes using 100+ containers.
- Current version: v0.3 (v1.0 on horizon).

**Cognee's own evaluation of competitors:**
- https://www.cognee.ai/blog/deep-dives/ai-memory-tools-evaluation
- Evaluated Cognee, Mem0, Zep/Graphiti on shared benchmarks.

### 6.7 MemOS (Multiple Implementations)

#### MemTensor's MemOS

**Sources:**
- Paper: https://arxiv.org/abs/2507.03724
- GitHub: https://github.com/MemTensor/MemOS

**Architecture:** Three-layer design:
1. **Memory API Layer**: Interface for applications.
2. **Memory Scheduling and Management Layer**: Orchestration, lifecycle management.
3. **Memory Storage and Infrastructure Layer**: Physical storage backends.

**MemCube abstraction:**
- Standardized memory unit containing: Memory Payload (semantic content) + Metadata (identity, control, behavioral metrics).
- Enables tracking, fusion, and migration of heterogeneous memory.
- Organizes semantic fragments into multi-dimensional structure for query-based aggregation.

**Three core memory types:**
- **Parametric Memory**: Embedded in model weights.
- **Activation Memory**: Active representations during inference.
- **Plaintext Memory**: External text-based storage.

**Next-Scene Prediction mechanism:**
- Proactively preloads relevant memory fragments during inference.
- Significantly reduces latency and token consumption.

**LoCoMo Benchmark Results:**
- **159% improvement in temporal reasoning** over OpenAI's global memory.
- **38.97% overall accuracy gain**.
- **60.95% reduction in token overhead**.

**Release:** MemOS v1.0 "Stellar" Preview (July 2025). Open-source, compatible with HuggingFace, OpenAI, Ollama.

#### BAI-LAB's MemoryOS

**Source:** https://github.com/BAI-LAB/MemoryOS
- EMNLP 2025 Oral paper.
- Hierarchical storage architecture for personalized AI agents.

### 6.8 ENGRAM

**Paper:** "ENGRAM: Effective, Lightweight Memory Orchestration for Conversational Agents." arXiv:2511.12960.
**Source:** https://arxiv.org/abs/2511.12960

**Architecture:**
- Single router + single retriever operating over three canonical memory types (episodic, semantic, procedural).
- Each user turn converted into typed memory records with normalized schemas and embeddings.
- At query time: retrieve top-k dense neighbors for each type, merge with simple set operations, provide as context.

**Performance on LoCoMo:**
- Highest overall semantic correctness: **LLM-as-Judge score of 77.55**.
- Multi-hop: **79.79**.
- Open-domain: **72.92**.
- Single-hop reasoning: **79.90**.
- Exceeds full-context baseline by **15 points on LongMemEval** while using only **~1% of tokens**.

**Key insight:** "Simple typed memory + semantic retrieval outperforms complex graph construction." Careful memory typing and straightforward dense retrieval can be enough.

### 6.9 A-MEM (Zettelkasten-Inspired Memory)

**Paper:** Wujiang Xu, Zujie Liang et al. "A-MEM: Agentic Memory for LLM Agents." arXiv:2502.12110. NeurIPS 2025.
**Source:** https://arxiv.org/abs/2502.12110
**GitHub:** https://github.com/WujiangXu/A-mem

**How it works:**

Combines the structured organization principles of **Zettelkasten** (the note-taking method where every note is a self-contained idea linked to other notes) with agent-driven decision making.

**Process when a new memory is added:**
1. A comprehensive **note** is generated containing structured attributes: contextual descriptions, keywords, tags.
2. The system **analyzes historical memories** to identify relevant connections.
3. **Links** are established where meaningful similarities exist.
4. **Memory evolution**: as new memories integrate, they trigger updates to contextual representations and attributes of existing historical memories.

This creates **interconnected knowledge networks through dynamic indexing and linking** -- not a static store, but a living graph of ideas.

**Why Zettelkasten is a good metaphor:**
- Each memory note is self-contained (can be understood in isolation).
- Notes link to related notes (enabling traversal and discovery).
- The network grows organically (no predetermined schema).
- Old notes evolve as new connections form.

**Evaluation:** Empirical experiments on six foundation models show superior improvement against existing SOTA baselines. Accepted at NeurIPS 2025.

### 6.10 Comparative Decision Framework

| If you need... | Use... | Why |
|----------------|--------|-----|
| Fastest path to production | **Mem0** (managed) | SOC 2 compliant, handles infra, scales automatically |
| Maximum transparency + control | **Letta** | Open-source OS-inspired architecture, filesystem-based |
| Temporal reasoning about facts | **Zep/Graphiti** | Four-timestamp system tracks fact validity over time |
| Speed above all else | **Supermemory** | 10x faster than Zep, millisecond retrieval |
| LangChain/LangGraph ecosystem | **LangMem** | Native integration, hot path + background modes |
| Knowledge graph + vector hybrid | **Cognee** | Multi-backend graph support, "memify" pipeline |
| OS-level memory management | **MemOS** | MemCube abstraction, Next-Scene Prediction |
| Lightweight, simple, effective | **ENGRAM** | SOTA on LoCoMo with ~1% of tokens |
| Dynamic self-organizing memory | **A-MEM** | Zettelkasten-inspired, NeurIPS 2025 |

**Source for comparison framework:** https://medium.com/asymptotic-spaghetti-integration/from-beta-to-battle-tested-picking-between-letta-mem0-zep-for-ai-memory-6850ca8703d1

**Maturity assessment (from practitioner review):**
> "Go with Mem0 if you need a functional AI memory solution right now, prefer a managed SaaS offering, and have the budget for their plans, but be prepared to rely on their cloud service, as self-hosting seems like a secondary concern."
>
> "Neither Letta nor Zep feels quite ready for production-oriented stress testing" (as of mid-2025).

**Letta's counterpoint:** Their 74% LoCoMo score with a simple filesystem agent suggests that specialized memory tools may be overengineered for many use cases.

---

## 7. Memory Security

### 7.1 MINJA: Memory Injection Attack

**Paper:** "Memory Injection Attacks on LLM Agents via Query-Only Interaction." arXiv:2503.03704.
**Source:** https://arxiv.org/abs/2503.03704

**How it works:**
- MINJA injects malicious records into the agent's memory bank **solely via queries** (no direct memory access needed).
- The injected records are designed to trigger malicious reasoning for queries containing a specific "victim term."
- Uses: bridging steps, an indication prompt, and a progressive shortening strategy.
- The attacker interacts with the agent through normal queries. The agent stores its memories of these interactions. Those memories contain hidden malicious patterns.

**Attack success metrics:**
- Over **95% Injection Success Rate (ISR)** across all LLM-based agents and datasets.
- Over **70% Attack Success Rate (ASR)** on most datasets.
- Average ISR: **98.2%**, average ASR: **76.8%** (per some analyses).
- Tested against: GPT-4o-mini, Gemini-2.0-Flash, Llama-3.1-8B.

**Why existing defenses fail:**
- Detection-based moderation (e.g., Llama Guard): ineffective because injected records appear harmless in isolation.
- Memory sanitization: struggles because the malicious effect is only activated within a specific context.
- Advanced detectors **miss 66% of poisoned entries** because they appear contextually innocuous.

**Practical impact:** Maintains attack effectiveness while minimally disrupting the agent's intended functionality. The poisoned memories look normal until triggered.

### 7.2 MemoryGraft: Poisoned Experience Retrieval

**Paper:** "MemoryGraft: Persistent Compromise of LLM Agents via Poisoned Experience Retrieval." arXiv:2512.16962. December 2025.
**Source:** https://arxiv.org/abs/2512.16962

**How it works:**
- Implants malicious "successful experiences" into long-term memory.
- Exploits the agent's **semantic imitation heuristic**: tendency to replicate patterns from retrieved successful tasks.
- Crafts entries that masquerade as legitimate successful experiences.
- Injection vector: benign-looking content (e.g., README files).
- When the agent tackles a semantically similar task, it retrieves and trusts the grafted memories.

**Key distinction from MINJA:** MemoryGraft targets episodic/procedural memory (learned behaviors from past successes), not just factual recall. The attack is more insidious because the agent actively wants to replicate "successful" patterns.

**Validation:**
- Tested on MetaGPT (multi-agent software engineering framework).
- Grafted memories led agents to adopt unsafe patterns: skipping tests, force-pushing code.
- Achieves up to **~48% poisoned recall** by leveraging dual retrieval mechanisms (BM25 + FAISS).

**Self-reinforcing error cycle:** The corrupted outcome gets stored as precedent, amplifying the initial error and progressively lowering the threshold for similar attacks.

### 7.3 Memory Poisoning Attack and Defense (January 2026)

**Paper:** "Memory Poisoning Attack and Defense on Memory Based LLM-Agents." arXiv:2601.05504.
**Source:** https://arxiv.org/abs/2601.05504

This paper proposes both attack and defense mechanisms:

**Novel defense mechanisms:**
1. **Input/Output Moderation**: Composite trust scoring across multiple orthogonal signals. Two-stage gating: static heuristics + keyword matching + LLM-based semantic classification.
2. **Memory Sanitization with Trust-Aware Retrieval**: Temporal decay + pattern-based filtering. Careful trust threshold calibration needed to avoid over-conservative rejection or insufficient filtering.

### 7.4 A-MemGuard: Proactive Defense Framework

**Paper:** "A-MemGuard: A Proactive Defense Framework for LLM-Based Agent Memory." arXiv:2510.02373.
**Source:** https://arxiv.org/abs/2510.02373

**Authors:** Nanyang Technological University, University of Oxford, Max Planck Institute, Ohio State University.

**Two mechanisms:**
1. **Consensus-based validation**: For each query, multiple related memories form parallel reasoning paths. If one path pushes toward anomalous behavior while the majority do not, the deviation is flagged.
2. **Dual-memory structure**: Detected failures are distilled into "lessons" stored separately. These lessons are consulted before future actions, breaking error cycles.

**Results:**
- Cuts attack success rates by over **95%** while incurring minimal utility cost.
- Shifts LLM memory security from static filtering to **proactive, experience-driven defense** that strengthens over time.

### 7.5 Defense Checklist for Production Systems

Synthesized from MINJA, MemoryGraft, A-MemGuard, and Lakera's agentic AI threat analysis:

**Input Validation:**
- [ ] Treat all external influences as untrusted input.
- [ ] Validate objectives continuously, not just at entry.
- [ ] Sanitize entries before writing to memory (like web apps validate form inputs).

**Provenance Tracking:**
- [ ] Tag every memory item with source, timestamp, and trigger.
- [ ] Track which interaction created each memory (audit trail).
- [ ] Consider cryptographic provenance attestation: sign validated experiences with enclave-protected keys.

**Retrieval Security:**
- [ ] Implement trust-aware retrieval with temporal decay.
- [ ] Use consensus-based validation for high-stakes actions.
- [ ] Cross-check retrieved memories against multiple related memories before acting.

**Architectural Defense:**
- [ ] Namespace-based isolation (user_id) to prevent cross-user contamination.
- [ ] Project-scoped memory (Anthropic's approach) to prevent context leakage.
- [ ] Separate "lessons learned" memory from operational memory (A-MemGuard pattern).

**User Controls:**
- [ ] Ability to view, edit, delete memories.
- [ ] Explicit opt-in for sensitive information storage.
- [ ] Enterprise compliance features to disable memory entirely.

**Monitoring:**
- [ ] Detect anomalous memory write patterns.
- [ ] Flag sudden changes in procedural behavior.
- [ ] Monitor for self-reinforcing error cycles.

**Sources:**
- https://www.lakera.ai/blog/agentic-ai-threats-p1
- https://unit42.paloaltonetworks.com/indirect-prompt-injection-poisons-ai-longterm-memory/
- https://mem0.ai/blog/ai-memory-security-best-practices

---

## 8. Practitioner Perspectives

### 8.1 Letta's "Is a Filesystem All You Need?" Finding

**Source:** https://www.letta.com/blog/benchmarking-ai-agent-memory

The most provocative finding in the memory landscape: a simple Letta agent using filesystem operations (read/write/search files) achieves **74.0% on LoCoMo** with GPT-4o-mini and minimal prompt tuning, beating Mem0's graph variant at 68.5%.

**Implication:** For many use cases, giving an agent access to a filesystem with grep/search may be more effective than sophisticated memory frameworks. The agent's own ability to iteratively query and reason over stored data is more powerful than pre-built retrieval pipelines.

This echoes Anthropic's CLAUDE.md approach: simple, transparent file-based memory can be surprisingly effective.

### 8.2 The Memory-as-Infrastructure Response

**Source:** https://blog.amotivv.io/memory-as-infrastructure-a-response-to-chatgpts-pragmatic-approach/

A response to Gupta's ChatGPT reverse engineering argues that OpenAI's pragmatic approach (no RAG, no vector DB) is actually wise for consumer products where speed and simplicity matter, but insufficient for enterprise applications requiring:
- Multi-user memory isolation
- Compliance and audit trails
- Complex relational reasoning
- Temporal fact tracking

### 8.3 Six-AI-Assistant Memory Comparison

**Source:** https://luluyan.medium.com/i-compared-memory-systems-across-6-major-ai-assistants-heres-what-i-found-8c62ba214a1d

Lulu Yan (December 2025) compared memory across six major AI assistants. Findings corroborate the three distinct philosophies:
- OpenAI: Speed through simplicity
- Anthropic: Transparency through files
- Google: Privacy through selective access

### 8.4 LangChain's State of Agent Engineering

**Source:** https://www.langchain.com/state-of-agent-engineering

Key stat: **57% of surveyed professionals have agents in production**, with **32% citing quality as a top barrier**. Memory design is identified as a critical factor in whether agents "feel helpful or frustrating."

### 8.5 Production Insights from Amazon

**Source:** https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-lessons-from-building-agentic-systems-at-amazon/

Amazon's real-world lessons emphasize that agentic AI systems require assessment of:
- Tool selection accuracy
- Memory retrieval operation efficiency
- Overall task completion success rates

### 8.6 The New Stack: Memory as a New Paradigm

**Source:** https://thenewstack.io/memory-for-ai-agents-a-new-paradigm-of-context-engineering/

Memory is positioned as the next evolution of context engineering, moving from "what information should the model see right now?" to "what should the system remember across time?"

### 8.7 MemAgents Workshop (ICLR 2026)

**Source:** https://openreview.net/pdf?id=U51WxL382H

The academic community has recognized memory as a first-class research topic with a dedicated ICLR 2026 workshop, signaling that memory engineering is moving from practitioner craft to formal research discipline.

---

## Appendix: Key Numbers for Quick Reference

| Metric | Value | Source |
|--------|-------|--------|
| LongMemEval accuracy degradation (commercial systems) | ~30% | LongMemEval (ICLR 2025) |
| LongMemEval max context degradation | 73% drop | LongMemEval extended analysis |
| ChatGPT stored facts per user | ~33 | Manthan Gupta reverse engineering |
| ChatGPT recent summaries | ~15 | Manthan Gupta reverse engineering |
| Claude memory tool token reduction | 84% | Anthropic internal |
| Claude memory + context editing improvement | 39% | Anthropic internal |
| SimpleMem F1 improvement | 26.4% | SimpleMem (arXiv:2601.02553) |
| SimpleMem token reduction | 30x | SimpleMem (arXiv:2601.02553) |
| MemOS temporal reasoning improvement vs. OpenAI | 159% | MemOS (arXiv:2507.03724) |
| MemOS overall accuracy gain | 38.97% | MemOS (arXiv:2507.03724) |
| MemOS token overhead reduction | 60.95% | MemOS (arXiv:2507.03724) |
| ENGRAM LLM-as-Judge (LoCoMo) | 77.55 | ENGRAM (arXiv:2511.12960) |
| ENGRAM vs. full-context (LongMemEval) | +15 points with ~1% tokens | ENGRAM (arXiv:2511.12960) |
| Letta filesystem LoCoMo score | 74.0% | Letta benchmarking blog |
| Mem0 graph variant LoCoMo score | 68.5% | Letta benchmarking blog |
| Zep DMR benchmark | 94.8% | Zep (arXiv:2501.13956) |
| Zep p95 search latency | 0.632s | Zep benchmark |
| Mem0 API calls per month | 186 million | Mem0 Q3 2025 |
| Mem0 funding | $24M | TechCrunch Oct 2025 |
| Supermemory funding | $3M | TechCrunch Oct 2025 |
| RCC compression rate | 32x (BLEU4 ~0.95) | RCC (arXiv:2406.06110) |
| MINJA injection success rate | >95% (avg 98.2%) | MINJA (arXiv:2503.03704) |
| MINJA attack success rate | >70% (avg 76.8%) | MINJA (arXiv:2503.03704) |
| MINJA detector evasion | 66% missed | MINJA (arXiv:2503.03704) |
| MemoryGraft poisoned recall | ~48% | MemoryGraft (arXiv:2512.16962) |
| A-MemGuard attack reduction | >95% | A-MemGuard (arXiv:2510.02373) |
| Stanford Generative Agents decay factor | 0.995 per hour | Park et al. 2023 |
| LangChain survey: agents in production | 57% | LangChain State of Agent Engineering |
| LangChain survey: quality as top barrier | 32% | LangChain State of Agent Engineering |

---

## Appendix: Source Index

### Papers

1. LongMemEval: https://arxiv.org/abs/2410.10813
2. CoALA: https://arxiv.org/abs/2309.02427
3. Generative Agents (Stanford): https://arxiv.org/abs/2304.03442
4. A-MEM: https://arxiv.org/abs/2502.12110
5. ENGRAM: https://arxiv.org/abs/2511.12960
6. SimpleMem: https://arxiv.org/abs/2601.02553
7. Zep/Graphiti: https://arxiv.org/abs/2501.13956
8. Mem0: https://arxiv.org/abs/2504.19413
9. MemOS (MemTensor): https://arxiv.org/abs/2507.03724
10. MemoryOS (BAI-LAB): https://arxiv.org/abs/2505.22101
11. MINJA: https://arxiv.org/abs/2503.03704
12. MemoryGraft: https://arxiv.org/abs/2512.16962
13. A-MemGuard: https://arxiv.org/abs/2510.02373
14. Memory Poisoning Attack and Defense: https://arxiv.org/abs/2601.05504
15. RCC (Recurrent Context Compression): https://arxiv.org/abs/2406.06110
16. Memory in the Age of AI Agents (survey): https://arxiv.org/abs/2512.13564
17. From Human Memory to AI Memory: https://arxiv.org/html/2504.15965v1
18. Episodic Memory position paper: https://arxiv.org/pdf/2502.06975
19. Enhancing Memory Retrieval (Frontiers): https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1591618/full
20. MemAgents ICLR 2026 Workshop: https://openreview.net/pdf?id=U51WxL382H

### Blog Posts and Practitioner Sources

21. Manthan Gupta - ChatGPT Memory: https://manthanguptaa.in/posts/chatgpt_memory/
22. Manthan Gupta - Claude Memory: https://manthanguptaa.in/posts/claude_memory/
23. Leonie Monigatti - Memory in AI Agents: https://www.leoniemonigatti.com/blog/memory-in-ai-agents.html
24. Leonie Monigatti - Claude Memory Tool: https://www.leoniemonigatti.com/blog/claude-memory-tool.html
25. Leonie Monigatti - RAG to Agent Memory: https://www.leoniemonigatti.com/blog/from-rag-to-agent-memory.html
26. Shlok Khemani - Gemini Memory: https://www.shloked.com/writing/gemini-memory
27. Shlok Khemani - ChatGPT Memory Bitter Lesson: https://www.shloked.com/writing/chatgpt-memory-bitter-lesson
28. Letta - Benchmarking AI Agent Memory: https://www.letta.com/blog/benchmarking-ai-agent-memory
29. Letta - Context Repositories: https://www.letta.com/blog/context-repositories
30. Zep SOTA claim: https://blog.getzep.com/state-of-the-art-agent-memory/
31. Zep response to Mem0: https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/
32. Calvin Ku - Letta vs Mem0 vs Zep: https://medium.com/asymptotic-spaghetti-integration/from-beta-to-battle-tested-picking-between-letta-mem0-zep-for-ai-memory-6850ca8703d1
33. Cognee evaluation: https://www.cognee.ai/blog/deep-dives/ai-memory-tools-evaluation
34. Lulu Yan - 6 AI Assistants comparison: https://luluyan.medium.com/i-compared-memory-systems-across-6-major-ai-assistants-heres-what-i-found-8c62ba214a1d
35. Memory as Infrastructure (Amotivv): https://blog.amotivv.io/memory-as-infrastructure-a-response-to-chatgpts-pragmatic-approach/
36. LLMRefs - ChatGPT reverse engineering: https://llmrefs.com/blog/reverse-engineering-chatgpt-memory
37. Lakera - Agentic AI Threats: https://www.lakera.ai/blog/agentic-ai-threats-p1
38. Mem0 Security: https://mem0.ai/blog/ai-memory-security-best-practices
39. The New Stack - Memory as paradigm: https://thenewstack.io/memory-for-ai-agents-a-new-paradigm-of-context-engineering/
40. LangChain State of Agent Engineering: https://www.langchain.com/state-of-agent-engineering

### Official Documentation

41. Anthropic Memory Tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
42. Anthropic Context Management: https://www.anthropic.com/news/context-management
43. Claude Code Memory: https://docs.anthropic.com/en/docs/claude-code/memory
44. OpenAI Memory FAQ: https://help.openai.com/en/articles/8590148-memory-faq
45. OpenAI Memory announcement: https://openai.com/index/memory-and-new-controls-for-chatgpt/
46. Mem0 Pricing: https://mem0.ai/pricing
47. LangMem Docs: https://langchain-ai.github.io/langmem/concepts/conceptual_guide/
48. LangMem Hot Path: https://langchain-ai.github.io/langmem/hot_path_quickstart/
49. Supermemory Research: https://supermemory.ai/research
50. MemoryBench: https://github.com/supermemoryai/memorybench
