import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import { accountService } from "../services/account-service";
import { userApi } from "../services/user-api-service";
import { pushNotifications } from "../services/push-notification-service";
import { openCropImageDialog } from "../components/crop-image-dialog";
import { User } from "../models/user";

/** Formats a registration date like "3 years ago (Monday, January 1, 2021, 9:30 AM)" using Intl. */
function formatRegistrationDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return "";
  }
  const full = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${formatRelative(date)} (${full})`;
}

function formatRelative(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000000],
    ["month", 2592000000],
    ["week", 604800000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
    ["second", 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "second") {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return "";
}

/**
 * The user's profile page (`/profile`). Ported from the AngularJS
 * `ProfileController` + `Profile.html`. Supports editing name, uploading and
 * cropping a profile photo, toggling push notifications, and deleting the
 * account.
 */
@customElement("profile-page")
export class ProfilePage extends LitElement {
  @state() private user: User | null = null;
  @state() private profilePicUrl: string | null = null;
  @state() private registrationDateAgo = "";
  @state() private isSaving = false;
  @state() private isUploadingPhoto = false;
  @state() private hasSavedSuccessfully = false;
  @state() private deviceSupportsPushNotifications = false;
  @state() private isSubscribedPushNotifications = false;
  @state() private showPushNotificationsBlocked = false;
  @state() private showDeleteConfirm = false;

  protected createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    const current = accountService.currentUser;
    if (current) {
      // Make a copy of the user so we can edit freely without committing.
      this.user = new User(current);
      this.profilePicUrl = this.user.profilePicUrl;
      this.registrationDateAgo = formatRegistrationDate(this.user.registrationDate);
    }
    void this.loadPushNotificationState();
  }

  private get isSavingOrUploading(): boolean {
    return this.isSaving || this.isUploadingPhoto;
  }

  private async loadPushNotificationState() {
    this.deviceSupportsPushNotifications = await pushNotifications.isSupported();
    this.isSubscribedPushNotifications = await pushNotifications.isSubscribed();
    const state = await pushNotifications.getStatus().catch(() => "prompt" as PermissionState);
    this.showPushNotificationsBlocked = state === "denied";
  }

  private launchImagePicker() {
    const picker = this.querySelector<HTMLInputElement>("#imagePicker");
    picker?.click();
  }

  private async profilePicChanged(e: Event) {
    if (this.isSaving) {
      return;
    }
    const input = e.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) {
      return;
    }

    // Launch the crop dialog and let them zoom/pan/crop.
    const cropResult = await openCropImageDialog(file);
    if (cropResult && cropResult.image) {
      // Immediately update the image on screen.
      if (cropResult.imageBase64) {
        this.profilePicUrl = cropResult.imageBase64;
      }

      // Now send it to the server.
      this.isUploadingPhoto = true;
      this.hasSavedSuccessfully = false;
      try {
        const updatedProfilePic = await userApi.updateProfilePic(cropResult.image);
        this.profilePicUrl = updatedProfilePic;
        this.hasSavedSuccessfully = true;
      } finally {
        this.isUploadingPhoto = false;
      }
    }

    // Reset the input so re-selecting the same file fires change again.
    input.value = "";
  }

  private async subscribeToPushNotifications() {
    if (await pushNotifications.isSubscribed()) {
      return;
    }
    const permissionResult = await pushNotifications.askPermission();
    if (permissionResult === "granted") {
      this.isSaving = true;
      try {
        await pushNotifications.subscribe();
      } finally {
        this.isSaving = false;
      }
    }
    void this.loadPushNotificationState();
  }

  private async unsubscribeFromPushNotifications() {
    this.isSaving = true;
    try {
      await pushNotifications.unsubscribe();
    } finally {
      this.isSaving = false;
    }
    void this.loadPushNotificationState();
  }

  private async save() {
    if (this.isSaving || !this.user) {
      return;
    }
    this.isSaving = true;
    this.hasSavedSuccessfully = false;
    try {
      const updatedUser = await userApi.updateProfile(this.user);
      this.hasSavedSuccessfully = true;
      accountService.currentUser?.updateFrom(updatedUser);
    } finally {
      this.isSaving = false;
    }
  }

  private async deleteMyAccount() {
    this.isSaving = true;
    try {
      await accountService.deleteAccount();
      window.location.href = "/";
    } finally {
      this.isSaving = false;
    }
  }

  private updateUserField(field: "firstName" | "lastName", value: string) {
    if (this.user) {
      this.user[field] = value;
    }
  }

  protected render() {
    if (!this.user) {
      return nothing;
    }

    return html`
      <section class="page profile-page">
        <div class="profile-layout">
          <h2 class="page-title">My profile</h2>

          <div class="profile-columns">
            <div class="profile-pic-column">
              ${this.renderProfilePic()}
            </div>

            <div class="profile-details-column">
              <div class="form-group">
                <wa-input
                  label="First name"
                  placeholder="Yochanan"
                  .value=${this.user.firstName ?? ""}
                  @input=${(e: Event) => this.updateUserField("firstName", (e.target as HTMLInputElement).value)}
                ></wa-input>
              </div>
              <div class="form-group">
                <wa-input
                  label="Last name"
                  placeholder="HaMatbil"
                  .value=${this.user.lastName ?? ""}
                  @input=${(e: Event) => this.updateUserField("lastName", (e.target as HTMLInputElement).value)}
                ></wa-input>
              </div>
              <div class="form-group">
                <label>Email</label>
                <p class="form-control-static">${this.user.email}</p>
              </div>

              ${this.renderPushNotifications()}

              <div class="form-group">
                <label>Registered</label>
                <p class="form-control-static">${this.registrationDateAgo}</p>
              </div>
              <div class="form-group">
                <label>Songs played</label>
                <p class="form-control-static">${this.user.totalPlays} songs played</p>
              </div>
              <div class="form-group">
                <label>Song requests</label>
                <p class="form-control-static">${this.user.totalSongRequests} song requests</p>
              </div>

              <div class="profile-actions" style="display: flex; justify-content: space-between; align-items: center;">
                <wa-button variant="brand" ?disabled=${this.isSavingOrUploading} @click=${() => this.save()}>
                  ${this.isSavingOrUploading
                    ? html`<wa-spinner slot="start"></wa-spinner> Saving...`
                    : html`<wa-icon slot="start" name="floppy-disk"></wa-icon> Save`}
                </wa-button>

                <wa-button
                  appearance="plain"
                  class="delete-account-btn"
                  ?disabled=${this.isSavingOrUploading}
                  @click=${() => (this.showDeleteConfirm = true)}
                >
                  <wa-icon slot="start" name="trash" style="color: var(--wa-color-danger-60, #d33);"></wa-icon>
                  <span style="color: var(--wa-color-danger-60, #d33);">Delete my account</span>
                </wa-button>
              </div>

              ${this.hasSavedSuccessfully
                ? html`<p class="text-success" style="margin-top: 0.5rem;"><wa-icon name="circle-check"></wa-icon> Saved!</p>`
                : nothing}
            </div>
          </div>
        </div>

        ${this.renderDeleteConfirm()}
      </section>
    `;
  }

  private renderProfilePic() {
    return html`
      <input
        id="imagePicker"
        class="sr-only"
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        style="position: absolute; width: 1px; height: 1px; opacity: 0;"
        @change=${(e: Event) => this.profilePicChanged(e)}
      />
      ${this.profilePicUrl
        ? html`
            <div class="text-center">
              <div class="img-container">
                <img
                  class="profile-pic"
                  src=${this.profilePicUrl}
                  alt="Profile photo"
                  style="max-width: 100%; border-radius: 50%; cursor: pointer;"
                  @click=${() => this.launchImagePicker()}
                />
              </div>
              <br />
              <wa-button appearance="outlined" size="small" @click=${() => this.launchImagePicker()}>
                Change my profile photo
              </wa-button>
            </div>
          `
        : html`
            <div class="profile-pic-placeholder">
              <div
                class="panel-body"
                role="button"
                aria-hidden="true"
                style="text-align: center; cursor: pointer; padding: 1.5rem; border: 1px dashed var(--wa-color-neutral-40, #ccc); border-radius: var(--wa-border-radius-m, 0.5rem);"
                @click=${() => this.launchImagePicker()}
              >
                <wa-icon name="circle-user" style="font-size: 5rem;"></wa-icon>
                <br /><br />
                <wa-icon name="plus"></wa-icon> Add a profile photo
              </div>
              ${this.isUploadingPhoto
                ? html`<wa-spinner style="font-size: 2rem; margin-top: 1rem;"></wa-spinner>`
                : nothing}
            </div>
          `}
    `;
  }

  private renderPushNotifications() {
    return html`
      <div class="form-group">
        <label>Alert me of new music</label>
        <br />
        ${this.deviceSupportsPushNotifications
          ? html`
              <div class="push-notifications-btns" role="group" style="display: inline-flex; gap: 0.25rem;">
                <wa-button
                  variant=${this.isSubscribedPushNotifications ? "brand" : "neutral"}
                  appearance=${this.isSubscribedPushNotifications ? "filled" : "outlined"}
                  ?disabled=${this.showPushNotificationsBlocked}
                  @click=${() => this.subscribeToPushNotifications()}
                >
                  ${this.isSubscribedPushNotifications ? html`<wa-icon slot="start" name="check"></wa-icon>` : nothing}
                  Yes
                </wa-button>
                <wa-button
                  variant=${!this.isSubscribedPushNotifications ? "brand" : "neutral"}
                  appearance=${!this.isSubscribedPushNotifications ? "filled" : "outlined"}
                  ?disabled=${this.showPushNotificationsBlocked}
                  @click=${() => this.unsubscribeFromPushNotifications()}
                >
                  ${!this.isSubscribedPushNotifications ? html`<wa-icon slot="start" name="check"></wa-icon>` : nothing}
                  No
                </wa-button>
              </div>
            `
          : html`
              <div>
                <wa-icon name="triangle-exclamation"></wa-icon> Your device doesn't support new music push
                notifications. <a href="https://caniuse.com/#search=push" target="_blank" rel="noopener noreferrer">See which devices support this feature</a>.
              </div>
            `}
        ${this.showPushNotificationsBlocked
          ? html`
              <p class="text-warning" style="margin-top: 0.5rem;">
                <wa-icon name="triangle-exclamation"></wa-icon> Your device is currently blocking alerts.
                <a href="https://support.google.com/chrome/answer/3220216?co=GENIE.Platform%3DDesktop&hl=en" target="_blank" rel="noopener noreferrer">Unblock them</a>.
              </p>
            `
          : nothing}
      </div>
    `;
  }

  private renderDeleteConfirm() {
    return html`
      <wa-dialog
        label="Are you sure?"
        ?open=${this.showDeleteConfirm}
        @wa-hide=${() => (this.showDeleteConfirm = false)}
      >
        <p>Do you really want to delete <strong>${this.user?.email}</strong>?</p>
        <wa-button slot="footer" variant="neutral" ?disabled=${this.isSavingOrUploading} @click=${() => (this.showDeleteConfirm = false)}>
          Cancel
        </wa-button>
        <wa-button slot="footer" variant="danger" ?disabled=${this.isSavingOrUploading} @click=${() => this.deleteMyAccount()}>
          ${this.isSavingOrUploading
            ? html`<wa-spinner slot="start"></wa-spinner> Deleting...`
            : html`<wa-icon slot="start" name="trash"></wa-icon> Delete my account`}
        </wa-button>
      </wa-dialog>
    `;
  }
}
