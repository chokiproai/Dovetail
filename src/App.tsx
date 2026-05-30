import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { parse, stringify, NBTData } from "nbtify";
import { openFile, readFile, saveFile, shareFile, writeFile } from "./file.js";
import { Header } from "./Header.js";
import { Main } from "./Main.js";
import { FormatOptions } from "./FormatOptions.js";

import type { RootName, Endian, Compression, BedrockLevel, Format, RootTag } from "nbtify";

export interface AppProps {
  isiOSDevice: boolean;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const demoSNBT = `{
  DataVersion: 3463,
  LevelName: "Dovetail Demo World",
  Difficulty: 2b,
  CheatsEnabled: 1b,
  DayTime: 6000l,
  Player: {
    OnGround: 1b,
    Air: 300s,
    Fire: -20s,
    FallDistance: 0.0f,
    Pos: [0.0d, 64.0d, 0.0d],
    Rotation: [90.0f, 0.0f],
    Health: 20.0f,
    Score: 1024,
    Inventory: [
      { id: "minecraft:diamond_sword", Count: 1b, Slot: 0b, tag: { Damage: 0, Enchantments: [{ id: "minecraft:sharpness", lvl: 5s }, { id: "minecraft:mending", lvl: 1s }] } },
      { id: "minecraft:cooked_beef", Count: 64b, Slot: 1b },
      { id: "minecraft:shulker_box", Count: 1b, Slot: 2b, tag: { BlockEntityTag: { Items: [{ id: "minecraft:netherite_ingot", Count: 64b, Slot: 0b }] } } }
    ]
  }
}`;

export function App(props: AppProps){
  // global state
  const [getShowTreeView,setShowTreeView] = createSignal<boolean>(false);
  const [getTreeViewValue,setTreeViewValue] = createSignal<NBTData>(new NBTData({}));
  const [getShowFormatDialog,setShowFormatDialog] = createSignal<boolean>(false);
  /** The name of the currently opened file. */
  const [getName,setName] = createSignal<string>("");
  const [getFileHandle,setFileHandle] = createSignal<FileSystemFileHandle | null>(null);
  const [getEditorValue,setEditorValue] = createSignal<string>("");
  const [getEditorDisabled,setEditorDisabled] = createSignal<boolean>(true);
  const getEditingSNBT = createMemo<boolean>(() => getName().endsWith(".snbt"));
  const [getRootName,setRootName] = createSignal<RootName>("");
  const [getEndian,setEndian] = createSignal<Endian>("big");
  const [getCompression,setCompression] = createSignal<Compression>(null);
  const [getBedrockLevel,setBedrockLevel] = createSignal<BedrockLevel>(false);
  
  // Custom enhanced states
  const [getIsDragging, setIsDragging] = createSignal<boolean>(false);
  const [getSearchQuery, setSearchQuery] = createSignal<string>("");
  const [getFileSize, setFileSize] = createSignal<number>(0);

  /**
   * Turns the values from the Format Options dialog into the NBT file's metadata.
  */
  const getFormat = (): Format => ({
    rootName: getRootName(),
    endian: getEndian(),
    compression: getCompression(),
    bedrockLevel: getBedrockLevel()
  });
  /**
   * Updates the Format Options dialog to match an NBT file's format metadata.
  */
  const setFormat = (format: Format): Format => {
    const { rootName, endian, compression, bedrockLevel } = format;
    setRootName(rootName);
    setEndian(endian);
    setCompression(compression);
    setBedrockLevel(bedrockLevel);
    return format;
  }

  createEffect(() => {
    if (!getShowTreeView()) return;
    let rootTag: RootTag;
    try {
      rootTag = getEditorValue() === ""
        ? {}
        : parse(getEditorValue());
    } catch (error){
      console.warn(error);
      return;
    }
    const nbt = new NBTData(rootTag,getFormat());
    setTreeViewValue(nbt);
  });

  const handleLaunch: LaunchConsumer = async launchParams => {
    const { files: handles } = launchParams;
    const [handle] = handles;
    if (handle === undefined) return;

    await openNBTFile(handle);
  };

  window.launchQueue?.setConsumer?.(handleLaunch);

  enum Shortcut {
    Open = "ControlOrCommand+O",
    Save = "ControlOrCommand+S"
  }

  const handleKeydown: NonNullable<typeof document.onkeydown> = async event => {
    let keys: Set<string> = new Set();
    if (event.ctrlKey || event.metaKey) keys.add("ControlOrCommand");
    if (event.altKey) keys.add("Alt");
    if (event.shiftKey) keys.add("Shift");
    if (event.key !== "Control" && event.key !== "Meta") keys.add(event.key.length === 1 ? event.key.toUpperCase() : event.key);

    const combo: string = [...keys].join("+");
    const isCombo: boolean = Object.values(Shortcut).some(shortcut => shortcut === combo);

    if (!isCombo) return;
    event.preventDefault();
    if (event.repeat) return;

    switch (combo as Shortcut){
      case Shortcut.Open: return await openNBTFile();
      case Shortcut.Save: return await saveNBTFile();
    }
  };

  document.addEventListener("keydown",handleKeydown);

  // Custom drag state tracking to prevent flickering
  let dragCounter = 0;

  const handleDragenter = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer?.types.includes("Files")) {
      dragCounter++;
      setIsDragging(true);
    }
  };

  const handleDragleave = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer?.types.includes("Files")) {
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    }
  };

  const handleDragover: NonNullable<typeof document.ondragover> = event => {
    event.preventDefault();
    if (event.dataTransfer === null) return;
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop: NonNullable<typeof document.ondrop> = async event => {
    event.preventDefault();
    setIsDragging(false);
    dragCounter = 0;
    if (event.dataTransfer === null) return;

    const items = [...event.dataTransfer.items]
      .filter((item): item is DataTransferFile => item.kind === "file");
    const [item] = items;
    if (item === undefined) return;

    await openNBTFile(item);
  };

  document.addEventListener("dragenter", handleDragenter);
  document.addEventListener("dragleave", handleDragleave);
  document.addEventListener("dragover", handleDragover);
  document.addEventListener("drop", handleDrop);

  /**
   * Opens an NBT file in the editor.
  */
  async function openNBTFile(file: File | FileSystemFileHandle | DataTransferFile | null = null): Promise<void> {
    setEditorDisabled(true);

    try {
      file = await openFile(file);
    } catch (error: unknown){
      if (!(error instanceof DOMException) || error.name !== "AbortError"){
        alert(error);
      }
      setEditorDisabled(false);
      return;
    }
    if (file === null) return;

    if ("getFile" in file){
      setFileHandle(file);
      file = await file.getFile();
    } else {
      setFileHandle(null);
    }

    setFileSize(file.size);

    let nbt: NBTData;

    try {
      nbt = await readFile(file);
    } catch (error: unknown){
      if (error instanceof Error && error.message.includes("unread bytes remaining")){
        const reattempt = confirm(`${error}\n\nEncountered extra data at the end of '${file.name}'. Would you like to try opening it again without 'strict mode' enabled? The trailing data will be lost when re-saving your file again.`);
        if (!reattempt){
          setEditorDisabled(false);
          return;
        }
        nbt = await readFile(file,{ strict: false });
      } else {
        alert(`Could not read '${file.name}' as NBT data.\n\n${error}`);
        setEditorDisabled(false);
        return;
      }
    }

    const snbt = stringify(nbt,{ space: 2 });
    setFormat(nbt);
    setName(file.name);

    document.title = `Dovetail - ${getName()}`;

    setEditorValue(snbt);
    setEditorDisabled(false);
    setTreeViewValue(nbt);
  }

  /**
   * Saves the current NBT file from the editor.
  */
  async function saveNBTFile(file: File | null = null): Promise<void> {
    if (file === null){
      try {
        const snbt = getEditorValue();
        const nbt = parse(snbt);
        const options = getFormat();
        const nbtData = new NBTData(nbt,options);
        file = await writeFile(nbtData,getName());
        setFileSize(file.size);

        if (props.isiOSDevice && window.isSecureContext){
          return await shareFile(file);
        }
      } catch (error: unknown){
        alert(`Could not save '${getName()}' as NBT data.\n\n${error}`);
        return;
      }
    }

    const fileHandle = getFileHandle();

    if (fileHandle !== null){
      try {
        return await saveFile(file,fileHandle);
      } catch {
        const saveManually = confirm(`'${file.name}' could not be saved in-place. Would you like to try saving it manually? It may go directly to your Downloads folder.`);
        if (!saveManually) return;
      }
    }

    await saveFile(file,null);
  }

  /**
   * Resets the editor to its initial empty state.
  */
  function closeNBTFile(): void {
    setEditorDisabled(true);
    setFileHandle(null);
    setName("");
    setEditorValue("");
    setFileSize(0);
    setTreeViewValue(new NBTData({}));
    setSearchQuery("");
    document.title = "Dovetail";
  }

  /**
   * Loads the demo Minecraft inventory NBT data.
   */
  function loadDemoNBT(): void {
    setEditorDisabled(false);
    setName("demo_inventory.snbt");
    setEditorValue(demoSNBT);
    setFileSize(demoSNBT.length);
    setRootName("");
    setEndian("big");
    setCompression(null);
    setBedrockLevel(false);
    
    document.title = `Dovetail - ${getName()}`;

    try {
      const rootTag = parse(demoSNBT);
      setTreeViewValue(new NBTData(rootTag, getFormat()));
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Creates an empty NBT structure.
   */
  function createBlankNBT(): void {
    setEditorDisabled(false);
    setName("untitled.snbt");
    setEditorValue("{}");
    setFileSize(2);
    setRootName("");
    setEndian("big");
    setCompression(null);
    setBedrockLevel(false);
    
    document.title = `Dovetail - ${getName()}`;
    setTreeViewValue(new NBTData({}, getFormat()));
  }

  function setValueAtPath(obj: any, path: (string | number)[], value: any) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key !== undefined) {
        current = current[key];
      }
    }
    const lastKey = path[path.length - 1];
    if (lastKey !== undefined) {
      current[lastKey] = value;
    }
  }

  /**
   * Updates NBT data based on path mutations from visual edits
   */
  function handleUpdateValue(path: (string | number)[], newValue: any) {
    try {
      const snbt = getEditorValue();
      const nbt = parse(snbt);
      setValueAtPath(nbt, path, newValue);
      const updatedSnbt = stringify(nbt, { space: 2 });
      setEditorValue(updatedSnbt);
      setFileSize(updatedSnbt.length);
    } catch (error) {
      console.error("Failed to update NBT tree value:", error);
    }
  }

  return (
    <>
      <Header
        getEditorDisabled={getEditorDisabled}
        setEditorDisabled={setEditorDisabled}
        getEditingSNBT={getEditingSNBT}
        getShowTreeView={getShowTreeView}
        setShowTreeView={setShowTreeView}
        setShowFormatDialog={setShowFormatDialog}
        openFile={openNBTFile}
        saveFile={saveNBTFile}
        closeFile={closeNBTFile}
      />
      <Main
        getRootName={getRootName}
        getEditorDisabled={getEditorDisabled}
        getEditorValue={getEditorValue}
        setEditorValue={setEditorValue}
        getShowTreeView={getShowTreeView}
        getTreeViewValue={getTreeViewValue}
        onOpenFile={() => openNBTFile()}
        onCreateBlank={createBlankNBT}
        onLoadDemo={loadDemoNBT}
        getSearchQuery={getSearchQuery}
        setSearchQuery={setSearchQuery}
        onUpdateValue={handleUpdateValue}
      />
      <FormatOptions
        getRootName={getRootName}
        setRootName={setRootName}
        getEndian={getEndian}
        setEndian={setEndian}
        getCompression={getCompression}
        setCompression={setCompression}
        getBedrockLevel={getBedrockLevel}
        setBedrockLevel={setBedrockLevel}
        getOpen={getShowFormatDialog}
        setOpen={setShowFormatDialog}
      />
      
      <Show when={getIsDragging()}>
        <div class="drag-overlay">
          <div class="drag-overlay-content">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drag-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <h3>Drop NBT file to open</h3>
            <p>Supports .nbt, .dat, .snbt formats</p>
          </div>
        </div>
      </Show>

      <footer class="app-status-bar">
        <div class="status-item file-name">
          <span class="status-dot" classList={{ active: !getEditorDisabled() }}></span>
          <span>{getEditorDisabled() ? "No File Loaded" : getName()}</span>
        </div>
        <Show when={!getEditorDisabled()}>
          <div class="status-right">
            <div class="status-item">
              <span class="status-label">Size:</span>
              <span class="status-value">{formatBytes(getFileSize())}</span>
            </div>
            <div class="status-item">
              <span class="status-label">Endian:</span>
              <span class="status-value">{getEndian()}</span>
            </div>
            <div class="status-item">
              <span class="status-label">Compression:</span>
              <span class="status-value">{getCompression() === "deflate" ? "deflate (zlib)" : getCompression() ?? "none"}</span>
            </div>
            <div class="status-item">
              <span class="status-label">Bedrock Header:</span>
              <span class="status-value">{getBedrockLevel() ? "Yes" : "No"}</span>
            </div>
          </div>
        </Show>
      </footer>
    </>
  );
}