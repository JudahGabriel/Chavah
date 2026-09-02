import { LitElement, html } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import Croppie from "croppie";
import "croppie/croppie.css";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/button/button.js";

export interface CropImageResult {
  imageBase64: string;
  image: Blob;
}

/**
 * A circular image-crop dialog, ported from the AngularJS `CropImageController`
 * + `imageCropper` (Croppie) directive + `CropImageModal.html`. Uses a
 * `<wa-dialog>` shell and the Croppie library for pan/zoom/crop.
 *
 * Use {@link openCropImageDialog} to invoke it imperatively.
 */
@customElement("crop-image-dialog")
export class CropImageDialog extends LitElement {
  /** The image file to crop. */
  file: File | null = null;

  /** Resolves with the crop result, or null if cancelled. */
  private resolve: ((result: CropImageResult | null) => void) | null = null;

  @state() private dialogOpen = false;
  @state() private rawImage: string | null = null;

  private croppie: Croppie | null = null;
  private settled = false;

  @query(".crop-image-container") private container!: HTMLElement;

  // Light DOM so the imported Croppie CSS and global styles apply.
  protected createRenderRoot() {
    return this;
  }

  open(file: File): Promise<CropImageResult | null> {
    this.file = file;
    this.settled = false;
    this.dialogOpen = true;
    this.loadRawImage(file).then((dataUrl) => {
      this.rawImage = dataUrl;
    });
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  private loadRawImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string), false);
      reader.addEventListener("error", () => reject(reader.error), false);
      reader.readAsDataURL(file);
    });
  }

  private initCroppie() {
    if (!this.rawImage || !this.container || this.croppie) {
      return;
    }
    this.croppie = new Croppie(this.container, {
      viewport: { width: 200, height: 200, type: "circle" },
      boundary: { width: 300, height: 300 },
    });
    void this.croppie.bind({ url: this.rawImage });
  }

  private async apply() {
    if (!this.croppie) {
      return;
    }
    const [image, imageBase64] = await Promise.all([
      this.croppie.result({ type: "blob", circle: true }) as Promise<Blob>,
      this.croppie.result({ type: "base64", circle: true }) as Promise<string>,
    ]);
    this.settle({ image, imageBase64 });
  }

  private cancel() {
    this.settle(null);
  }

  private settle(result: CropImageResult | null) {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.dialogOpen = false;
    this.resolve?.(result);
    this.resolve = null;
    // Tear down Croppie and remove ourselves from the DOM after the dialog closes.
    setTimeout(() => {
      this.croppie?.destroy();
      this.croppie = null;
      this.remove();
    }, 300);
  }

  protected updated() {
    // Once the dialog is open and the raw image has loaded, spin up Croppie.
    if (this.dialogOpen && this.rawImage && !this.croppie) {
      // Wait a tick so the container has layout dimensions.
      requestAnimationFrame(() => this.initCroppie());
    }
  }

  protected render() {
    return html`
      <wa-dialog
        label="Position and size your photo"
        class="crop-image-modal"
        ?open=${this.dialogOpen}
        @wa-hide=${() => this.cancel()}
      >
        <div class="crop-image-body" style="display: flex; justify-content: center;">
          <div class="crop-image-container" style="height: 300px; width: 300px;"></div>
        </div>
        <wa-button slot="footer" variant="neutral" @click=${() => this.cancel()}>Cancel</wa-button>
        <wa-button slot="footer" variant="brand" @click=${() => this.apply()}>Apply</wa-button>
      </wa-dialog>
    `;
  }
}

/**
 * Opens the circular crop dialog for the given file. Resolves with the cropped
 * image (blob + base64) or null if the user cancelled.
 */
export function openCropImageDialog(file: File): Promise<CropImageResult | null> {
  const dialog = document.createElement("crop-image-dialog") as CropImageDialog;
  document.body.appendChild(dialog);
  return dialog.open(file);
}

declare global {
  interface HTMLElementTagNameMap {
    "crop-image-dialog": CropImageDialog;
  }
}
