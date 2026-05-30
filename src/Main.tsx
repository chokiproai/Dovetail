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
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    class="tree-search-input"
                    placeholder="Search tags or values..."
                    value={props.getSearchQuery()}
                    oninput={event => props.setSearchQuery(event.currentTarget.value)}
                  />
                  {props.getSearchQuery() !== "" && (
                    <button class="search-clear-btn" onclick={() => props.setSearchQuery("")}>✕</button>
                  )}
                </div>
                <NBTTree 
                  name={props.getRootName} 
                  value={props.getTreeViewValue}
                  searchQuery={props.getSearchQuery}
                  onUpdateValue={props.onUpdateValue}
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