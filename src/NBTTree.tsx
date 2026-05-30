import { createMemo } from "solid-js";
import { NBTData } from "nbtify";
import { NBTBranch } from "./NBTBranch.js";

import type { Accessor } from "solid-js";
import type { RootName } from "nbtify";

export interface NBTTreeProps {
  name: Accessor<RootName>;
  value: Accessor<NBTData>;
  searchQuery: Accessor<string>;
  onUpdateValue(path: (string | number)[], newValue: any): void;
}

export function NBTTree(props: NBTTreeProps){
  const getRootTag = createMemo(() => props.value().data);

  return (
    <div class="nbt-tree">
      <NBTBranch 
        name={props.name} 
        value={getRootTag} 
        open
        path={[]}
        searchQuery={props.searchQuery}
        onUpdateValue={props.onUpdateValue}
      />
    </div>
  );
}