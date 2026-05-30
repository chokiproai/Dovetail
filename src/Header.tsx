import icon from "/img/icon.svg";

import { Show } from "solid-js";
import type { Accessor, Setter } from "solid-js";

export interface HeaderProps {
  getEditorDisabled: Accessor<boolean>;
  setEditorDisabled: Setter<boolean>;
  getEditingSNBT: Accessor<boolean>;
  getShowTreeView: Accessor<boolean>;
  setShowTreeView: Setter<boolean>;
  setShowFormatDialog: Setter<boolean>;
  openFile(): void;
  saveFile(): void;
  closeFile(): void;
}

export function Header(props: HeaderProps){
  return (
    <header class="app-header">
      <div class="logo-container">
        <img draggable="false" src={icon} alt="Dovetail Logo" class="logo-img"/>
        <span class="logo-text">Dovetail</span>
      </div>
      <div class="actions-container">
        <button
          class="btn btn-primary"
          onclick={() => props.openFile()}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          Open
        </button>
        <button
          class="btn btn-success"
          disabled={props.getEditorDisabled()}
          onclick={() => props.saveFile()}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          Save
        </button>
        <Show when={!props.getEditorDisabled()}>
          <button
            class="btn btn-danger"
            onclick={() => props.closeFile()}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            Close
          </button>
        </Show>
        <button
          class="btn btn-outline"
          disabled={props.getEditorDisabled() || props.getEditingSNBT()}
          onclick={() => props.setShowFormatDialog(showFormatDialog => !showFormatDialog)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          Format Options
        </button>
      </div>

      <div class="header-right">
        <div class="toggle-container">
          <span class="toggle-label">Tree View</span>
          <label class="switch-control">
            <input
              type="checkbox"
              name="treeView"
              checked={props.getShowTreeView()}
              oninput={() => props.setShowTreeView(treeView => !treeView)}
            />
            <span class="switch-slider"></span>
          </label>
        </div>

        <a 
          href="https://github.com/chokiproai/Dovetail" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="github-btn"
          title="GitHub profile chokiproai/Dovetail"
        >
          <svg height="18" viewBox="0 0 16 16" width="18" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span>Dovetail</span>
        </a>
      </div>
    </header>
  );
}