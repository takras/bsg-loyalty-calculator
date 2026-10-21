import { marked } from "marked";
import { Toggle } from "../components/Toggle";
import { useEffect, useMemo, useRef, useState } from "react";
import source from "../content/rulebook.md?raw";
import { rulebookHiddenClasses } from "../logic/config";
import { useStore } from "../state/store";

const IMG_BASE = `${import.meta.env.BASE_URL}rulebook/images/`;

// kramdown-compatible heading ids so the rulebook's internal #links keep working
const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9 _-]/g, "")
    .trim()
    .replace(/ /g, "-");

let cachedHtml: string | null = null;

function buildHtml(): string {
  if (cachedHtml) return cachedHtml;
  // Skip the Jekyll front matter, jQuery config form, help and static TOC: start at the content.
  let md = source.slice(source.indexOf("## Introduction"));
  md = md
    .replace(/\]\(images\//g, `](${IMG_BASE}`)
    .replace(/(src|href)="images\//g, `$1="${IMG_BASE}`)
    // Block HTML with markdown="1" whose content sits on the same line isn't parsed by marked; do it inline.
    .replace(/<(p|span)([^>]*?)\s+markdown="1"([^>]*)>([\s\S]*?)<\/\1>/g, (_m, tag, a, b, inner) => {
      return `<${tag}${a}${b}>${marked.parseInline(inner.trim())}</${tag}>`;
    })
    .replace(/\s+markdown="1"/g, "")
    // Markdown directly after/before a <div> line would otherwise be swallowed into the HTML block.
    .replace(/^(\s*<div[^>]*>)\s*$/gm, "$1\n")
    .replace(/^(\s*<\/div>)\s*$/gm, "\n$1\n");

  marked.use({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }) {
        return `<h${depth} id="${slug(text)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
    },
  });
  cachedHtml = marked.parse(md, { async: false }) as string;
  return cachedHtml;
}

interface Hit {
  i: number;
  heading: string;
  before: string;
  match: string;
  after: string;
}

function clearMarks(root: HTMLElement) {
  root.querySelectorAll("mark.hit").forEach((m) => {
    const parent = m.parentNode!;
    parent.replaceChild(document.createTextNode(m.textContent ?? ""), m);
    parent.normalize();
  });
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function isVisible(el: Element | null) {
  return !!el && (el as HTMLElement).offsetParent !== null;
}

export function RulebookView() {
  const { state, cylonLeader } = useStore();
  const [query, setQuery] = useState("");
  const [showVariants, setShowVariants] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const tocRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const html = useMemo(buildHtml, []);

  const hiddenCss = useMemo(() => {
    const hidden = rulebookHiddenClasses(state.config, cylonLeader, showVariants);
    return [...hidden].map((c) => `.rulebook .${c}`).join(",\n") + " { display: none !important; }";
  }, [state.config, cylonLeader, showVariants]);

  // Table of contents from the headings visible for this configuration.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const hs = [...root.querySelectorAll("h2, h3")].filter(isVisible);
    setToc(hs.map((h) => ({ id: h.id, text: h.textContent ?? "", level: h.tagName === "H2" ? 2 : 3 })));
  }, [hiddenCss]);

  // Scroll spy: the active entry is the last heading that has scrolled up under the sticky header.
  useEffect(() => {
    if (!toc.length) return;
    const headings = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    let timer = 0;
    const update = () => {
      timer = 0;
      const header = document.querySelector<HTMLElement>(".hud-top")?.offsetHeight ?? 0;
      const line = header + 32;
      let current = headings[0]?.id ?? null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= line) current = h.id;
        else break;
      }
      // Short last sections never reach the line: at the very bottom, pick the last heading.
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) current = headings[headings.length - 1]?.id ?? current;
      setActiveId(current);
    };
    // Timer throttle (not rAF): keeps working where animation frames are paused, e.g. embedded webviews.
    const onScroll = () => {
      if (!timer) timer = window.setTimeout(update, 60);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(timer);
    };
  }, [toc]);

  // Keep the active entry visible inside the contents list (without scrolling the page).
  useEffect(() => {
    const box = tocRef.current;
    const el = box?.querySelector<HTMLElement>("li.active");
    if (!box || !el) return;
    const b = box.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    if (e.top < b.top + 24 || e.bottom > b.bottom - 24) {
      box.scrollTop = box.scrollTop + (e.top - b.top) - b.height / 3;
    }
  }, [activeId]);

  // Search: highlight matches in visible text and list them.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const handle = setTimeout(() => {
      clearMarks(root);
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        setHits([]);
        return;
      }
      // Match at the start of words, so "scar" finds Scar but not "discard".
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(q)}`, "iu");
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n as Text;
        if (re.test(t.data) && isVisible(t.parentElement)) nodes.push(t);
      }
      const headings = [...root.querySelectorAll("h2, h3, h4")];
      const found: Hit[] = [];
      for (const node of nodes) {
        let current: Text = node;
        let m: RegExpExecArray | null;
        while ((m = re.exec(current.data))) {
          const matchNode = current.splitText(m.index);
          current = matchNode.splitText(m[0].length);
          const mark = document.createElement("mark");
          mark.className = "hit";
          mark.dataset.hit = String(found.length);
          matchNode.parentNode!.replaceChild(mark, matchNode);
          mark.appendChild(matchNode);
          // nearest preceding heading for context
          const before = headings.filter((h) => h.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING);
          const block = mark.closest("p, li, td, h2, h3, h4") ?? mark.parentElement!;
          const text = block.textContent ?? "";
          const pos = Math.max(0, text.search(re));
          found.push({
            i: found.length,
            heading: before.length ? before[before.length - 1].textContent ?? "" : "",
            before: text.slice(Math.max(0, pos - 50), pos),
            match: text.slice(pos, pos + q.length),
            after: text.slice(pos + q.length, pos + q.length + 70),
          });
          if (found.length >= 200) break;
        }
        if (found.length >= 200) break;
      }
      setHits(found);
    }, 200);
    return () => clearTimeout(handle);
  }, [query, hiddenCss]);

  const jumpTo = (selector: string) => {
    const el = ref.current?.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1200);
  };

  // Internal #anchor links must not hit the app's hash router.
  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (href?.startsWith("#")) {
      e.preventDefault();
      jumpTo(`[id="${CSS.escape(href.slice(1))}"]`);
    } else if (a && href && /^https?:/.test(href)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  };

  return (
    <div className="view rulebook-view">
      <style>{hiddenCss}</style>
      <div className="rulebook-toolbar card">
        <div className="search-field">
          <input
            type="search"
            placeholder="Search the rulebook… (e.g. Brig, Scar, Infiltrate)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the rulebook"
          />
        </div>
        <Toggle label="Official variants (1–2 players, co-op)" checked={showVariants} onChange={setShowVariants} on="Shown" off="Hidden" />
        <p className="small muted">
          Filtered to your Setup choices. Source:{" "}
          <a href="https://jbiatek.github.io/BSGRulebook/rulebook.html" target="_blank" rel="noopener noreferrer">
            BSG unified rulebook
          </a>
          .
        </p>
        {query.trim().length >= 2 && (
          <div className="hits">
            <div className="small muted">
              {hits.length >= 200 ? "200+" : hits.length} match{hits.length === 1 ? "" : "es"}
            </div>
            <ul>
              {hits.slice(0, 60).map((h) => (
                <li key={h.i}>
                  <button className="hit-btn" onClick={() => jumpTo(`mark[data-hit="${h.i}"]`)}>
                    <span className="hit-heading">{h.heading}</span>
                    <span className="hit-snippet">
                      …{h.before}
                      <b>{h.match}</b>
                      {h.after}…
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rulebook-layout">
        <nav className="rulebook-toc card" aria-label="Rulebook contents">
          {/* scroll inside the card so the card's chamfered background stays behind the list */}
          <div className="toc-scroll" ref={tocRef}>
          <ul>
            {toc.map((t) => (
              <li key={t.id} className={`lvl-${t.level} ${t.id === activeId ? "active" : ""}`}>
                <button
                  className="link"
                  aria-current={t.id === activeId ? "location" : undefined}
                  onClick={() => jumpTo(`[id="${CSS.escape(t.id)}"]`)}
                >
                  {t.text}
                </button>
              </li>
            ))}
          </ul>
          </div>
        </nav>
        <article className="rulebook card" ref={ref} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
