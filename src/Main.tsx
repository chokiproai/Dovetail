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
  let nbtTreeEl: HTMLDivElement | undefined;

  const updateMatches = () => {
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
  };

  const goNext = () => {
    const matches = getMatchElements();
    if (matches.length === 0) return;
    const nextIndex = (getActiveIndex() + 1) % matches.length;
    setActiveIndex(nextIndex);
    scrollToMatch(nextIndex);
  };

  const goPrev = () => {
    const matches = getMatchElements();
    if (matches.length === 0) return;
    const prevIndex = (getActiveIndex() - 1 + matches.length) % matches.length;
    setActiveIndex(prevIndex);
    scrollToMatch(prevIndex);
  };

  const scrollToMatch = (index: number) => {
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
  };

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

  // Track search query changes to trigger recalculations
  createEffect(() => {
    props.getSearchQuery();
    setTimeout(updateMatches, 0);
  });

  return (
    <main>
      {
        props.getEditorDisabled()
          ? <Welcome
              onOpenFile={props.onOpenFile}
              onCreateBlank={props.onCreateBlank}
              onLoadDemo={props.onLoadDemo}
            />
          : props.getShowTreeView()
            ? <div class="tree-panel-container">
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
                        {getMatchElements().length > 0 ? getActiveIndex() + 1 : 0} of {getMatchElements().length}
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
                <NBTTree 
                  name={props.getRootName} 
                  value={props.getTreeViewValue}
                  searchQuery={props.getSearchQuery}
                  onUpdateValue={props.onUpdateValue}
                  ref={nbtTreeEl}
                  markers={getMarkers()}
                  activeIndex={getActiveIndex()}
                />
              </div>
            : <Editor
                disabled={props.getEditorDisabled}
                getValue={props.getEditorValue}
                setValue={props.setEditorValue}
              />
      }
    </main>
  );
}