import { For, Show, createMemo } from "solid-js";
import type { Accessor, Setter } from "solid-js";

export interface EditorProps {
  disabled: Accessor<boolean>;
  getValue: Accessor<string>;
  setValue: Setter<string>;
  textareaRef?: (el: HTMLTextAreaElement) => void;
  markers?: number[];
  activeIndex?: number;
  searchQuery: Accessor<string>;
}

export function Editor(props: EditorProps){
  let backdropEl: HTMLDivElement | undefined;

  const handleScroll = (e: Event) => {
    const target = e.currentTarget as HTMLTextAreaElement;
    if (backdropEl) {
      backdropEl.scrollTop = target.scrollTop;
      backdropEl.scrollLeft = target.scrollLeft;
    }
  };

  const escapeHTML = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const getHighlightedContent = createMemo(() => {
    const text = props.getValue();
    const q = props.searchQuery().trim();
    if (!q) {
      return escapeHTML(text);
    }

    const escapedQ = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const regex = new RegExp(`(${escapedQ})`, "gi");
    
    let matchCount = 0;
    const parts = text.split(regex);
    const lowerQ = q.toLowerCase();

    return parts.map(part => {
      if (part.toLowerCase() === lowerQ) {
        const isCurrentActive = matchCount === props.activeIndex;
        matchCount++;
        const className = isCurrentActive ? "editor-highlight active" : "editor-highlight";
        return `<mark class="${className}">${escapeHTML(part)}</mark>`;
      }
      return escapeHTML(part);
    }).join("");
  });

  return (
    <div class="editor-container">
      <div class="editor-wrapper">
        <textarea
          ref={props.textareaRef}
          class="editor-textarea"
          name="editor"
          disabled={props.disabled()}
          placeholder="NBT data will show here... Open a file or start writing SNBT."
          wrap="off"
          spellcheck={false}
          autocomplete="off"
          autocapitalize="none"
          autocorrect="off"
          value={props.getValue()}
          oninput={event => {
            props.setValue(event.currentTarget.value);
            if (backdropEl) {
              backdropEl.scrollTop = event.currentTarget.scrollTop;
              backdropEl.scrollLeft = event.currentTarget.scrollLeft;
            }
          }}
          onscroll={handleScroll}
        />
        <div 
          ref={backdropEl} 
          class="editor-backdrop"
          innerHTML={getHighlightedContent()}
        />
      </div>
      <Show when={props.markers && props.markers.length > 0}>
        <div 
          class="scroll-markers-track" 
          style={{ 
            right: "calc(1.25rem + 1px)", 
            top: "calc(1.25rem + 1px)", 
            bottom: "calc(1.25rem + 1px)", 
            "border-radius": "0 11px 11px 0" 
          }}
        >
          <For each={props.markers}>
            {(marker, index) => (
              <div 
                class="scroll-marker" 
                classList={{ active: index() === props.activeIndex }} 
                style={{ top: `${marker}%` }}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}