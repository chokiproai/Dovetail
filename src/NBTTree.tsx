import { createMemo, For, Show } from "solid-js";
import { NBTData } from "nbtify";
import { NBTBranch } from "./NBTBranch.js";

import type { Accessor } from "solid-js";
import type { RootName } from "nbtify";

export interface NBTTreeProps {
  name: Accessor<RootName>;
  value: Accessor<NBTData>;
  searchQuery: Accessor<string>;
  onUpdateValue(path: (string | number)[], newValue: any): void;
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
  markers?: number[];
  activeIndex?: number;
}

export function NBTTree(props: NBTTreeProps){
  const getRootTag = createMemo(() => props.value().data);

  return (
    <div class="nbt-tree-wrapper">
      <div class="nbt-tree" ref={props.ref}>
        <NBTBranch 
          name={props.name} 
          value={getRootTag} 
          open
          path={[]}
          searchQuery={props.searchQuery}
          onUpdateValue={props.onUpdateValue}
        />
      </div>
      <Show when={props.markers && props.markers.length > 0}>
        <div class="scroll-markers-track">
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