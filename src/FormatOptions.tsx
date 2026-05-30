import { createEffect, createSignal } from "solid-js";

import type { Accessor, JSX, Setter } from "solid-js";
import type { RootName, Endian, Compression, BedrockLevel } from "nbtify";

export interface FormatOptionsProps {
  getRootName: Accessor<RootName>;
  setRootName: Setter<RootName>;
  getEndian: Accessor<Endian>;
  setEndian: Setter<Endian>;
  getCompression: Accessor<Compression>;
  setCompression: Setter<Compression>;
  getBedrockLevel: Accessor<BedrockLevel>;
  setBedrockLevel: Setter<BedrockLevel>;
  getOpen: Accessor<boolean>;
  setOpen: Setter<boolean>;
}

export function FormatOptions(props: FormatOptionsProps){
  const [getFormatDialog,setFormatDialog] = createSignal<HTMLDialogElement | null>(null);

  createEffect(() => {
    const dialog = getFormatDialog();
    if (dialog?.open && !props.getOpen()){
      dialog.close();
    } else if (!dialog?.open && props.getOpen()){
      dialog?.showModal();
    }
  });

  return (
    <dialog ref={setFormatDialog} class="format-dialog" onclose={() => props.getOpen() && props.setOpen(false)}>
      <form method="dialog" class="format-form">
        <div class="dialog-header">
          <h3>Format Options</h3>
          <button type="submit" aria-label="Close" class="dialog-close-btn">✕</button>
        </div>

        <fieldset class="dialog-fieldset">
          <legend>Root Name</legend>

          <div class="input-group">
            <input
              type="text"
              name="name"
              class="dialog-text-input"
              placeholder="<empty>"
              autocomplete="off"
              autocorrect="on"
              disabled={props.getRootName() === null}
              value={props.getRootName() === null ? "" : props.getRootName()!}
              oninput={event => props.setRootName(event.currentTarget.value)}
            />
          </div>
          <div class="checkbox-wrapper">
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="disableName"
                checked={props.getRootName() === null}
                oninput={event => props.setRootName(event.currentTarget.checked ? null : "")}
              />
              <span class="checkbox-custom"></span>
              <span class="label-text">Disable Root Name</span>
            </label>
          </div>
        </fieldset>

        <fieldset class="dialog-fieldset">
          <legend>Endian</legend>
          <div class="radio-group-horizontal">
            {
              (["big", "little", "little-varint"] satisfies Endian[])
                .map(endian =>
                  <label class="radio-label">
                    <input
                      type="radio"
                      name="endian"
                      value={endian}
                      checked={props.getEndian() === endian}
                      oninput={() => props.setEndian(endian)}
                    />
                    <span class="radio-custom"></span>
                    <span class="label-text">{` ${endian.slice(0,1).toUpperCase()}${endian.slice(1)} `}</span>
                  </label>
                )
            }
          </div>
        </fieldset>

        <fieldset class="dialog-fieldset">
          <legend>Compression</legend>
          <div class="compression-grid">
            {
              ([null, "gzip", "deflate", "deflate-raw"] satisfies Compression[])
                .map(compression =>
                  <label class="radio-label">
                    <input
                      type="radio"
                      name="compression"
                      value={compression ?? "none"}
                      checked={props.getCompression() === compression}
                      oninput={() => props.setCompression(compression)}
                    />
                    <span class="radio-custom"></span>
                    <span class="label-text">{` ${compression === "deflate" ? `${compression} (zlib)` : compression ?? "None"} `}</span>
                  </label>
                )
                .reduce<JSX.Element[]>((previous, compression, i) => {
                  if (i % 2 === 0){
                    previous.push(<div class="radio-row">{compression}</div>);
                  } else {
                    (previous.at(-1) as HTMLDivElement).append(compression as HTMLLabelElement);
                  }
                  return previous;
                },[])
            }
          </div>
        </fieldset>

        <fieldset class="dialog-fieldset">
          <legend>Bedrock Level</legend>
          <div class="checkbox-wrapper">
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="bedrockLevel"
                checked={props.getBedrockLevel()}
                oninput={event => props.setBedrockLevel(event.currentTarget.checked)}
              />
              <span class="checkbox-custom"></span>
              <span class="label-text">Bedrock Level Header <code>(Uint32)</code></span>
            </label>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}