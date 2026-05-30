import { Match, Switch, createMemo, createSignal, createEffect, For, Show } from "solid-js";
import { TAG, getTagType, Int8, Int32 } from "nbtify";

import type { Accessor } from "solid-js";
import type { Tag, ByteTag, ShortTag, IntTag, LongTag, FloatTag, DoubleTag, ByteArrayTag, StringTag, ListTag, CompoundTag, IntArrayTag, LongArrayTag } from "nbtify";

export interface NBTBranchProps {
  name: Accessor<string | null>;
  value: Accessor<Tag>;
  open?: boolean;
  path: (string | number)[];
  searchQuery: Accessor<string>;
  onUpdateValue(path: (string | number)[], newValue: any): void;
}

export function NBTBranch(props: NBTBranchProps){
  const getType = createMemo<TAG>(() => getTagType(props.value()));

  return (
    <div class="nbt-branch" data-type={getType()}>
      <Switch>
        <Match when={getType() === TAG.BYTE}>
          <ByteView {...props} value={props.value as Accessor<ByteTag>}/>
        </Match>
        <Match when={getType() === TAG.SHORT}>
          <ShortView {...props} value={props.value as Accessor<ShortTag>}/>
        </Match>
        <Match when={getType() === TAG.INT}>
          <IntView {...props} value={props.value as Accessor<IntTag>}/>
        </Match>
        <Match when={getType() === TAG.LONG}>
          <LongView {...props} value={props.value as Accessor<LongTag>}/>
        </Match>
        <Match when={getType() === TAG.FLOAT}>
          <FloatView {...props} value={props.value as Accessor<FloatTag>}/>
        </Match>
        <Match when={getType() === TAG.DOUBLE}>
          <DoubleView {...props} value={props.value as Accessor<DoubleTag>}/>
        </Match>
        <Match when={getType() === TAG.BYTE_ARRAY}>
          <ByteArrayView {...props} value={props.value as Accessor<ByteArrayTag>}/>
        </Match>
        <Match when={getType() === TAG.STRING}>
          <StringView {...props} value={props.value as Accessor<StringTag>}/>
        </Match>
        <Match when={getType() === TAG.LIST}>
          <ListView {...props} value={props.value as Accessor<ListTag<Tag>>}/>
        </Match>
        <Match when={getType() === TAG.COMPOUND}>
          <CompoundView {...props} value={props.value as Accessor<CompoundTag>}/>
        </Match>
        <Match when={getType() === TAG.INT_ARRAY}>
          <IntArrayView {...props} value={props.value as Accessor<IntArrayTag>}/>
        </Match>
        <Match when={getType() === TAG.LONG_ARRAY}>
          <LongArrayView {...props} value={props.value as Accessor<LongArrayTag>}/>
        </Match>
      </Switch>
    </div>
  );
}

function ByteArrayView(props: ContainerViewProps<ByteArrayTag>){
  return <ContainerView {...props}/>;
}

function ListView(props: ContainerViewProps<ListTag<Tag>>){
  return <ContainerView {...props}/>;
}

function CompoundView(props: ContainerViewProps<CompoundTag>){
  return <ContainerView {...props}/>;
}

function IntArrayView(props: ContainerViewProps<IntArrayTag>){
  return <ContainerView {...props}/>;
}

function LongArrayView(props: ContainerViewProps<LongArrayTag>){
  return <ContainerView {...props}/>;
}

type ContainerTag = ByteArrayTag | ListTag<Tag> | CompoundTag | IntArrayTag | LongArrayTag;

interface ContainerViewProps<T extends ContainerTag> {
  name: Accessor<string | null>;
  value: Accessor<T>;
  open?: boolean;
  path: (string | number)[];
  searchQuery: Accessor<string>;
  onUpdateValue(path: (string | number)[], newValue: any): void;
}

function ContainerView<T extends ContainerTag>(props: ContainerViewProps<T>){
  const [getOpen, setOpen] = createSignal<boolean>(props.open ?? false);
  const getType = createMemo<TAG>(() => getTagType(props.value()));

  // Auto-expand folder if any child contains search match
  createEffect(() => {
    const q = props.searchQuery();
    if (q && containsMatch(props.value(), q)) {
      setOpen(true);
    }
  });

  return (
    <details class="nbt-container-details" open={getOpen()} ontoggle={event => setOpen(event.currentTarget.open)}>
      <summary class="nbt-container-summary">
        <span class="nbt-node-name">
          {
            props.name() === null
              ? <i class="unnamed">(unnamed)</i> :
            props.name() === ""
              ? <i class="empty">""</i> :
              <HighlightText text={escapeString(props.name()!)} query={props.searchQuery()} />
          }
        </span>
        {
          getType() !== TAG.COMPOUND &&
            <span class="nbt-node-size">{` [${Object.keys(props.value()).length}]`}</span>
        }
      </summary>
      <div class="nbt-container-content">
        {
          getOpen() && Object.entries(props.value())
            .map(([entryName,entry]) => {
              if (entry === undefined) return;
              if (getType() === TAG.BYTE_ARRAY) entry = new Int8(entry as number);
              if (getType() === TAG.INT_ARRAY) entry = new Int32(entry as number);
              
              const isArrayContainer = getType() === TAG.LIST || getType() === TAG.BYTE_ARRAY || getType() === TAG.INT_ARRAY || getType() === TAG.LONG_ARRAY;
              const childKey = isArrayContainer ? parseInt(entryName, 10) : entryName;

              return (
                <NBTBranch 
                  name={() => entryName} 
                  value={() => entry!}
                  path={[...props.path, childKey]}
                  searchQuery={props.searchQuery}
                  onUpdateValue={props.onUpdateValue}
                />
              );
            })
        }
      </div>
    </details>
  );
}

function ByteView(props: PrimitiveViewProps<ByteTag>){
  return <PrimitiveView {...props}/>;
}

function ShortView(props: PrimitiveViewProps<ShortTag>){
  return <PrimitiveView {...props}/>;
}

function IntView(props: PrimitiveViewProps<IntTag>){
  return <PrimitiveView {...props}/>;
}

function LongView(props: PrimitiveViewProps<LongTag>){
  return <PrimitiveView {...props}/>;
}

function FloatView(props: PrimitiveViewProps<FloatTag>){
  return <PrimitiveView {...props}/>;
}

function DoubleView(props: PrimitiveViewProps<DoubleTag>){
  return <PrimitiveView {...props}/>;
}

function StringView(props: PrimitiveViewProps<StringTag>){
  return <PrimitiveView {...props}/>;
}

type PrimitiveTag = ByteTag | ShortTag | IntTag | LongTag | FloatTag | DoubleTag | StringTag;

interface PrimitiveViewProps<T extends PrimitiveTag> {
  name: Accessor<string | null>;
  value: Accessor<T>;
  path: (string | number)[];
  searchQuery: Accessor<string>;
  onUpdateValue(path: (string | number)[], newValue: any): void;
}

function PrimitiveView<T extends PrimitiveTag>(props: PrimitiveViewProps<T>){
  const [getIsEditing, setIsEditing] = createSignal<boolean>(false);
  let isDiscarded = false;

  const getName = createMemo<string>(() => {
    const name = props.name();
    if (name === null){
      throw new Error(`Tag type '${TAG[getTagType(props.value())]}' must have a name provided in reference to it's parent container.`);
    }
    return name;
  });

  const submitEdit = (val: string) => {
    setIsEditing(false);
    if (isDiscarded) return;
    const originalValueStr = props.value().valueOf().toString();
    if (val === originalValueStr) return;

    const type = getTagType(props.value());
    const parsed = parseNBTValue(val, type);
    props.onUpdateValue(props.path, parsed);
  };

  return (
    <Show
      when={getIsEditing()}
      fallback={
        <span class="nbt-primitive-node" ondblclick={() => { isDiscarded = false; setIsEditing(true); }} title="Double-click to edit value">
          <span class="nbt-node-name">
            {
              props.name() === null
                ? <i class="unnamed">(unnamed)</i> :
              props.name() === ""
                ? <i class="empty">""</i> :
                <HighlightText text={escapeString(getName())} query={props.searchQuery()} />
            }
          </span>
          <span class="nbt-node-separator">: </span>
          <span class="nbt-node-value">
            <HighlightText text={escapeString(props.value().valueOf().toString() satisfies string)} query={props.searchQuery()} />
          </span>
        </span>
      }
    >
      <span class="nbt-primitive-node editing">
        <span class="nbt-node-name">{escapeString(getName())}</span>
        <span class="nbt-node-separator">: </span>
        <input
          type="text"
          class="nbt-inline-input"
          value={props.value().valueOf().toString()}
          ref={el => setTimeout(() => el?.focus(), 50)}
          onkeydown={event => {
            if (event.key === "Enter") {
              submitEdit(event.currentTarget.value);
            } else if (event.key === "Escape") {
              isDiscarded = true;
              setIsEditing(false);
            }
          }}
          onblur={event => submitEdit(event.currentTarget.value)}
        />
      </span>
    </Show>
  );
}

// Helper to escape strings
function escapeString(value: string): string {
  return value
    .replaceAll("\b","\\b")
    .replaceAll("\f","\\f")
    .replaceAll("\n","\\n")
    .replaceAll("\r","\\r")
    .replaceAll("\t","\\t");
}

// Helper to check if tag or child tags contain search query
function containsMatch(tag: Tag, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();

  const searchTag = (t: any): boolean => {
    if (t === null || t === undefined) return false;

    if (typeof t === "string" || typeof t === "number" || typeof t === "boolean") {
      return t.toString().toLowerCase().includes(q);
    }

    if (Array.isArray(t)) {
      return t.some(item => searchTag(item));
    }

    if (typeof t === "object") {
      if ("valueOf" in t && typeof t.valueOf === "function") {
        return t.valueOf().toString().toLowerCase().includes(q);
      }
      return Object.entries(t).some(([k, v]) =>
        k.toLowerCase().includes(q) || searchTag(v)
      );
    }

    return false;
  };

  return searchTag(tag);
}

// Component to highlight matching search characters
function HighlightText(props: { text: string; query: string }) {
  const parts = createMemo(() => {
    const txt = props.text;
    const q = props.query;
    if (!q) return [txt];

    const regex = new RegExp(`(${q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi");
    return txt.split(regex);
  });

  return (
    <For each={parts()}>
      {part =>
        part.toLowerCase() === props.query.toLowerCase()
          ? <mark class="search-highlight">{part}</mark>
          : <span>{part}</span>
      }
    </For>
  );
}

// Helper to parse primitive values back to their correct NBT types
function parseNBTValue(val: string, type: TAG): any {
  switch (type) {
    case TAG.BYTE:
      if (val.toLowerCase() === "true") return 1;
      if (val.toLowerCase() === "false") return 0;
      const parsedByte = parseInt(val, 10);
      return isNaN(parsedByte) ? 0 : parsedByte;
    case TAG.SHORT:
      const parsedShort = parseInt(val, 10);
      return isNaN(parsedShort) ? 0 : parsedShort;
    case TAG.INT:
      const parsedInt = parseInt(val, 10);
      return isNaN(parsedInt) ? 0 : parsedInt;
    case TAG.LONG:
      try {
        const cleanVal = val.replace(/[nl]/gi, "");
        return BigInt(cleanVal);
      } catch {
        return 0n;
      }
    case TAG.FLOAT:
      const parsedFloat = parseFloat(val);
      return isNaN(parsedFloat) ? 0.0 : parsedFloat;
    case TAG.DOUBLE:
      const parsedDouble = parseFloat(val);
      return isNaN(parsedDouble) ? 0.0 : parsedDouble;
    case TAG.STRING:
    default:
      return val;
  }
}
