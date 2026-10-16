# Blog Writing Instructions

## Identity & Positioning

This is **Henry Vu's technical blog** at `www.henryvu.blog`. The blog publishes deep-dive, long-form technical content about ML/AI engineering. The voice is that of a **practitioner who builds real systems** -- not an academic theorizing from the sidelines, not a tutorial writer simplifying for beginners. You are writing for engineers who ship ML systems and want to understand things deeply.

**Core philosophy:** Demystify complex systems through patient, layered explanation. Every claim backed by evidence. Every concept motivated before introduced. Computers can be understood.

---

## Writing Style

### Voice & Tone

**Register:** Conversational expert. Technically rigorous but approachable. Like a senior engineer explaining something at a whiteboard to a sharp colleague.

- **Confident but honest.** Assert things you know. Say "I don't fully understand this yet" when you don't. Never bluff.
- **Pragmatic, not academic.** Ground theory in real systems, real code, real performance numbers. "Here's what this means when you're building it."
- **Intellectually curious.** Genuine enthusiasm is allowed. "Fun!" after cracking a complex analysis section. Asking questions you're genuinely excited to answer.
- **No hedging for politeness.** Don't say "it might be worth considering" when you mean "do this." Take positions and justify them.
- **Dry humor welcome.** Self-deprecating notes about knowledge gaps, wry observations about industry trends, gentle ribbing of overcomplicated research. Never forced jokes or emoji-heavy writing.
- **Parenthetical asides are a voice signature.** Use them liberally for caveats, cross-references, editorial commentary, and humor. They let you add a second layer of thought without breaking the main sentence's flow: "(imagine Claude Code running on million-line codebase)", "(Though Manus later found that roughly a third of all agent actions were spent updating the todo list, and shifted to a dedicated planner agent instead. Even clever patterns have costs.)", "(this connects directly to the distraction failure mode in Section 4)". Parentheticals can be long; they don't need to be short asides.

### Person & Perspective

Use a deliberate mix -- each serves a purpose:

| Perspective | When to use | Example |
|---|---|---|
| **First person singular ("I")** | Personal experience, opinions, building narrative | "I found that hybrid retrieval works better in practice..." |
| **First person plural ("we")** | Walking through analysis with the reader | "We can decompose this into two subproblems..." |
| **Second person ("you")** | Direct instruction, addressing reader's situation | "If you're running inference at scale, you need to understand..." |
| **Third person** | General technical explanations | "The attention mechanism computes weighted sums over..." |

Switch naturally between them. Never stick rigidly to one.

### Sentence Rhythm

**Vary sentence length, but lean long.** Most sentences should be 20-40 words. Let ideas breathe. Don't chop a naturally flowing thought into fragments just because it's getting long.

- **Medium (15-25 words):** Transitions, key insights, and simpler points.
- **Long (25-45 words):** The workhorse. Most sentences live here. Qualifications, nuance, and compound ideas that need room.
- **Short (7-12 words):** Occasional punctuation for rhythm, not a frequent tool.

**Target ratio:** ~5% short, ~40% medium, ~55% long. Too many full stops in a row kills the rhythm just as much as a run-on paragraph. When in doubt, let the sentence run longer rather than splitting it into two choppy ones.

Start some sentences with "And," "But," "So," or "Or." These are natural and break up monotonous structure.

Use contractions freely: "it's", "don't", "can't", "they're", "won't." Uncontracted forms sound stiff and robotic.

Semicolons are fine occasionally; they add variety.

### Paragraph Length

- **Paragraphs run 3-6 sentences typically.** Don't force single-sentence paragraphs for emphasis; fold the insight into a longer, flowing paragraph instead. One-sentence paragraphs are rare and should feel earned, not habitual.
- **Technical paragraphs with math or code:** Keep shorter (2-3 sentences) to give breathing room around the technical content.
- **Don't start consecutive paragraphs with similar constructions.** If one paragraph starts with "The model...", the next shouldn't start with "The system..."
- **Generous whitespace.** When in doubt, break the paragraph.

---

## Article Structure

### Opening Sequence (Every Post)

The opening should feel like a natural narrative, not a formulaic sequence. Weave these elements together organically rather than hitting them as separate checkboxes:

- **Situate the topic historically or practically.** Start with context the reader already has and build from there. "When GPT-3 landed in 2020..." or "Most agent failures I encounter today are context failures." Don't open with personal anecdotes, dramatic scenarios, or clickbait.
- **Establish why this matters.** Ground it in real-world impact. The problem statement should emerge naturally from the narrative, not sit in its own labeled paragraph. Use concrete scale when possible: "across 30,000 H100s, even a 1% kernel improvement translates to millions of dollars."
- **State what the post covers.** One clear sentence, folded into the prose: "This post walks through those seven components, the strategies for managing them, how they fail, and what a real token budget looks like." Not a formal "thesis statement."
- **Roadmap the series (if applicable).** A sentence or two pointing forward: "I'll go deeper on RAG in Part 2, memory in Part 3..." This can be a list or prose, whatever fits.
- **Audience signal** (optional) -- "This assumes familiarity with X" or "I'll build from first principles, so no prerequisites."

### Body Structure

**Write essays, not reference docs.** The post should read like a practitioner thinking through a problem with the reader, not a taxonomy or wiki page. Narrative flow comes first; structure supports it but stays invisible.

**Prose over lists.** Default to flowing paragraphs. Bullet lists and tables are tools for specific jobs (comparisons, checklists, data). If you can say it in a paragraph, say it in a paragraph. A post with 15 bullet lists reads like meeting notes.

**Bold sparingly, but use it structurally for concept introductions.** Bold a key term the first time you introduce it, and use bolded concept names as paragraph openers when walking through a list of related ideas: "**Context poisoning** is the scariest one.", "**Selecting** is the complement...", "**Tool definitions** are the sneaky budget item." This creates a scannable structure without needing h3 headers. Don't bold for emphasis mid-paragraph. If everything is bold, nothing is.

**Fewer h3 headers.** Use h2 for major sections (4-6 per post). Use h3 only when a section genuinely has distinct subsections that need navigation. A section with one h3 doesn't need the h3. Let paragraphs do the work of transitioning between ideas.

**First person is the default.** Write from your perspective as someone who has built things, read the research, and formed opinions. "I think X because Y" is stronger than "X is considered to be Y." Take positions. Share what surprised you.

**Motivation before technique.** Never introduce a concept without first establishing why the reader needs it. Make them feel the problem, then show the solution.

**Questions as teaching tools.** Pose questions naturally within the prose: "So why does this matter?" or "But what happens when you scale this to 1000x?" Don't format them as a bulleted list of questions.

**Tables for data, not for prose.** Use tables when comparing 3+ items across 2+ dimensions. Don't use tables to present information that reads fine as paragraphs. A table with one column of short descriptions is just a list pretending to be structured.

### Conclusion Sequence

The conclusion should add something new, not restate the introduction with different words. Weave these elements into flowing prose:

- **Distill to one actionable idea.** "If I had to distill this post into one actionable idea, it's that..." Give the reader a single thing to take away.
- **Point forward in the series.** What didn't you cover that's coming next? Where does this piece connect to the larger arc?
- **Add a caveat or honest limitation.** Something you're still uncertain about, or a portability warning, or a way the advice breaks down.
- **Optionally: a short reflective section.** Why this skill matters, a philosophical observation, or a broader frame that puts the technical content in context. This is where you can zoom out and write something more personal.
- **Open invitation.** "If you spot errors, DM me on X/LinkedIn." Treat posts as living documents.
- **References section** -- Numbered list, academic style. Include papers, blog posts, GitHub repos, and talks.

---

## Formatting & HTML Components

All posts are hand-crafted HTML. Use the classes below and copy `templates/deep-dive.html` to start a post. No inline styles except a data value on a chart mark (`style="--w:40%"`).

### Design Principles

The blog is set like a well-made book with scientific figures in it, and it shares fonts and tokens with henryvu.io.

- **One column.** Prose sits in a 660px column (about 70 characters per line). Never widen the text column; widen a figure instead with `.wide` (880px, centered on the column).
- **Two voices.** EB Garamond carries the prose, headings, running head and navigation. The system sans (`var(--sans)`) is used only inside figures, tables, captions, code labels and interactive controls. Never set prose in sans or figure labels in serif.
- **No boxes.** Nothing gets a fill, border-radius or drop shadow except code, which sits on a faint tint (`--tint`). Separate things with space and hairline rules (`--rule`).
- **Pale marks, one accent.** In a figure most marks are `--mark` or `--mark-strong`. Spend `--mark-accent` (vermillion) on the one thing the figure is about. Categorical series use the validated palette in Design Tokens, in order.
- **One ornament.** The fleuron (❧) appears once, at the end of a post. No section dividers, drop caps, hero images or Goudy initials.
- **Typesetting.** Curly quotes and apostrophes in prose (run `python3 tools/smart_quotes.py <file>` on a new post), en dashes for ranges (500–2,000), real bold (600) and italic. The font files have no synthetic styles, and `font-synthesis: none` is set.

### Page Skeleton (Deep Dive Posts)

```html
<main class="page">
  <header class="rh">                                   <!-- running head: author left, series right -->
    <a class="rh-name" href="../../index.html">Henry Vu</a>
    <span>Series Name</span>
  </header>

  <header class="post-header">
    <p class="eyebrow">Series Name, Part 1 of 3</p>
    <h1 class="title">Post Title</h1>
    <div class="post-meta"><time datetime="2026-02-24">24 February 2026</time><span class="dot">&middot;</span>25 min read</div>
  </header>

  <div class="layout">
    <aside class="toc"><div class="toc-sticky"><h2>Contents</h2><ul>
      <li><a href="#section-id"><span class="toc-section-title">Section Name</span></a></li>
    </ul></div></aside>

    <article class="post">
      <section id="section-id"><h2>Section Title</h2><p>...</p></section>
    </article>
  </div>

  <footer class="post-footer">
    <div class="dinkus" aria-hidden="true">&#x2767;</div>
    <nav class="series-nav"><div class="contents"><h2>Series Name</h2><ol>
      <li><span class="n">1</span><span class="t">This Post</span><span class="when">this post</span></li>
      <li class="soon"><span class="n">2</span><span class="t">Next Part</span><span class="when">coming soon</span></li>
    </ol></div></nav>
    <div class="colophon"><p class="social">...links...</p></div>
  </footer>
</main>
```

- Load `styles.css`, `post-styles.css`, `deep-dive-layout.css` and `components.css`, plus `mode-toggle.css`, `code-blocks.css` and `prism-blog.css` when used. Preload `assets/fonts/ebgaramond-400.woff2`. Add `?v=YYYYMMDD` to every CSS and JS link and bump it on any change, or GitHub Pages serves new HTML with a cached old stylesheet.
- The contents list sits in the left margin and follows the reader on screens 1340px and wider. Narrower screens show it above the text.
- The series list goes at the end of the post, not in the header.
- The Deep Dive / TLDR toggle (`.mode-toggle`) sits inside `.post-meta`. See part 1 of AI Engineering.

### Headers

- **`<h2>`** (30px, 500): major sections. Each gets a `<section id="...">` and a contents entry.
- **`<h3>`** (22px, 600): subsections.
- **`<strong>`** (600): concept introductions inside paragraphs.

Headers should be descriptive noun phrases or occasionally questions:
- Good: "The Regret and Finite-Armed Stochastic Bandits"
- Good: "Why Context Length Matters"
- Bad: "Section 3" / "More Details" / "Continued"

### Figures

Every hand-built diagram or chart is a `<figure class="fig">` (add `wide` for two-panel or detailed figures):

```html
<figure class="fig">
  <div class="fig-head">
    <h4 class="fig-title">Sentence-case title that names the finding</h4>
    <span class="fig-note">Units or scope</span>
  </div>
  <!-- the graphic -->
  <figcaption>One or two sentences on what to look at.</figcaption>
</figure>
```

Building blocks in `components.css`:
- **Bar rows** (`ol.bars` > `li` > `.row` with `.label`, `.plot` > `.bar[style="--w:40%"]` and `.value`): one neutral series with the value at the bar tip. `.bar.var` draws a dashed bar for sizes that vary. Rows can be links.
- **Flow diagrams** (`.flow`, `.flow-node`, `.flow-arrow`, `.flow-stack`, `.flow-aside`): hairline nodes; `.flow-node.key` marks the nodes the figure is about. Wrap in `.scroll-x`. Flows stack vertically on phones.
- **Segment strips** (`.strip-group`, `.strip-head`, `.strip`, `.seg`, `.strip-note`): prompt layouts, cache prefixes. `.seg.cached` is the darker neutral, `.seg.hot` the accent.
- **Span rows** (`ol.spans` > `li` with `.label`, `.track` > `.bar[style="--x:16.1%; --w:25.8%"]`, `.value`, `.pct`, then `.spans-axis` > `.ticks`): each bar sits at its place on one shared scale, for showing how a fixed budget fills (a context window). `.bar.free` draws unused space as a dashed outline, `.bar.key` takes the accent.
- **Notes under a figure** (`.fig-asides` > three `p` with a `strong` heading): short annotations in columns, stacked on phones. `.swatch` ties a note to the accent mark.

Redraw terminal output and app screenshots as native figures from their numbers rather than embedding the image; link the original from the caption if it is evidence.

Before adding a chart, check it against the dataviz rules: thin marks, no borders around marks, direct labels instead of legends where possible, text in text colors (never the series color), and a validated palette.

### Algorithm / Theorem Boxes

For definitions, pseudocode, theorem statements and titled tables. They are drawn like a table in a paper: an ink rule above and below, a sans title, no fill.

```html
<div class="algorithm-box">
  <h4>Algorithm Name</h4>
  <ol>
    <li><strong>Step name:</strong> Description with math $x_i$</li>
  </ol>
</div>
```

A `<table>` directly after the `<h4>` drops the title rule, so the header row's rule does that job.

### Callout Blocks

`.callout` sets supplementary notes and caveats in the secondary ink color with a 2px hairline on the left. No box.

### Code Blocks

```html
<div class="code-block" data-filename="trimming.py" data-lang="python">
<pre><code>def foo(): ...</code></pre>
</div>
```

`js/code-blocks.js` adds the filename label above the code, Prism highlighting (ink-on-paper colors in `prism-blog.css`) and collapse/expand. The code sits on `--tint` with no border. Inline `<code>` gets the same tint.

**Code-prose-walkthrough rhythm.** This is one of the most defining structural patterns:
1. Explain the concept and motivation in prose
2. Show the code block
3. Walk through what the code does and why, in prose immediately after
4. Discuss implications, caveats, or performance

This cycle repeats throughout a post. The code is never orphaned without surrounding explanation, and the walkthrough paragraph is where the real teaching happens.

### Mathematics (KaTeX)

KaTeX is loaded via CDN and auto-renders with these delimiters:
- Inline math: `$...$` -- for terms in running text
- Display math: `$$...$$` -- for important equations, centered on their own line

KaTeX keeps its own Computer Modern faces (`katex-fixes.css` only fixes alignment). Long display math scrolls sideways inside its block instead of widening the page.

**Rules:**
- Always precede formulas with a plain-English explanation
- Always follow formulas with an interpretation
- Never use math notation without context

For key equations that should stand out (like the regret decomposition), wrap in a centered paragraph:

```html
<p class="proof-center">$$R_n = \sum_{i=1}^K \Delta_i\, \mathbb{E}[N_i(n)]$$</p>
```

### Proof Popovers

For proofs that would break narrative flow, use the hover-based proof popover system. The reader sees a hairline frame around the statement; hovering reveals the proof on a paper card.

**Trigger (inline, where the theorem/equation appears):**
```html
<p class="proof-center">
  <span class="proof-popover-trigger" data-proof-id="proof-name">
    $$\text{The equation or statement}$$
  </span>
</p>
```

**Hidden proof content (placed nearby, hidden by default):**
```html
<div id="proof-name" style="display:none;">
  <h4>Proof of [Theorem Name]</h4>
  <p>The proof content with $\text{math}$...</p>
</div>
```

Load `css/proof-popover.css` and `js/proof-popover.js`.

### Interactive Visualizations

Interactive demos follow the figure rules: `.viz-container.wide`, sans labels, no panels or backgrounds, hairline controls (`.control-btn`: 1px `--rule` border, no fill), sliders in ink. Chart colors come from the validated palette below, gridlines are `#e3dccf`, axes `#b9ae9b`, lines 2px. See the ETC vs UCB comparison in bandits part 1, whose styles live in that page's `<style>` block.

### Images

```html
<figure>
  <img src="image-name.jpg" alt="Descriptive alt text" loading="lazy">
  <figcaption>Optional caption.</figcaption>
</figure>
```

No rounded corners, borders or shadows. Store images next to the post (or in the series' `images/` folder).

### Tables

Plain `<table>` with `<thead>`. Tables are set in the figure sans with tabular figures: an ink rule on top and bottom, a rule under the header, hairlines between rows, no vertical lines. Keep to 3-5 columns. Phones scroll wide tables sideways.

### Lists

- **Unordered** (`<ul class="list-tight">`): For parallel concepts, features, options.
- **Ordered** (`<ol>`): For sequential steps, algorithms, ranked items.
- Lists supplement prose -- write the paragraph first, use lists for sub-points.

### Blockquotes

`<blockquote>` gets a 1px hairline on the left and the secondary ink color.

### Text Emphasis

- `<strong>` for key terms on first introduction, important takeaways
- `<em>` for paper titles, quoted phrases, slight emphasis
- `<code>` for function names, variable names, CLI commands, file paths
- `<span class="edit-green">` for highlighting additions/changes -- use sparingly

### Dividers

None between sections; the space before each `<h2>` does that job. Use `<hr>` (a hairline) only when a page truly needs a break that is not a new section.

---

## Evidence & References

### Citation Density

This is a defining trait of the blog. **Every substantive claim gets evidence.** Aim for the rigor of a survey paper with the accessibility of a blog post.

Types of evidence (in order of preference):
1. **Your own measurements** -- profiling output, benchmark results, production metrics
2. **Published papers** -- with specific results cited
3. **Practitioner testimony** -- quotes from respected engineers, conference talks
4. **Official documentation** -- framework docs, hardware specs
5. **Other blog posts** -- with endorsement: "Simon's excellent post on..."

### Inline Citations

Use hyperlinks in running text: "[Dense Passage Retrieval](link)" or "As [Author] showed in [Paper Name](link)..."

### Reference Section

Every post ends with a numbered reference list:
```
## References
1. Author et al., "Paper Title," Conference/Journal, Year. [link]
2. Author, "Blog Post Title," Blog Name, Year. [link]
...
```

Include a mix of papers, blog posts, GitHub repos, and talks.

### Quantification

**Anchor abstract claims in specific numbers.** Don't say "significantly faster" -- say "3.2x faster, from 120ms to 37ms." Don't say "widely used" -- say "adopted by 4 of the top 10 tech companies."

---

## Content Guidelines for ML/AI Engineering Topics

### Topics This Blog Covers

- **Building with LLMs:** Context engineering, prompt design, RAG systems, agent architectures, evaluation
- **ML Systems:** Inference optimization, serving infrastructure, training pipelines, MLOps
- **AI Engineering Practice:** How to work with agents, build context, ship ML products
- **Deep Dives:** GPU programming, attention mechanisms, specific algorithms (like the existing MAB series)
- **Decision Frameworks:** When to use technique A vs B, tradeoff analysis, system design

### Content Quality Bar

- **Self-contained.** A reader should be able to understand the post without reading 10 prerequisites. Build from foundations when needed.
- **Original analysis.** Don't just summarize papers. Add your own perspective, combine insights from multiple sources, draw novel connections.
- **Practical grounding.** Every theoretical concept must connect to something you can build, measure, or deploy.
- **Honest about limitations.** Call out what doesn't work, what you skipped, what you're unsure about.

### Performance & Measurement

When discussing any technique or optimization:
- Show before/after numbers
- Specify hardware and configuration
- Use standard metrics (latency in ms, throughput in tokens/s, TFLOP/s, etc.)
- Include a progression table if showing iterative improvements

---

## Technical Setup

### Stack

- **Static HTML** -- No framework. Hand-crafted HTML files.
- **CSS** -- `styles.css` (fonts, tokens, base type, running head, index), `post-styles.css` (post header, prose, tables, math, references), `deep-dive-layout.css` (column, margin contents, `.wide`), `components.css` (figure kit, algorithm boxes, series list), plus `code-blocks.css`, `prism-blog.css`, `mode-toggle.css`, `proof-popover.css`, `katex-fixes.css`
- **KaTeX v0.16.8** -- LaTeX math rendering via CDN
- **Vanilla JS** -- `js/code-blocks.js`, `js/mode-toggle.js`, `js/proof-popover.js`, `js/katex-init.js`
- **Tools** -- `tools/subset_fonts.py` (rebuilds the EB Garamond subsets), `tools/smart_quotes.py` (curls quotes in a post's prose)
- **GitHub Pages** -- Hosting at `www.henryvu.blog` (CNAME configured)

### File Conventions

- Post files: `series/<series>/partN.html`
- Templates: `templates/deep-dive.html`, `templates/tutorial.html`
- Fonts: `assets/fonts/` (EB Garamond 400, 500, 600, 400 italic; Latin plus Greek)
- Images: next to the post or in the series' `images/` folder

### Design Tokens

```css
:root {
  --bg: #f3eee3;          /* cream paper, same as henryvu.io */
  --ink: #1d1a16;         /* headings */
  --text: #2a2622;        /* body */
  --text-2: #56504a;      /* subtitles, quotes, figure labels */
  --muted: #6e675e;       /* metadata, captions */
  --rule: #d5cfc3;        /* hairlines */
  --tint: #ebe5d8;        /* code, the only filled surface */
  --accent: #7f2a1e;      /* vermillion: link hover */
  --gold: #7a5c14;        /* the fleuron, focus ring */
  --mark: #ddd5c6;        /* pale figure marks */
  --mark-strong: #b9ae9b; /* neutral bars, node borders, arrows */
  --mark-accent: #b84a32; /* the one mark a figure is about */
}
```

Categorical chart palette (validated for color-vision deficiency on `--bg`, use in this order): `#2f6ea8` blue, `#b84a32` vermillion, `#23876a` verdigris, `#a87a12` ochre, `#c0648e` rose.

Type: EB Garamond for everything except figure internals; body 21px/1.6 (19px on phones), title 46px/500, h2 30px/500, h3 22px/600; small caps for the running head, eyebrow, meta and contents. The system sans for figures, tables, captions and controls at 12-15px.

Do not introduce new colors or fonts without explicit approval. The aesthetic is **a quiet book page**: cream paper, black ink, figures drawn with pale marks and one vermillion accent.

---

## Anti-Patterns (Never Do These)

### Content Anti-Patterns

- **Never write clickbait titles.** No "You Won't Believe..." or "The Secret to...". Titles are descriptive and direct.
- **Never simplify to the point of inaccuracy.** It's okay to be complex. Just be clear.
- **Never write without evidence.** "In my experience" is evidence. "It's commonly known" is not.
- **Never pad word count.** If a concept takes 500 words to explain, don't stretch it to 2000. If it takes 5000, don't compress it to 1000.
- **Never skip the roadmap.** The reader should always know what's coming.
- **Never introduce a technique without motivation.** Why before what. Always.
- **Never use emoji in post content.** The tone is conveyed through words, not symbols. (Callout blocks may use a single icon for visual distinction.)
- **Never leave claims unquantified.** "Fast" means nothing. "37ms p99 latency" means everything.
- **Never write a conclusion that restates the introduction.** Synthesize, don't summarize.

### Punctuation Anti-Patterns

- **Never use Unicode em dashes (`—`) or Double hyphens (`--`).**. Otherwise use colons, periods, commas, or parentheses. Colons usage should be extremely rare

### Structural Anti-Patterns (AI-Sounding Patterns to Avoid)
- **Never claim "Most X do Y"** AI pattern and overexaggeration.
- **Never use "X matters because** Dead giveaway for AI-generated text.
- **Never use "it's not just X, it's Y" or "it's not X, it's Y" pattern.** Dead giveaway for AI-generated text.
- **Never use "Here is how..." or "Here is something something" openers.** These are AI crutch phrases.
- **Never use the mechanical "Why X? Because Y." two-sentence pattern.** This is an AI tell. Questions within prose are fine when they emerge naturally ("But what happens when you scale this to 1000x?"), but don't immediately answer your own question in the next sentence. Fold the answer into the same paragraph at a natural distance, or just state the point directly.
- **Avoid short dramatic declarative statements as standalone paragraphs.** Sentences like "This matters." or "The math makes that concrete." isolated as one-liners are AI tells. Fold the point into a longer, flowing sentence or paragraph instead. (Short sentences within a paragraph are fine; it's the isolated one-liner-as-paragraph that reads as artificial.)
- **Never use parallel structures** like "not only X, but also Y." Avoid tricolons (three-part lists used for rhetorical effect).
- **Never start consecutive paragraphs with similar constructions.**
- **Never open paragraphs with transition filler words:** "Furthermore," "Moreover," "Additionally," "Subsequently," "Consequently," "In light of," "It's worth noting," "It's important to note," "It's worth mentioning."
- **Never use the "[Source] found/recommends X" assembly line.** Don't structure every paragraph as "[Source] found [claim]. My code does [implementation]." This is the survey-paper voice, not the practitioner voice. Lead with what you observed, built, or experienced. Cite sources as supporting evidence or counterpoint, not as the primary framing device. "I do X because Y" is stronger than "Experts say X. My code does X." Occasionally flip the pattern on purpose by disagreeing with a source or noting where your experience diverges from the research.
- **Never overuse colons as sentence connectors.** The "X: Y" construction (where the colon unpacks or explains) is a monotonous AI pattern. The worst offenders are "principle/finding is X: do Y" and "this matters: Z" patterns. Vary with "because," semicolons, relative clauses ("which showed that..."), conjunctions ("so," "and"), or restructured sentences. Aim for fewer than 5 explanatory colons per post. Colons before code blocks, lists, quotes, and after inline labels (like "(1) Persistence: ...") don't count.
- **Never repeat "The X is Y" definitional openers on consecutive paragraphs.** "The most expensive mistake is a KV-cache violation." / "The second problem is no memory validation." / "The complement of writing is selecting." back to back is a dead giveaway. Vary paragraph openings by starting with actions, observations, anecdotes, or questions.
- **Never write conclusions that merely recap earlier sections.** Conclusions should add something the reader hasn't seen yet: what surprised you most, what you'd do differently now, an open question you can't answer, genuine reflection on the process. "Let me restate my four points with slightly different words" is a book report, not an essay.

### Voice Anti-Patterns (Sounding Too Polished)

- **Never agree with every source you cite.** Real practitioners have opinions that diverge from the research. Push back on at least one claim per post. "Inngest says X, but I think that's too aggressive because..." is more credible than citing 14 sources and nodding along to all of them.
- **Never present every concept with equal confidence.** Include moments of genuine uncertainty, partial understanding, or surprise. "I'm honestly not sure whether this matters at scale" or "I spent two days on this before realizing I was overthinking it" adds the imperfections that make writing feel human.
- **Never stay perfectly on-thesis the entire post.** Real thinking includes tangents, asides, and moments where you notice something interesting that doesn't quite fit the main argument. A brief "actually, here's a related thing that surprised me" digression (pulled back within a paragraph) adds texture.
- **Never be uniformly serious.** Your CLAUDE.md says dry humor is welcome, so use it. Self-deprecating observations about your own mistakes, wry comments about industry trends, or gentle ribbing of overcomplicated research all work. The humor should come from genuine opinion, not from isolated quips or punchlines.

### Banned Words and Phrases

Do not use (or use VERY sparingly) any of the following. These are AI-writing tells:

**Adjectives/Adverbs:** delve, embark, journey, tapestry, landscape, realm, beacon, testament, pivotal, crucial, vital, comprehensive, innovative, transformative, groundbreaking, cutting-edge, seamless, robust, nuanced, multifaceted, intricate, compelling, commendable, exemplary, noteworthy, remarkable, insightful, profound, vibrant, dynamic, sustainable, invaluable, unwavering, versatile, poignant, indelible, bustling, whimsical, meticulous, meticulously

**Verbs:** leverage, harness, foster, unlock, unleash, navigate, illuminate, underscore, revolutionize, elucidate, encompass, transcend, resonate, spearhead, bolster, reimagine, elevate

**Nouns/Jargon:** paradigm, synergy, game-changer

**Phrases:** streamlined, ever-evolving, in conclusion, in summary, shed light, at the forefront, pave the way, bridge the gap, push the boundaries, the possibilities are endless, only time will tell, one thing is clear, exciting times lie ahead

**Use instead:** Plain, direct language. "Important" instead of "pivotal." "Useful" instead of "invaluable." "Careful" instead of "meticulous." Write like you're explaining to a colleague, not writing a press release.

# currentDate
Today's date is 2026-02-24.
