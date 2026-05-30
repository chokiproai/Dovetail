import icon from "/img/icon.svg";

export interface WelcomeProps {
  onOpenFile(): void;
  onCreateBlank(): void;
  onLoadDemo(): void;
}

export function Welcome(props: WelcomeProps){
  return (
    <div class="welcome-container">
      <div class="welcome-card">
        <div class="welcome-logo">
          <img draggable="false" src={icon} alt="Dovetail Logo" class="welcome-logo-img"/>
          <h2>Welcome to Dovetail</h2>
          <p>A modern, cross-platform Minecraft NBT editor in your browser</p>
        </div>

        <div class="welcome-actions">
          <button class="welcome-btn btn-primary" onclick={() => props.onOpenFile()}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Open NBT File</span>
          </button>
          
          <button class="welcome-btn btn-outline" onclick={() => props.onCreateBlank()}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>Create Blank NBT</span>
          </button>

          <button class="welcome-btn btn-success" onclick={() => props.onLoadDemo()}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Load Demo NBT</span>
          </button>
        </div>

        <div class="welcome-dropzone" onclick={() => props.onOpenFile()}>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dropzone-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p>Drag & Drop your <code>.nbt</code>, <code>.dat</code>, or <code>.snbt</code> file here</p>
          <span>or click to browse local files</span>
        </div>
      </div>
    </div>
  );
}
