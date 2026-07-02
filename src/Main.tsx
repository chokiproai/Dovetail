import { createSignal, createEffect, onCleanup, Show } from "solid-js";
import { NBTTree } from "./NBTTree.js";
import { Editor } from "./Editor.js";
import { Welcome } from "./Welcome.js";

import type { Accessor, Setter } from "solid-js";
import type { NBTData, RootName } from "nbtify";

export interface MainProps {
  getRootName: Accessor<RootName>;
  getEditorDisabled: Accessor<boolean>;
  getEditorValue: Accessor<string>;
  setEditorValue: Setter<string>;
  getShowTreeView: Accessor<boolean>;
  getTreeViewValue: Accessor<NBTData>;
  onOpenFile(): void;
  onCreateBlank(): void;
  onLoadDemo(): void;
  getSearchQuery: Accessor<string>;
  setSearchQuery: Setter<string>;
  onUpdateValue(path: (string | number)[], newValue: any): void;
}

export function Main(props: MainProps){
  const [getActiveIndex, setActiveIndex] = createSignal<number>(-1);
  const [getMatchElements, setMatchElements] = createSignal<HTMLElement[]>([]);
  const [getMarkers, setMarkers] = createSignal<number[]>([]);
  const [getEditorMatches, setEditorMatches] = createSignal<{ start: number; end: number }[]>([]);
  let nbtTreeEl: HTMLDivElement | undefined;
  let editorTextareaEl: HTMLTextAreaElement | undefined;

  function updateMatches() {
    if (props.getShowTreeView()) {
      if (!nbtTreeEl) return;
      const elements = Array.from(nbtTreeEl.querySelectorAll(".search-highlight")) as HTMLElement[];
      setMatchElements(elements);

      const scrollHeight = nbtTreeEl.scrollHeight;
      if (scrollHeight > 0) {
        const markers = elements.map(el => {
          const rect = el.getBoundingClientRect();
          const containerRect = nbtTreeEl.getBoundingClientRect();
          const offsetTop = rect.top - containerRect.top + nbtTreeEl.scrollTop;
          return (offsetTop / scrollHeight) * 100;
        });
        setMarkers(markers);
      } else {
        setMarkers([]);
      }

      if (elements.length === 0) {
        setActiveIndex(-1);
      } else {
        let activeIdx = getActiveIndex();
        if (activeIdx < 0 || activeIdx >= elements.length) {
          activeIdx = 0;
          setActiveIndex(0);
        }
        
        elements.forEach((m, idx) => {
          if (idx === activeIdx) {
            m.classList.add("active");
          } else {
            m.classList.remove("active");
          }
        });
      }
    } else {
      // Editor mode matches
      const q = props.getSearchQuery().trim();
      const text = props.getEditorValue();
      if (!q || !editorTextareaEl) {
        setEditorMatches([]);
        setMarkers([]);
        setActiveIndex(-1);
        return;
      }

      const matches: { start: number; end: number }[] = [];
      const lowerText = text.toLowerCase();
      const lowerQ = q.toLowerCase();
      let idx = lowerText.indexOf(lowerQ);
      while (idx !== -1) {
        matches.push({ start: idx, end: idx + q.length });
        idx = lowerText.indexOf(lowerQ, idx + 1);
      }

      setEditorMatches(matches);

      // Calculate markers based on line numbers
      const totalLines = text.split("\n").length;
      if (totalLines > 0) {
        const markers = matches.map(match => {
          const newlinesBefore = text.slice(0, match.start).split("\n").length - 1;
          return (newlinesBefore / totalLines) * 100;
        });
        setMarkers(markers);
      } else {
        setMarkers([]);
      }

      if (matches.length === 0) {
        setActiveIndex(-1);
      } else {
        let activeIdx = getActiveIndex();
        if (activeIdx < 0 || activeIdx >= matches.length) {
          activeIdx = 0;
          setActiveIndex(0);
        }
        // Auto-select text match in editor during search updates
        scrollToEditorMatch(activeIdx);
      }
    }
  }

  function goNext() {
    if (props.getShowTreeView()) {
      const matches = getMatchElements();
      if (matches.length === 0) return;
      const nextIndex = (getActiveIndex() + 1) % matches.length;
      setActiveIndex(nextIndex);
      scrollToMatch(nextIndex);
    } else {
      const matches = getEditorMatches();
      if (matches.length === 0) return;
      const nextIndex = (getActiveIndex() + 1) % matches.length;
      setActiveIndex(nextIndex);
      scrollToEditorMatch(nextIndex);
    }
  }

  function goPrev() {
    if (props.getShowTreeView()) {
      const matches = getMatchElements();
      if (matches.length === 0) return;
      const prevIndex = (getActiveIndex() - 1 + matches.length) % matches.length;
      setActiveIndex(prevIndex);
      scrollToMatch(prevIndex);
    } else {
      const matches = getEditorMatches();
      if (matches.length === 0) return;
      const prevIndex = (getActiveIndex() - 1 + matches.length) % matches.length;
      setActiveIndex(prevIndex);
      scrollToEditorMatch(prevIndex);
    }
  }

  function scrollToMatch(index: number) {
    const matches = getMatchElements();
    const el = matches[index];
    if (!el || !nbtTreeEl) return;

    matches.forEach((m, idx) => {
      if (idx === index) {
        m.classList.add("active");
      } else {
        m.classList.remove("active");
      }
    });

    const containerRect = nbtTreeEl.getBoundingClientRect();
    const elemRect = el.getBoundingClientRect();
    
    if (elemRect.top < containerRect.top) {
      nbtTreeEl.scrollTop -= (containerRect.top - elemRect.top) + 40;
    } else if (elemRect.bottom > containerRect.bottom) {
      nbtTreeEl.scrollTop += (elemRect.bottom - containerRect.bottom) + 40;
    }
  }

  function scrollToEditorMatch(index: number) {
    const matches = getEditorMatches();
    const match = matches[index];
    if (!match || !editorTextareaEl) return;

    // Save selection range of current active element (e.g. search input)
    const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    let start = 0;
    let end = 0;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      start = activeEl.selectionStart || 0;
      end = activeEl.selectionEnd || 0;
    }

    editorTextareaEl.focus();
    editorTextareaEl.setSelectionRange(match.start, match.end);
    
    // Restore focus and restore original cursor selection range
    if (activeEl && activeEl !== editorTextareaEl) {
      activeEl.focus();
      if (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") {
        activeEl.setSelectionRange(start, end);
      }
    }
  }

  // Effect to observe content size changes to recalculate scrollbar ticks
  createEffect(() => {
    const el = nbtTreeEl;
    if (!el) return;

    const contentEl = el.firstElementChild;
    if (!contentEl) return;

    const resizeObserver = new ResizeObserver(() => {
      updateMatches();
    });
    resizeObserver.observe(contentEl);

    window.addEventListener("resize", updateMatches);

    onCleanup(() => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMatches);
    });
  });

  // Track search query, editor value, and view mode changes to trigger recalculations
  createEffect(() => {
    props.getSearchQuery();
    props.getEditorValue();
    props.getShowTreeView();
    setTimeout(updateMatches, 0);
  });

  const getMatchesCount = () => {
    return props.getShowTreeView() ? getMatchElements().length : getEditorMatches().length;
  };

  return (
    <main>
      {
        props.getEditorDisabled()
          ? <Welcome
              onOpenFile={props.onOpenFile}
              onCreateBlank={props.onCreateBlank}
              onLoadDemo={props.onLoadDemo}
            />
          : <div class="tree-panel-container">
              <div class="tree-search-container">
                <div class="tree-search-input-wrapper">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    class="tree-search-input-field"
                    placeholder="Search tags or values..."
                    value={props.getSearchQuery()}
                    oninput={event => props.setSearchQuery(event.currentTarget.value)}
                    onkeydown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (event.shiftKey) {
                          goPrev();
                        } else {
                          goNext();
                        }
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        props.setSearchQuery("");
                      }
                    }}
                  />
                  <Show when={props.getSearchQuery() !== ""}>
                    <span class="search-results-counter">
                      {getMatchesCount() > 0 ? getActiveIndex() + 1 : 0} of {getMatchesCount()}
                    </span>
                    <div class="search-nav-buttons">
                      <button class="search-nav-btn" onclick={goPrev} title="Previous match (Shift+Enter)">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      </button>
                      <button class="search-nav-btn" onclick={goNext} title="Next match (Enter)">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    </div>
                  </Show>
                  {props.getSearchQuery() !== "" && (
                    <button class="search-clear-btn" onclick={() => props.setSearchQuery("")}>✕</button>
                  )}
                </div>
              </div>
              <Show when={props.getShowTreeView()} fallback={
                <Editor
                  disabled={props.getEditorDisabled}
                  getValue={props.getEditorValue}
                  setValue={props.setEditorValue}
                  textareaRef={el => {
                    editorTextareaEl = el;
                    setTimeout(updateMatches, 0);
                  }}
                  markers={getMarkers()}
                  activeIndex={getActiveIndex()}
                  searchQuery={props.getSearchQuery}
                />
              }>
                <NBTTree 
                  name={props.getRootName} 
                  value={props.getTreeViewValue}
                  searchQuery={props.getSearchQuery}
                  onUpdateValue={props.onUpdateValue}
                  ref={nbtTreeEl}
                  markers={getMarkers()}
                  activeIndex={getActiveIndex()}
                />
              </Show>
            </div>
      }
    </main>
  );
}