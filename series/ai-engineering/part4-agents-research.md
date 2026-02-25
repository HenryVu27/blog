# Part 4 Research: Building AI Agents — Context as the Control Plane

> Deep research compiled February 24, 2026. All sources verified via web search. Organized by the six planned sections of Part 4.

---

## Table of Contents

1. [The Agent Loop](#1-the-agent-loop)
2. [Tool-Integrated Reasoning](#2-tool-integrated-reasoning)
3. [Lessons from Manus](#3-lessons-from-manus)
4. [Anthropic's Agent Patterns](#4-anthropics-agent-patterns)
5. [Context Window Management](#5-context-window-management)
6. [Production Lessons](#6-production-lessons)
7. [Agent Benchmarks 2025-2026](#7-agent-benchmarks-2025-2026)
8. [Practitioner Perspectives](#8-practitioner-perspectives)
9. [Long-Context Processing Architectures](#9-long-context-processing-architectures)
10. [Full Source Index](#10-full-source-index)

---

## 1. The Agent Loop

### 1.1 The ReAct Pattern — Foundation of Modern Agents

**Original paper:** "ReAct: Synergizing Reasoning and Acting in Language Models" by Shunyu Yao et al. First submitted October 6, 2022; published at ICLR 2023.
- Source: https://arxiv.org/abs/2210.03629
- Project page: https://react-lm.github.io/

**Core mechanism:** ReAct interleaves verbal reasoning traces ("thoughts") with task-specific actions in an alternating loop. Actions lead to observation feedback from an external environment; reasoning traces do not affect the external environment but help the model induce, track, and update action plans.

**The canonical loop format:**

```
Thought: I need to find out when the Eiffel Tower was built.
Action: Search["Eiffel Tower construction date"]
Observation: The Eiffel Tower was constructed from 1887 to 1889...
Thought: Now I know the construction period. Let me formulate the answer.
Action: Finish["The Eiffel Tower was built between 1887 and 1889."]
```

**What the LLM sees at each step:**
1. The system prompt (instructions, persona, tool definitions)
2. The full conversation history up to that point (all prior Thought/Action/Observation triples)
3. The latest observation from the environment
4. A prompt to generate the next Thought + Action

The process involves: constructing a ReAct prompt from chat history and tools, calling the LLM, parsing out function/tool calls, executing tools with error handling, adding tool outputs to current reasoning, then looping for another round.

Source: https://docs.llamaindex.ai/en/stable/examples/workflow/react_agent/

**Performance results from original paper:**
- On question answering (HotpotQA) and fact verification (Fever) with Wikipedia API: competitive with chain-of-thought reasoning
- On interactive decision-making benchmarks (ALFWorld, WebShop): outperforms imitation and RL methods with absolute improvements of 34% and 10% in success rates respectively

**Documented limitations:**
- **Repetition loops:** The model repetitively generates previous thoughts and actions, failing to reason about the proper next action
- **Non-informative search:** Accounts for 23% of error cases; derails model reasoning and makes recovery difficult
- **Inefficiency:** Each reasoning step requires an additional inference pass; agents can get stuck in reasoning loops or take unnecessarily verbose paths
- **Context bloat:** Every Thought/Action/Observation triple accumulates in context, rapidly filling the window on multi-step tasks

Source: https://arxiv.org/abs/2210.03629

### 1.2 The Modern Tool-Calling Pipeline

Modern agents have largely moved from text-parsed ReAct prompts to native tool-calling APIs. The distinction matters for implementation.

**ReAct-style (text-parsed):** The LLM generates structured text (e.g., "Action: search[query]") which is regex-parsed by the harness. Fragile; depends on consistent formatting.

**Native tool-calling:** The LLM returns structured JSON tool calls via the API. More reliable; schema-enforced. OpenAI recommends: "Setting strict to true will ensure function calls reliably adhere to the function schema."

Source: https://developers.openai.com/api/docs/guides/function-calling/

**Letta's analysis of the evolution** (October 2025):
- ReAct: reasoning in text, actions parsed from text output
- MemGPT: made every action a tool call (including `send_message`), enabling tool schemas to manage reasoning and control flow via injected keyword arguments
- Modern agents (Claude Code, etc.): native tool calling with reasoning in the model's chain-of-thought, tool results appended to context

Key insight from Letta: "Although both ReAct and MemGPT are technically just 'LLMs in a loop', the way the underlying LLM is used differs significantly and results in different agent behaviors." MemGPT's reliance on tool calling meant only models capable of reliable tool-calling could work with it.

Source: https://www.letta.com/blog/letta-v1-agent

### 1.3 Anatomy of What the LLM Sees

At each step in a modern agent loop, the context window contains (in order):

1. **System prompt** — instructions, persona, behavioral constraints
2. **Tool definitions** — JSON schemas describing available tools (these consume tokens!)
3. **Conversation history** — all prior user messages, assistant messages, tool calls, and tool results
4. **Current user message or latest observation** — the immediate input

The total token count grows with every loop iteration. For a typical coding agent task:
- System prompt: ~2,000-5,000 tokens
- Tool definitions (10-20 tools): ~3,000-8,000 tokens
- Each tool call + result: ~500-5,000 tokens per step
- Average task requiring 50 tool calls (Manus's reported average): can consume 25,000-250,000 tokens of context

This is why context management is the central engineering challenge for agents.

### 1.4 ReAct vs Plan-and-Execute

Two competing agent architectures:

**ReAct:** Interleaved reasoning and acting. Flexible, can adapt mid-task. But: prone to context bloat, expensive (every step sees full history), can lose track of global plan.

**Plan-and-Execute:** First create a complete plan, then execute steps. More structured, better for complex multi-step tasks. But: less adaptive to unexpected situations, plan may become stale.

**Hybrid approaches** (increasingly common in production):
- Plan first, then execute with ReAct-style adaptation within each step
- Manus's todo.md approach (see Section 3) bridges both: maintains a plan document that gets updated as the agent progresses

Source: https://dev.to/jamesli/react-vs-plan-and-execute-a-practical-comparison-of-llm-agent-patterns-4gh9

---

## 2. Tool-Integrated Reasoning

### 2.1 Evolution of Tool Use in LLMs

**Toolformer (Schick et al., 2023)** — NeurIPS 2023
- Demonstrated that LLMs could teach themselves to use calculator and search APIs via self-supervised fine-tuning
- Method: generates a language modeling dataset with embedded API calls, then fine-tunes to enhance future token predictions
- Significance: proved tool use could be learned, not just prompted

**Gorilla (Patil et al., 2023-2024)** — NeurIPS 2024
- A finetuned LLaMA-based model that surpasses GPT-4 on writing API calls
- Introduced Retriever Aware Training (RAT): enables the model to adapt to test-time document changes (version changes, argument updates)
- Evaluated on APIBench: HuggingFace, TorchHub, and TensorHub APIs
- Key contribution: showed that LLMs could be trained to select from large, overlapping, and changing tool sets

Source: https://arxiv.org/abs/2305.15334
Source: https://github.com/ShishirPatil/gorilla

**ToolLLM (Qin et al., 2024)**
- Instruction tuning and retrieval-based mechanisms to select tools from massive API libraries (e.g., RapidAPI)
- Extended tool use to general-domain queries beyond scientific/ML APIs

**Dynamic tool generation** (2024-2025):
- CREATOR (Qian et al., 2023) and CRAFT (Yuan et al., 2024): LLMs synthesize custom tools via code generation
- Shift from "selecting the right tool" to "creating the right tool"

### 2.2 Three Categories of Tool-Integrated Reasoning

The field has converged on three primary approaches:

**1. Prompting-based (in-context learning)**
- ReAct, chain-of-thought with tools
- No training required; relies on model's existing capabilities
- Limitation: depends heavily on prompt quality and model's pre-trained tool-use ability
- Examples: ReAct prompting, Anthropic's tool-use patterns

**2. Supervised Fine-Tuning (SFT)**
- Toolformer, ToRA, Aimo-2, Gorilla
- Trains on demonstrations of correct tool usage
- Limitation: requires large-scale, high-quality demonstration data; often suffers from poor generalization to unseen tools
- "SFT-based methods like Toolformer and Aimo-2 require large-scale, high-quality demonstration data and often suffer from poor generalization"

**3. Reinforcement Learning (RL)**
- Search-R1, ToolRL, START, ToRL, Tool-Star, AutoTIR, THOR
- Learns tool use through outcome-based rewards
- Advantages: "RL algorithms can be leveraged to train LLMs for robust and context-aware tool selection, with results demonstrating improvements of 17% over base models and 15% over SFT models"
- Emergent behaviors: "proactiveness and metacognitive reasoning"
- Key innovation in Search-R1: retrieved token masking for stable RL training

Source: https://aclanthology.org/2025.findings-emnlp.485.pdf
Source: https://openreview.net/pdf/097ae4a34c2eb2b82b2bb8fccc279fb0e3585304.pdf

### 2.3 Search-R1: RL for Search-Augmented LLMs

**Paper:** "Search-R1: Training LLMs to Reason and Leverage Search Engines with Reinforcement Learning" (March 2025)
- Source: https://arxiv.org/abs/2503.09516

**What it does:** LLM learns to autonomously generate multiple search queries during step-by-step reasoning with real-time retrieval. Optimized using simple outcome-based reward. Training stabilized by masking losses on retrieved tokens.

**Performance:**
- Improves performance by 41% (Qwen2.5-7B) and 20% (Qwen2.5-3B) over various RAG baselines
- Tested across seven question-answering datasets

**Key insight:** The model doesn't just learn when to search; it learns how to formulate queries that produce useful context for the current reasoning step.

### 2.4 The Cognitive Offloading Question

**Paper:** "Understanding Tool-Integrated Reasoning" by Heng Lin and Zhongwen Xu (August 2025)
- Source: https://arxiv.org/abs/2508.19201

**The question:** Does TIR just offload computation (like a calculator), or does it fundamentally expand what LLMs can do?

**Key findings:**
- Provides the first formal proof that TIR fundamentally expands an LLM's capabilities
- Challenges the "just a calculator" view: "the advantage is not confined to computationally-intensive problems but extends to those requiring significant abstract insight"
- On how models learn to think with tools: "By offloading these steps, the model minimizes the risk of unforced computational errors that frequently derail long chains of pure-text thought, thereby preserving the integrity of the overall reasoning process"
- Critical reframing: "The model is not merely using a tool; it is thinking with tools, signifying a fundamental shift in strategy rather than simply delegating calculations"

**The warning side (from broader TIR research):**
- RL-enhanced agents can "conflate the tool invocation process with the verbal reasoning process," and "this tight coupling leads to several challenges including the need for the agent to learn tool selection, input construction, and reasoning jointly"
- Over-reliance risk: models trained with RL on tool use may learn to call tools even when direct reasoning would be sufficient or more efficient
- Source: https://arxiv.org/pdf/2507.01489

### 2.5 THOR: Hierarchical Optimization for Tool Use (2025)

THOR (Tool-Integrated Hierarchical Optimization via RL) addresses the challenge of multi-step mathematical reasoning with tools, using hierarchical RL to decompose the problem into tool selection, input construction, and result integration.

Source: https://arxiv.org/html/2509.13761

---

## 3. Lessons from Manus

### 3.1 Source and Context

**Primary source:** "Context Engineering for AI Agents: Lessons from Building Manus" by Yichao 'Peak' Ji
- Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
- Author's Medium: https://medium.com/@peakji/context-engineering-for-ai-agents-lessons-from-building-manus-71883f0a67f2

Manus is a production-stage AI agent. With an average of 50 tool calls per task, context management is the central engineering challenge.

### 3.2 The Six Principles

#### Principle 1: KV-Cache Optimization (The Most Important Metric)

**Key claim:** "The KV-cache hit rate is the single most important metric for a production-stage AI agent, as it directly affects both latency and cost."

**The numbers:** With Claude Sonnet, cached input tokens cost $0.30/MTok while uncached ones cost $3/MTok — a **10x cost difference**.

**Implementation rules:**
1. **Keep prompt prefixes stable.** A common mistake: including a timestamp precise to the second at the beginning of the system prompt. Even a single-token difference invalidates the cache from that token onward (due to autoregressive nature of LLMs).
2. **Make context append-only.** Never modify previous actions or observations. Ensure serialization is deterministic (no random key ordering in JSON, no floating timestamps).
3. **Avoid dynamic tool loading/removing.** Tool definitions are part of the prefix; adding or removing tools mid-conversation invalidates the cache.

Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus

#### Principle 2: Tool Masking via Logits (Not Removal)

**The problem:** You need to control which tools the agent can use at different stages, but dynamically adding/removing tools from the prompt breaks KV-cache coherence.

**Manus's solution:** Use a context-aware state machine to manage tool availability. Instead of removing tools from the prompt, **mask token logits during decoding** to prevent (or enforce) the selection of certain actions based on the current context.

**How it works:** The tool definitions stay constant in the prompt (preserving cache), but the decoding process is constrained so the model cannot generate tokens that would invoke masked tools. This is a logit-level intervention, not a prompt-level one.

**Architectural implication:** This requires access to the logit distribution during generation — not available through all API providers. Works with self-hosted models or providers that expose logit manipulation.

Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus

#### Principle 3: File System as Unlimited External Memory

**The insight:** The context window is finite; the file system is effectively infinite.

**Implementation:** Rather than stuffing everything into the prompt, Manus writes intermediate results, plans, and reference material to the file system. The agent reads them back when needed, creating an external memory that persists across context resets.

**Why it works:** File read/write operations are just tool calls — cheap and natural for the agent. The file system provides structured, named storage that the agent can organize and navigate. This is conceptually similar to how humans use notes, documents, and folders.

**Harrison Chase (LangChain) corroborates:** "File systems are a natural and powerful way to represent an agent's state, letting an agent offload memory, store notes, and manage long documents without overloading its token window."

Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
Source: https://sequoiacap.com/podcast/context-engineering-our-way-to-long-horizon-agents-langchains-harrison-chase/

#### Principle 4: Attention Manipulation via Todo.md Recitation

**The problem:** In tasks averaging 50 tool calls, the agent gradually loses focus on the original goal. The global plan drifts out of the model's attention as recent tool results dominate.

**Initial discovery:** Manus found that roughly one-third of all actions were spent updating the todo list — a significant token waste.

**The reframe:** But this "waste" is actually a deliberate mechanism to manipulate attention. By creating a todo.md file and updating it step-by-step (checking off completed items), Manus pushes the global plan into the model's recent attention span.

**Why it works:** "By reciting objectives at the end of the context, Manus pushes the global plan into the model's recent attention span, reducing goal drift and misalignment." The todo.md isn't just organization — it's an attention steering mechanism. The most recent content in the context window gets disproportionate attention weight.

Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
Source: https://www.zenml.io/llmops-database/context-engineering-strategies-for-production-ai-agents

#### Principle 5: Preserving Failure Evidence

**The counterintuitive insight:** Don't clean up errors from context. Leave them in.

**Rationale:** "Leaving error traces in context allows the model to implicitly update its beliefs and avoid repeating similar mistakes. In multi-step tasks, failure is not exceptional but rather part of the normal operational loop, and hiding these failures removes valuable learning opportunities."

**What to preserve:**
- Failed tool calls and their error messages
- Incorrect intermediate results that were later corrected
- Dead-end reasoning paths that the agent abandoned

**What NOT to do:** Sanitize the context by removing failed attempts to make it "cleaner." This removes the signal that helps the model avoid the same mistakes.

Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus

#### Principle 6: Diversity Injection (Breaking Pattern Lock-in)

**The problem:** "Language models are excellent mimics and will imitate the pattern of behavior in the context. If your context is full of similar past action-observation pairs, the model will tend to follow that pattern even when it's no longer optimal."

**The solution:** Introduce small amounts of structured variation:
- Different serialization templates for similar data
- Alternate phrasing for recurring observations
- Minor noise in ordering or formatting
- Controlled randomization in how information is presented

**Why it works:** "This controlled randomization breaks rigid patterns and adjusts the model's attention while maintaining flexibility and adaptability." Without it, the agent falls into repetitive loops of the same action types.

Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus

### 3.3 Manus Architecture Summary

From an independent reverse-engineering analysis:
- Manus operates as a compound AI system, not a single model
- Uses a context-aware state machine for workflow management
- File-system-based memory with structured project directories
- Task recitation as attention steering
- KV-cache-first design philosophy

Source: https://gist.github.com/renschni/4fbc70b31bad8dd57f3370239dccd58f
Source: https://arxiv.org/html/2505.02024v2 ("From Mind to Machine: The Rise of Manus AI as a Fully Autonomous Digital Agent")

---

## 4. Anthropic's Agent Patterns

### 4.1 Building Effective Agents (December 2024, updated 2025)

**Source:** https://www.anthropic.com/research/building-effective-agents

**The fundamental distinction:** Workflows vs. Agents.
- **Workflows:** Systems where LLMs and tools are orchestrated through predefined code paths
- **Agents:** Systems where LLMs dynamically direct their own processes and tool usage

**Anthropic's recommendation:** "Start with simple prompts, optimize them with comprehensive evaluation, and add multi-step agentic systems only when simpler solutions fall short."

**Five composable workflow patterns:**

1. **Prompt Chaining** — Each LLM call processes the output of the previous one. "Ideal for situations where the task can be easily and cleanly decomposed into fixed subtasks, with the main goal being to trade off latency for higher accuracy by making each LLM call an easier task."

2. **Routing** — Classifies input and directs it to specialized follow-up tasks. "Works well for complex tasks where there are distinct categories that are better handled separately." Allows separation of concerns and more specialized prompts.

3. **Parallelization** — LLMs work simultaneously, outputs aggregated programmatically. Two variations: **voting** (same task, multiple attempts, majority wins) and **sectioning** (different parts of a task in parallel).

4. **Orchestrator-Workers** — Central LLM dynamically breaks down tasks, delegates to worker LLMs, synthesizes results. "Key difference from parallelization is its flexibility — subtasks aren't pre-defined, but determined by the orchestrator based on the specific input."

5. **Evaluator-Optimizer** — One LLM generates, another evaluates in a loop. "Particularly effective when there are clear evaluation criteria and iterative refinement provides measurable value."

**Agent pattern (the sixth pattern):** Builds on all of the above. The LLM autonomously decides which workflow pattern to apply at each step.

**Sub-agent architecture requirements:** "Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries. Sub-agents protect the main agent's limited context window."

Source: https://www.anthropic.com/research/building-effective-agents
Cookbook: https://github.com/anthropics/anthropic-cookbook/tree/main/patterns/agents

### 4.2 Effective Context Engineering for AI Agents (September 29, 2025)

**Source:** https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

**Authors:** Prithvi Rajasekaran, Ethan Dixon, Carly Ryan, Jeremy Hadfield (Anthropic Applied AI team)

**Core definition:** Context engineering is "the strategic curation of tokens within an LLM's limited attention budget."

**Context rot:** "Every unnecessary word, every redundant tool description, every piece of stale data actively degrades your agent's performance."

**On compaction (Claude Code's approach):** When approaching context limits, summarize and reinitialize. Claude Code "compresses conversation history while preserving architectural decisions, unresolved bugs, and key implementation details."

**External memory recommendation:** Give agents external memory through a simple NOTES.md file or structured todo list. This enables persistence across context resets.

**Three context management strategies:**
1. **Context isolation** — keeping different subtasks in separate context windows
2. **Context reduction** — dropping or compressing irrelevant info to avoid context rot
3. **Context retrieval** — injecting fresh info (documentation, etc.) at the right time

### 4.3 Effective Harnesses for Long-Running Agents (November 2025)

**Source:** https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

**The problem with compaction alone:** "Compaction isn't sufficient — even frontier models like Opus 4.5 can fall short of building production-quality apps with only high-level prompts."

**Two primary failure patterns discovered:**
1. Agents "tried to do too much at once, attempting to one-shot the app"
2. "After some features were completed, new agent instances would prematurely declare the entire project finished" — a critical evaluation problem

**The solution: Two-agent harness architecture:**

1. **Initializer agent** — Runs once at project start. Sets up:
   - `init.sh` script for environment setup
   - `claude-progress.txt` file for tracking what agents have done
   - Initial git commit showing what files were added
   - Feature list, structured directories

2. **Coding agent** — Runs in subsequent sessions. Makes incremental progress session-by-session:
   - Reads `claude-progress.txt` + git history to understand current state
   - Works on the next incomplete feature
   - Leaves structured updates before session ends
   - Maintains clean code state via git commits

**Key insight:** "Finding a way for agents to quickly understand the state of work when starting with a fresh context window" is the central challenge. The `claude-progress.txt` file alongside git history solves this.

**Open question:** "It remains unclear whether a single general-purpose coding agent performs best across contexts, or if better performance can be achieved through a multi-agent architecture with specialized agents (testing, quality assurance, code cleanup)."

### 4.4 Multi-Agent Research System (June 2025)

**Source:** https://www.anthropic.com/engineering/multi-agent-research-system

**Architecture:** Orchestrator-worker pattern.
- Lead agent analyzes query, develops strategy, spawns subagents
- Each subagent operates with its own context window, tools, and exploration trajectory
- Parallel information gathering; subagents condense findings for the lead agent

**Performance:**
- **90.2% performance improvement** over single-agent systems on internal evaluations
- Lead agent spins up **3-5 subagents** in parallel
- Subagents use **3+ tools** in parallel
- Research time reduced by **up to 90%** for complex queries

**Token economics:**
- "Token usage alone explains 80% of variance in performance"
- "Multi-agent systems consume roughly 15 times more tokens than chats"
- Subagents condense "the most important tokens for the lead research agent"

**Key context insight:** Each sub-task has its own separate context, allowing much larger volumes of content to be processed. The lead agent never sees the full exploration of each subagent — only the distilled findings.

### 4.5 Claude Code Architecture Details

**Source:** https://code.claude.com/docs/en/how-claude-code-works
**Source:** https://platform.claude.com/docs/en/build-with-claude/compaction

**Context compaction mechanism:**
1. Detects when input tokens exceed configured trigger threshold (~75% of window)
2. Generates a summary of the current conversation
3. Creates a compaction block containing the summary
4. Continues the response with compacted context
5. Reserves ~20% for the compaction process itself
6. Leaves ~25% (50k tokens in a 200k window) free for reasoning

**What gets preserved during compaction:**
- Architectural decisions
- Unresolved bugs
- Key implementation details
- Active file paths and their states

**What gets dropped:**
- Old tool outputs (cleared first)
- Resolved discussions
- Superseded plans

**Sub-agent usage:** Sub-agents support automatic compaction using the same logic as main conversation. Auto-compaction triggers at approximately 95% capacity for sub-agents.

**Customization:** Add "Compact Instructions" section to CLAUDE.md or run /compact with a focus to control what's preserved.

Source: https://platform.claude.com/cookbook/tool-use-automatic-context-compaction
Source: https://claudefa.st/blog/guide/mechanics/context-buffer-management

---

## 5. Context Window Management

### 5.1 The Core Problem

**Factory.ai framing:** "Large language models have limited context windows of approximately 1 million tokens, while a typical enterprise monorepo can span thousands of files and several million tokens."

Even within the technical limit, effective capacity is much lower. Chroma's research report on Context Rot (Hong, Kelly, Troynikov, Huber, July 2025) measured 18 leading LLMs and found:

- Performance on semantic matching tasks **degrades significantly** as input context grows longer
- Lexical matching performance remains relatively high (models can find exact strings)
- "Even a single piece of similar-but-wrong information significantly hurts performance, and adding four distractors causes performance to tank"
- Performance is "all over the place" and highly task-dependent; no single model ranks first across all experiments
- Example: Claude Sonnet 4 performed best on repeated words task; GPT-4.1 was best on Needle in a Haystack

Source: https://research.trychroma.com/context-rot
Source: https://factory.ai/news/context-window-problem

**Inngest's finding:** "At 32K tokens, most models drop below 50% of their short-context baseline. Even GPT-4o falls from 99.3% to 69.7% accuracy."

Source: https://www.inngest.com/blog/building-durable-agents

### 5.2 Compaction

**Definition:** Taking a conversation nearing the context window limit, summarizing its contents, and reinitiating a new context window with the summary.

**Claude Code's approach (see Section 4.5):** Auto-compacts at ~75% capacity. Preserves architectural decisions and active state. Drops old tool outputs first.

**Google ADK's approach:** "When a configurable threshold is reached, ADK triggers an asynchronous process using an LLM to summarize older events over a sliding window and writes the summary back into the Session."

**Will Lethain's analysis (Irrational Exuberance blog):** Compaction "lets the context window fill all the way up, then compresses the entire history into a summary when it's about to overflow, with the agent continuing as the window fills again and the process repeating."

Source: https://lethain.com/agents-context-compaction/

**Limitation:** Compaction is lossy. Critical details can be dropped. Anthropic found that compaction alone isn't sufficient for long-running tasks — hence the two-agent harness approach.

### 5.3 Hierarchical Memory

**Multiple tiers with different characteristics:**

**Google ADK's 4-tier model:**
1. **Working Context** — the ephemeral prompt for this model call (instructions, selected history, tool outputs, memory results, artifact references). Rebuilt for each invocation. Thrown away after the call.
2. **Session** — durable log of the interaction. Every message, reply, tool call, result, control signal, error as structured Event objects. Persists across turns.
3. **State** — temporary key-value data relevant only during this conversation. Scoped to session.
4. **Artifacts** — large binary or textual data (files, logs, images). Addressed by name and version, never pasted into prompt.

**Design principles:**
- Separate storage from presentation (distinguish durable state from per-call views)
- Use explicit transformations (context built through named, ordered processors, not ad-hoc string concatenation)
- Scope by default (every model call and sub-agent sees minimum context required; agents reach for more via tools)

Source: https://google.github.io/adk-docs/sessions/
Source: https://cloud.google.com/blog/topics/developers-practitioners/remember-this-agent-state-and-memory-with-adk
Source: https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/

**Letta/MemGPT's "LLM OS" analogy:** "The role of the context management system for LLM agents is similar to that of an 'LLM OS', where the LLM OS must move data back and forth between a 'virtual context' (all data available to the agent) and the 'physical context' (actual context window of the LLM input)."

Source: https://www.letta.com/blog/letta-v1-agent

### 5.4 Just-in-Time Context Loading

**Principle:** Don't front-load everything into context. Load information only when the agent needs it.

**Inngest's "pull don't push" principle:** Let the AI determine the context it needs. Provide minimal foundational context and let the AI call tools as needed rather than front-loading everything.

Source: https://www.inngest.com/blog/five-lessons-for-context-engineering

**Cursor's implementation:** Maintains a local vector database of the entire project. "Composer" mode uses semantic search to pull relevant snippets from distant files (config files, API definitions, legacy modules). Practical context: 10,000-50,000 tokens per query via manual file selection.

**Windsurf's implementation:** "Fast Context" feature, powered by SWE-grep models, retrieves relevant code context 10x faster than traditional agentic search by using 8 parallel tool calls per turn across only 4 turns. Offers ~200,000 tokens through RAG-based approach.

Source: https://windsurf.com/compare/windsurf-vs-cursor

**Aider's Repository Map pattern:**
1. Tree-sitter parses code into AST to extract function signatures and class definitions
2. Builds a dependency graph using PageRank to rank symbol importance
3. Dynamically fits optimal content within token budgets
4. Enables agents to understand entire repositories without manual file selection

Source: https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html

### 5.5 Context Trimming and Observation Masking

**JetBrains Research (NeurIPS 2025 Deep Learning for Code workshop):**

Identified two main approaches to context management:

1. **Observation masking:** Targets environment observations only while preserving the action and reasoning history in full. Makes sense because "a typical software engineering agent's turn heavily skews towards observation" (tool outputs are much larger than tool calls).

2. **LLM summarization:** Reduces the resolution of all three parts (reasoning, action, observation) by compressing the long history into compact form.

**Key finding:** A hybrid approach achieves significant cost reduction while maintaining performance.

**Problem quantified:** Software engineering agents "take notes" on every generated output, iteratively adding information to context. "As the context increases, the number of tokens spent drastically increases" — the cost curve is superlinear because each new step processes all previous tokens.

Source: https://blog.jetbrains.com/research/2025/12/efficient-context-management/

### 5.6 Context Masking (Manus's Approach)

Rather than removing tools or information from context, use logit masking to control what the model can generate. The information stays in the KV-cache (preserving cache hits) but the model is prevented from acting on it.

See Section 3.2, Principle 2 for full details.

### 5.7 Observational Memory (Mastra, 2025-2026)

**A novel alternative to RAG for agent memory:**

**How it works:** Two background agents (Observer and Reflector) compress conversation history into a dated observation log. No vector databases, no graph stores, no custom object formats.

**Architecture:** The compressed observation log stays in the context window alongside current raw messages. The model "remembers" by reading its own history, not by searching a separate store.

**Performance:**
- Scored **94.87%** on LongMemEval using GPT-5-mini
- On GPT-4o: observational memory scored **84.23%** vs Mastra's own RAG at **80.05%**

**Cost advantage:** Observation block is append-only between reflection passes, forming a largely fixed prefix that can be cached. "Provider prompt caching can cut token costs by roughly 4-10x for repeated prefixes."

Source: https://venturebeat.com/data/observational-memory-cuts-ai-agent-costs-10x-and-outscores-rag-on-long

### 5.8 Letta's Context Repositories (2025-2026)

Letta Code stores a copy of the agent's context in the local filesystem, using git-based versioning. Agents leverage terminal and coding capabilities to manage context programmatically.

Source: https://www.letta.com/blog/context-repositories

---

## 6. Production Lessons

### 6.1 Spotify's Honk: 1,500+ PRs at Scale

**Source (3-part series):**
- Part 1: https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1
- Part 2: https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2
- Part 3: https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3

**Scale:**
- 1,500+ PRs merged into production
- 650+ agent-generated PRs merged monthly
- Hundreds of developers interacting with the agent
- Applied to ~50 migrations
- **60-90% time savings** compared to writing code by hand

**Architecture:**
- Built on Fleet Management: framework for applying code changes across hundreds or thousands of repositories at once (built since 2022)
- Replaced deterministic migration scripts with an agent that takes instructions from a prompt
- Surrounding infrastructure unchanged: targeting repos, opening PRs, getting reviews, merging
- Built a small internal CLI that delegates prompt execution to an agent, runs formatting/linting via MCP, evaluates diffs with LLM-as-judge, uploads logs to GCP, captures traces in MLflow

**Context Engineering Principles (from Part 2):**

1. **Tailor prompts to the agent** — Homegrown agent did best with strict step-by-step prompts; Claude Code does better with prompts describing the end state, leaving room for the agent to figure out how to get there

2. **State preconditions** — Make prerequisites explicit in the prompt

3. **Use concrete code examples** — Show the agent what the desired output looks like

4. **Define end states through tests** — Verifiable completion criteria

5. **Do one change at a time** — "Combining several related changes into one elaborate prompt is more likely to exhaust the agent's context window or deliver a partial result"

6. **Ask the agent for feedback on the prompt** — "After a session, the agent itself is in a surprisingly good position to tell you what was missing in the prompt"

**Anti-patterns discovered:**
- Overly generic prompts that expect the agent to guess intent
- Overly specific prompts that try to cover every case but fall apart with unexpected situations

**Tool design philosophy:** Constrained tool ecosystem with limited bash commands, custom verify tool, and git tool. "Using fewer tools strategically supports reliability by limiting what the agent can do and making its behavior more predictable."

**Feedback loops (Part 3):**
- Deterministic verifiers: formatting, building, testing
- LLM-as-judge layer: prevents out-of-scope changes
- Judge vetoes **~25%** of proposed changes
- Agent successfully course-corrects about **half** the time after a veto
- Without feedback loops, "agents often produce code that simply doesn't work"
- Agent runs in highly sandboxed container: limited permissions, few binaries, virtually no access to surrounding systems

**Transition to Claude Code:** "Claude Code is Spotify's top-performing agent." Benefits from built-in todo list management and subagent spawning.

Source: https://claude.com/customers/spotify

### 6.2 Inngest's Five Lessons for Context Engineering

**Source:** https://www.inngest.com/blog/five-lessons-for-context-engineering

**Context:** Interview with Paul Sangle-Ferriere, Founder of cubic (AI code review platform helping companies ship code 28% faster).

**Lesson 1: Pull, don't push context.**
"Pull" context = the LLM decides to execute external functions/APIs to retrieve needed information. Better than "push" context = manually provided upfront. Let agents discover what they need.

**Lesson 2: Fewer, simpler tools win.**
"Prioritize standard tools over custom abstractions. When custom tools are needed, they should be simple with single-purpose descriptions — if a tool does three things, split it into three tools and let the AI decide which one it needs."

**Lesson 3: Context engineering is an infrastructure problem disguised as a prompting problem.**
"Most teams spend two months rebuilding [durable execution and orchestration] primitives before they can iterate on context engineering."

**Lesson 4: Coordinate parallel agents to avoid duplication.**
"If agents don't know about each other's work, you might have overlapping context gathering — such as one searching for authentication patterns while another searches for security issues — potentially duplicating 70% of the work."

**Lesson 5: Rate limiting and queue management are critical.**
"A single customer pushing multiple pull requests shouldn't consume all API quota and slow down other users' reviews."

**Additional findings from Inngest blogs:**

From "Building Durable AI Agents":
- "The difference between a prototype and a production agent is durable context management and workflow-level observability"
- "The key to debugging agents is reproducibility — when you can replay a failed workflow with the exact same context and state, debugging becomes systematic"
- "At 32K tokens, most models drop below 50% of their short-context baseline"

Source: https://www.inngest.com/blog/building-durable-agents

From "Context Engineering in Practice":
- "While most LLMs' context windows keep increasing, their associated reasoning accuracy tends to diminish as context increases"
- "Orchestration is the cornerstone of context pipelines"
- Rate limiting, durable execution, parallel processing, and observability are engineering fundamentals

Source: https://www.inngest.com/blog/context-engineering-in-practice

### 6.3 OpenAI's Agent Building Guide and Harness Engineering

**Guide source:** https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/
**Harness engineering source:** https://openai.com/index/harness-engineering/

**Agent categories (from guide):**
- **Single-agent systems:** Single model with appropriate tools and instructions, executing workflows in a loop
- **Multi-agent systems:** Workflow execution distributed across multiple coordinated agents

**Orchestration patterns:**
- **Manager pattern:** Central LLM orchestrates specialized agents through tool calls, delegating tasks and synthesizing results
- **Decentralized pattern:** Agents on equal footing, one can directly hand off control to another

**Tool design:** "Give the agent explicit parameters and schemas so it can decide, not dither." Always enable strict mode for function calling.

**Key principles:** "Keep components flexible, composable, and driven by clear, well-structured prompts."

**Safety:** "Schema drift is a top cause of broken automations" — use Structured Outputs for schema enforcement.

**Agents SDK primitives:** Agents, Tools, Handoffs, Guardrails, Sessions. Built-in tracing.

Source: https://developers.openai.com/tracks/building-agents/

**Harness Engineering (January 2026):**

OpenAI's internal team started with an empty repo in late August 2025. After five months:
- ~1 million lines of code
- ~1,500 PRs opened and merged
- Initial team: just 3 engineers

**Critical context management lesson:** "The team initially tried cramming everything into one massive AGENTS.md file, but it failed." The ARCHITECTURE.md concept (structured documentation of the codebase architecture) proved more effective.

**Five harness engineering principles:**
- The harness encodes scaffolding, feedback loops, documentation, and architectural constraints into machine-readable artifacts
- Codex agents use these artifacts to execute tasks across development workflows
- "Building software still demands discipline, but the discipline shows up more in the scaffolding rather than the code"

Source: https://openai.com/index/harness-engineering/

**Codex agent loop details:**
Source: https://openai.com/index/unrolling-the-codex-agent-loop/

### 6.4 Devin: Lessons from 18 Months of Agents at Work

**Source:** https://cognition.ai/blog/devin-annual-performance-review-2025

**Architecture:** Compound AI system (not a single model):
- **Planner:** High-reasoning model that outlines strategy
- **Coder:** Specialized model trained on trillions of tokens of high-quality code
- **Critic:** Adversarial model that reviews code for security vulnerabilities and logic errors before execution

**2025 performance metrics:**
- 4x faster at problem solving (year over year)
- 2x more efficient in resource consumption
- **67% of PRs now merged** vs 34% last year
- Hundreds of thousands of PRs merged total

**Honest assessment:** "Devin is senior-level at codebase understanding but junior at execution."

**Sweet spot:** "Tasks with clear, upfront requirements and verifiable outcomes that would take a junior engineer 4-8 hrs of work."

**Key advantage:** "Unlike a human, it is infinitely parallelizable and never sleeps."

**Context drift finding:** "Every agent experiences performance degradation after 35 minutes of human time." Context drift is a fundamental challenge.

**New capabilities (2025-2026):**
- Can process UI mockups (images/Figma) and video screen recordings
- Can ingest massive legacy codebases (COBOL, Fortran, Objective-C) and refactor to modern languages

Source: https://cognition.ai/blog/devin-annual-performance-review-2025

### 6.5 Coding Agent Context Architectures Compared

**Cursor:**
- Hybrid indexing: local vector database of entire project
- Merkle tree-based architecture for efficient re-indexing
- Files chunked locally into semantically meaningful pieces
- "Composer" mode uses semantic search to pull relevant snippets
- Practical context: 10,000-50,000 tokens

**Windsurf:**
- Cascade Engine: graph-based reasoning system mapping codebase logic and dependencies
- Indexing Engine: pre-scans entire repo to create semantic index
- Fast Context (SWE-grep models): 10x faster context retrieval, 8 parallel tool calls per turn
- "Memories" feature (late 2025): agent remembers project-specific rules across sessions
- Effective context: ~200,000 tokens via RAG approach

**Aider:**
- Repository Map pattern: tree-sitter AST parsing + PageRank dependency graph
- Dynamic token budget fitting
- Pioneer of the approach that other tools have adopted

Source: https://windsurf.com/compare/windsurf-vs-cursor
Source: https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html

### 6.6 Agent Failure Patterns in Production

**Six primary failure modes** (from industry surveys):

1. **Hallucinated actions:** Agent passes invalid parameters to tools (wrong date formats, nonexistent IDs). "If you aren't observing the tool call itself, you might see a 500 error and blame your database when the real culprit was the agent's faulty reasoning."

2. **Context flooding/thrashing:** "Dumps your entire hard drive into RAM and expects the CPU to find one specific byte."

3. **Error propagation:** "If a data retrieval tool returns malformed JSON, the agent might try to 'reason' through bad data, leading to a hallucinated final answer."

4. **Prompt injection:** Security vulnerability where malicious inputs hijack agent behavior.

5. **Context window degradation:** Memory degrades as context grows; model loses track of earlier instructions.

6. **Distribution shift:** Agent encounters inputs outside its training distribution.

Source: https://www.getmaxim.ai/articles/top-6-reasons-why-ai-agents-fail-in-production-and-how-to-fix-them/
Source: https://softcery.com/lab/why-ai-agent-prototypes-fail-in-production-and-how-to-fix-it

**Debugging approach (Inngest):** "The key to debugging agents is reproducibility — when you can replay a failed workflow with the exact same context and state, debugging becomes systematic."

**Observability (FutureAGI Compass tool):** Scans traces for errors, hallucinations, latency spikes, and guardrail violations. Clusters incidents by type of problem rather than similar-looking text.

Source: https://futureagi.com/blogs/debug-ai-agents-2025

---

## 7. Agent Benchmarks 2025-2026

### 7.1 SWE-Bench

**SWE-Bench Verified (latest as of Feb 2026):**

Top agents (with third-party scaffolds recently added):
- Claude Code and Codex added to SWE-Bench Verified (February 13, 2026)
- Claude Code has higher pass@5 rate than other models
- GPT-5.2-Codex: "extremely token-efficient model, consuming fewer tokens than any other model with similar capability"

**SWE-Bench Pro (as of January 16, 2026):**
1. claude-opus-4-5-20251101: 45.89 +/- 3.60
2. claude-4-5-Sonnet: 43.60 +/- 3.60
3. gemini-3-pro-preview: 43.30 +/- 3.60
4. claude-4-Sonnet: 42.70 +/- 3.59
5. gpt-5-2025-08-07 (High): 41.78 +/- 3.49

**GPT-5.2-Codex on SWE-Bench Pro:** 56.4% (state-of-the-art as of January 2026)

"All models show a significant performance drop when moving from SWE-Bench Verified to the more challenging SWE-Bench Pro."

Source: https://scale.com/leaderboard/swe_bench_pro_public
Source: https://epoch.ai/benchmarks/swe-bench-verified
Source: https://simonwillison.net/2026/Feb/19/swe-bench/

### 7.2 WebArena

**Progress:** AI agents leaped from 14% to ~60% success rate on WebArena in two years.

**Latest results:**
- Record single-agent: 61.7% (IBM CUGA, February 2025)
- WebChoreArena (harder, tedium-focused, 532 tasks): Gemini 2.5 Pro reaches 54.8% on WebArena but only 37.8% on WebChoreArena

Source: https://webarena.dev/

### 7.3 GAIA

**Overview:** Broad benchmark from Meta AI, Hugging Face, and others. Tests multi-step reasoning, tool use, web browsing, multimodal interpretation.

**Latest:** Claude Opus 4.5 leads at 77.5% overall accuracy (pass@1, end of 2025). Web search subscore: 84.5%.

**Saturation risk:** "The highscore already reached 90%" — benchmark may be nearing its useful ceiling.

Source: https://huggingface.co/spaces/gaia-benchmark/leaderboard
Source: https://hal.cs.princeton.edu/gaia

---

## 8. Practitioner Perspectives

### 8.1 Lilian Weng — The Foundational Framework

**Post:** "LLM Powered Autonomous Agents" (June 2023)
- Source: https://lilianweng.github.io/posts/2023-06-23-agent/

**The canonical equation:** Agent = LLM + memory + planning skills + tool use

**Architecture components:**
- **Planning:** Subgoal decomposition (breaking large tasks into manageable subgoals), self-criticism and self-reflection
- **Memory:** Short-term (in-context learning) + long-term (external vector store with fast retrieval)
- **Tool use:** External APIs for information the model weights don't contain

**Key challenges identified:**
- "Planning over a lengthy history and effectively exploring the solution space remain challenging"
- "LLMs struggle to adjust plans when faced with unexpected errors, making them less robust compared to humans who learn from trial and error"

This post remains the most-cited reference for understanding autonomous agent architecture.

### 8.2 Chip Huyen — Practical Agent Engineering

**Post:** "Agents" (January 7, 2025, adapted from her book AI Engineering)
- Source: https://huyenchip.com/2025/01/07/agents.html

**Key framework:**
- An agent's capability is determined by its tools and its planning ability
- Failures stem from: inadequate planning, tool malfunctions, or inefficiencies
- Planning enhanced through: reflection, error correction, plan generation, evaluation, execution (with optional human oversight)

**Practical tips:**
- Write better system prompts with more examples
- Give better descriptions of tools and their parameters
- Focus evaluation on detecting failures in planning, tool usage, and efficiency

### 8.3 Simon Willison — The Pragmatist's View

**Post:** "Agents" (January 11, 2025)
- Source: https://simonwillison.net/2025/Jan/11/agents/

**Definition:** "An LLM agent runs tools in a loop to achieve a goal."

Willison emphasizes the practical, grounded view: agents are just LLMs in loops with tools. The hype is overblown, but the utility is real.

### 8.4 Harrison Chase (LangChain) — Deep Agents

**Podcast/Talk:** Sequoia Capital, ODSC AI West 2025
- Source: https://sequoiacap.com/podcast/context-engineering-our-way-to-long-horizon-agents-langchains-harrison-chase/

**Key insights:**
- "In agents, you don't actually know what the context at step 14 will be, because there's 13 steps before that that could pull arbitrary things in — so everything's context engineering"
- "Deep agents" = sophistication in the loop: planning, context management, memory, subagents, richer prompting
- Planning tools that the LLM can call dynamically: the model decides when and how to plan
- "Writing an effective system prompt is still the hardest part of building an agent"
- File systems as state: "a natural and powerful way to represent an agent's state"

### 8.5 Swyx — Agent Engineering Framework

**Post/Talk:** "Agent Engineering" (2025 AI Engineer Summit)
- Source: https://www.latent.space/p/agent

**IMPACT framework:**
- **I**ntent (Instructions and Evals)
- **M**ethod/Mechanism
- **P**urpose/Planning
- **A**ction/Autonomy
- **C**ontrol Flow
- **T**ools

**"Big 3" LLM OS tools:** RAG/Search, Sandboxes/Canvas, Browsers/CUA

**Warning from 2025:** "Due to context management issues the quality wasn't what we hoped" — a common refrain across production agent deployments.

### 8.6 Martin Fowler's Site — Context Engineering for Coding Agents

**Post by Birgitta Bockeler:** "Context Engineering for Coding Agents"
- Source: https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html

**Three models for context loading:**
1. **LLM-driven:** Agents autonomously load context when relevant (enables unsupervised operation but introduces unpredictability)
2. **Human-triggered:** Developers explicitly invoke context via commands (maintains control, reduces automation)
3. **Software-deterministic:** Systems load context at predetermined lifecycle moments

**Important caveat:** Despite the "engineering" label, context engineering cannot guarantee outcomes. LLMs remain probabilistic.

---

## 9. Long-Context Processing Architectures

### 9.1 FlashAttention-3

**Paper:** "FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision" (Tri Dao et al., 2024)
- Source: https://arxiv.org/abs/2407.08608

**H100 performance benchmarks:**
- FP16: up to **740 TFLOPs/s** (75% utilization)
- BF16: up to **840 TFLOPs/s** (85% utilization)
- FP8: **1.3 PFLOPs/s**
- 2.6x smaller error than baseline FP8 attention

**Comparison to FlashAttention-2:** FA2 achieved only 35% utilization on H100; FA3 reaches 75-85%.

**Three key techniques:**
1. Exploit asynchrony of Tensor Cores and TMA for overlap of computation and data movement via warp-specialization
2. Interleave block-wise matmul and softmax operations
3. Block quantization and incoherent processing leveraging FP8 hardware support

**Practical impact:** 2x longer context on the same hardware; ~30% training time reduction on Llama-2 7B.

Source: https://pytorch.org/blog/flashattention-3/
Source: https://www.together.ai/blog/flashattention-3

### 9.2 Mamba (State Space Models)

**Paper:** "Mamba: Linear-Time Sequence Modeling with Selective State Spaces" (Gu & Dao, December 2023)
- Source: https://arxiv.org/abs/2312.00752

**Key performance claims:**
- Efficient SSM scan faster than FlashAttention-2 beyond sequence length 2K
- Up to **20-40x faster** than standard scan implementation in PyTorch
- **4-5x higher inference throughput** than a Transformer of similar size (no KV cache needed, enabling higher batch sizes)
- End-to-end inference speeds up to 5x those of same-size Transformers
- "Graceful scaling to million-token sequences without quadratic resource growth"

**Significance:** Most promising alternative to Transformer architecture for long sequences. Linear scaling vs quadratic.

### 9.3 Emerging Approaches (2025)

**Tiled Flash Linear Attention (NeurIPS 2025):** New mLSTM kernels "outperform highly optimized Flash Attention, Linear Attention and Mamba kernels, setting a new state of the art for efficient long-context sequence modeling primitives."

Source: https://neurips.cc/virtual/2025/poster/117208

**FlashMLA-ETAP:** Efficient Transpose Attention for mixed-precision serving.
Source: https://arxiv.org/pdf/2506.01969v1

---

## 10. Full Source Index

### Primary Sources (Blogs and Documentation)

1. Manus AI — "Context Engineering for AI Agents: Lessons from Building Manus"
   https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus

2. Anthropic — "Building Effective Agents"
   https://www.anthropic.com/research/building-effective-agents

3. Anthropic — "Effective Context Engineering for AI Agents"
   https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

4. Anthropic — "Effective Harnesses for Long-Running Agents"
   https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

5. Anthropic — "How We Built Our Multi-Agent Research System"
   https://www.anthropic.com/engineering/multi-agent-research-system

6. Anthropic — Claude Code Documentation
   https://code.claude.com/docs/en/how-claude-code-works

7. Anthropic — Compaction Documentation
   https://platform.claude.com/docs/en/build-with-claude/compaction

8. Spotify Engineering — "1,500+ PRs Later" (Honk, Part 1)
   https://engineering.atspotify.com/2025/11/spotifys-background-coding-agent-part-1

9. Spotify Engineering — "Context Engineering" (Honk, Part 2)
   https://engineering.atspotify.com/2025/11/context-engineering-background-coding-agents-part-2

10. Spotify Engineering — "Predictable Results Through Strong Feedback Loops" (Honk, Part 3)
    https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3

11. Inngest — "Five Critical Lessons for Context Engineering"
    https://www.inngest.com/blog/five-lessons-for-context-engineering

12. Inngest — "Building Durable AI Agents"
    https://www.inngest.com/blog/building-durable-agents

13. Inngest — "Context Engineering in Practice"
    https://www.inngest.com/blog/context-engineering-in-practice

14. OpenAI — "A Practical Guide to Building Agents"
    https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/

15. OpenAI — "Harness Engineering: Leveraging Codex in an Agent-First World"
    https://openai.com/index/harness-engineering/

16. OpenAI — "Unrolling the Codex Agent Loop"
    https://openai.com/index/unrolling-the-codex-agent-loop/

17. OpenAI — Function Calling Documentation
    https://developers.openai.com/api/docs/guides/function-calling/

18. Google — "Remember This: Agent State and Memory with ADK"
    https://cloud.google.com/blog/topics/developers-practitioners/remember-this-agent-state-and-memory-with-adk

19. Google — ADK Context Documentation
    https://google.github.io/adk-docs/context/

20. Google — "Architecting Efficient Context-Aware Multi-Agent Framework for Production"
    https://developers.googleblog.com/architecting-efficient-context-aware-multi-agent-framework-for-production/

21. Cognition — "Devin's 2025 Performance Review"
    https://cognition.ai/blog/devin-annual-performance-review-2025

22. Factory.ai — "The Context Window Problem"
    https://factory.ai/news/context-window-problem

23. Chroma Research — "Context Rot"
    https://research.trychroma.com/context-rot

24. JetBrains Research — "Cutting Through the Noise: Smarter Context Management"
    https://blog.jetbrains.com/research/2025/12/efficient-context-management/

25. VentureBeat — "Observational Memory Cuts AI Agent Costs 10x"
    https://venturebeat.com/data/observational-memory-cuts-ai-agent-costs-10x-and-outscores-rag-on-long

26. Martin Fowler — "Context Engineering for Coding Agents"
    https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html

27. Letta — "Rearchitecting Letta's Agent Loop"
    https://www.letta.com/blog/letta-v1-agent

28. Letta — "Context Repositories"
    https://www.letta.com/blog/context-repositories

29. Will Lethain — "Building an Internal Agent: Context Window Compaction"
    https://lethain.com/agents-context-compaction/

### Practitioner Blogs

30. Lilian Weng — "LLM Powered Autonomous Agents"
    https://lilianweng.github.io/posts/2023-06-23-agent/

31. Chip Huyen — "Agents"
    https://huyenchip.com/2025/01/07/agents.html

32. Simon Willison — "Agents"
    https://simonwillison.net/2025/Jan/11/agents/

33. Harrison Chase / Sequoia — "Context Engineering Our Way to Long-Horizon Agents"
    https://sequoiacap.com/podcast/context-engineering-our-way-to-long-horizon-agents-langchains-harrison-chase/

34. Swyx — "Agent Engineering"
    https://www.latent.space/p/agent

35. Lance Martin — "Context Engineering in Manus"
    https://rlancemartin.github.io/2025/10/15/manus/

### Academic Papers

36. Yao et al. — "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)
    https://arxiv.org/abs/2210.03629

37. Schick et al. — "Toolformer: Language Models Can Teach Themselves to Use Tools" (NeurIPS 2023)
    (Meta AI)

38. Patil et al. — "Gorilla: Large Language Model Connected with Massive APIs" (NeurIPS 2024)
    https://arxiv.org/abs/2305.15334

39. Jin et al. — "Search-R1: Training LLMs to Reason and Leverage Search Engines with RL" (2025)
    https://arxiv.org/abs/2503.09516

40. Lin & Xu — "Understanding Tool-Integrated Reasoning" (August 2025)
    https://arxiv.org/abs/2508.19201

41. Dao et al. — "FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision"
    https://arxiv.org/abs/2407.08608

42. Gu & Dao — "Mamba: Linear-Time Sequence Modeling with Selective State Spaces" (2023)
    https://arxiv.org/abs/2312.00752

43. Hong et al. — "Context Rot: How Increasing Input Tokens Impacts LLM Performance" (Chroma, July 2025)
    https://research.trychroma.com/context-rot

### Benchmarks

44. SWE-Bench Pro Leaderboard
    https://scale.com/leaderboard/swe_bench_pro_public

45. SWE-Bench Verified
    https://epoch.ai/benchmarks/swe-bench-verified

46. WebArena
    https://webarena.dev/

47. GAIA Leaderboard
    https://huggingface.co/spaces/gaia-benchmark/leaderboard

### Agent Failure and Debugging

48. GetMaxim — "Top 6 Reasons Why AI Agents Fail in Production"
    https://www.getmaxim.ai/articles/top-6-reasons-why-ai-agents-fail-in-production-and-how-to-fix-them/

49. FutureAGI — "Debug AI Agents in 5 Minutes"
    https://futureagi.com/blogs/debug-ai-agents-2025

50. Composio — "The 2025 AI Agent Report: Why AI Agents Fail in Production"
    https://composio.dev/blog/why-ai-agent-pilots-fail-2026-integration-roadmap

51. Softcery — "Why AI Agents Fail in Production: Six Architecture Patterns"
    https://softcery.com/lab/why-ai-agent-prototypes-fail-in-production-and-how-to-fix-it

### Additional Context

52. Spotify x Claude Case Study
    https://claude.com/customers/spotify

53. Anthropic Agents Cookbook
    https://github.com/anthropics/anthropic-cookbook/tree/main/patterns/agents

54. Google ADK Sessions Documentation
    https://google.github.io/adk-docs/sessions/

55. Reverse Engineering of Manus Architecture
    https://gist.github.com/renschni/4fbc70b31bad8dd57f3370239dccd58f

56. "From Mind to Machine: The Rise of Manus AI"
    https://arxiv.org/html/2505.02024v2

---

## Key Numbers for Quick Reference

| Metric | Value | Source |
|---|---|---|
| KV-cache cost (Claude Sonnet, cached) | $0.30/MTok | Manus |
| KV-cache cost (Claude Sonnet, uncached) | $3.00/MTok | Manus |
| Average tool calls per Manus task | 50 | Manus |
| Spotify Honk PRs merged monthly | 650+ | Spotify |
| Spotify time savings on migrations | 60-90% | Spotify |
| Spotify judge veto rate | ~25% | Spotify Part 3 |
| Anthropic multi-agent perf improvement | 90.2% over single-agent | Anthropic |
| Multi-agent token overhead | 15x more than chat | Anthropic |
| Token usage explains variance | 80% | Anthropic |
| Context rot: GPT-4o accuracy at 32K tokens | 69.7% (down from 99.3%) | Inngest/Chroma |
| Claude Code auto-compact threshold | ~75% of window | Claude docs |
| Claude Code sub-agent compact threshold | ~95% of window | Claude docs |
| Devin PR merge rate (2025) | 67% (up from 34%) | Cognition |
| Devin speed improvement | 4x faster YoY | Cognition |
| Context drift degradation threshold | ~35 min human time | Devin/Zylos |
| FlashAttention-3 H100 FP16 | 740 TFLOPs/s (75% util) | Dao et al. |
| FlashAttention-3 H100 BF16 | 840 TFLOPs/s (85% util) | Dao et al. |
| FlashAttention-3 H100 FP8 | 1.3 PFLOPs/s | Dao et al. |
| Mamba vs Transformer inference | 4-5x higher throughput | Gu & Dao |
| SWE-Bench Pro top score | 56.4% (GPT-5.2-Codex) | Scale AI |
| WebArena best single agent | 61.7% (IBM CUGA) | WebArena |
| GAIA top score | 77.5% (Claude Opus 4.5) | GAIA |
| Search-R1 improvement over RAG | 41% (Qwen2.5-7B) | Search-R1 |
| Observational memory vs RAG | 84.23% vs 80.05% (GPT-4o) | Mastra |
| Observational memory best | 94.87% (GPT-5-mini) | Mastra |
| OpenAI Codex harness: code generated | ~1M lines in 5 months | OpenAI |
| OpenAI Codex harness: PRs merged | ~1,500 with 3 engineers | OpenAI |
| Windsurf effective context | ~200K tokens via RAG | Windsurf |
| Cursor effective context | 10K-50K tokens | Cursor |
