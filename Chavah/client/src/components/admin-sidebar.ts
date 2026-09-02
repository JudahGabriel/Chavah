import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

interface AdminNavItem {
  key: string;
  label: string;
  href: string;
}

const adminNavItems: AdminNavItem[] = [
  { key: "songs", label: "Songs", href: "/admin" },
  { key: "albums", label: "Albums", href: "/admin/albums" },
  { key: "donations", label: "Donations", href: "/admin/donations" },
  { key: "users", label: "Users", href: "/admin/users" },
  { key: "songedits", label: "Pending song edits", href: "/admin/songedits" },
  { key: "album-submissions", label: "Pending album submissions", href: "/admin/albums/submissions" },
  { key: "tags", label: "Tags", href: "/admin/tags" },
  { key: "logs", label: "Logs", href: "/admin/logs" },
  { key: "ioslogs", label: "iOS Logs", href: "/admin/ioslogs" },
];

/**
 * Shared admin navigation sidebar. Ported from the AngularJS `AdminSidebar`
 * partial. Set `active` to the current admin page key to highlight it.
 */
@customElement("admin-sidebar")
export class AdminSidebar extends LitElement {
  @property({ type: String }) active = "";

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <nav class="admin-sidebar">
        <ul class="admin-sidebar-nav">
          ${adminNavItems.map(
            (item) => html`
              <li class=${item.key === this.active ? "active" : ""}>
                <a href=${item.href}>${item.label}</a>
              </li>
            `,
          )}
        </ul>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "admin-sidebar": AdminSidebar;
  }
}
