import { LitElement, html, nothing } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { LogLevel, LogSort } from "../models/server-interfaces";
import type { Log, PagedList, StructuredLog } from "../models/server-interfaces";
import { logApi } from "../services/log-service";
import "../components/admin-sidebar.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/option/option.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";

type LogCategory = "Message" | "Exception" | "Occurrences";

interface FilterOption {
  title: string;
  value: LogLevel | null;
}

interface SortOption {
  title: string;
  value: LogSort;
}

@customElement("admin-log-editor-page")
export class AdminLogEditorPage extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false }) params: Record<string, string> = {};
  @state() private logs: StructuredLog[] = [];
  @state() private logsTotal = 0;
  @state() private isLoading = false;
  @state() private saving = false;
  @state() private errorMessage = "";
  @state() private selectedFilter: FilterOption;
  @state() private selectedSort: SortOption;
  @state() private expandedIds = new Set<string>();
  @state() private activeCategories = new Map<string, LogCategory>();
  @state() private activeOccurrenceIndexes = new Map<string, number>();

  private readonly take = 20;
  private readonly relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  private readonly fullDateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  private readonly filterOptions: FilterOption[] = [
    { title: "All", value: null },
    { title: "Critical", value: LogLevel.Critical },
    { title: "Error", value: LogLevel.Error },
    { title: "Warning", value: LogLevel.Warning },
    { title: "Info", value: LogLevel.Information },
    { title: "Debug", value: LogLevel.Debug },
    { title: "Trace", value: LogLevel.Trace },
  ];
  private readonly sortOptions: SortOption[] = [
    { title: "Newest", value: LogSort.Newest },
    { title: "Oldest", value: LogSort.Oldest },
    { title: "Total occurrences", value: LogSort.OccurrenceCount },
  ];

  constructor() {
    super();
    this.selectedFilter = this.filterOptions[0];
    this.selectedSort = this.sortOptions[0];
  }

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadMore();
  }

  private async loadMore(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    try {
      const page = await logApi.getAll(this.logs.length, this.take, this.selectedFilter.value, this.selectedSort.value);
      this.appendLogs(page);
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private appendLogs(page: PagedList<StructuredLog>): void {
    this.logs = [...this.logs, ...page.items];
    this.logsTotal = page.total;
  }

  private async resetAndFetch(): Promise<void> {
    this.logs = [];
    this.logsTotal = 0;
    this.expandedIds = new Set<string>();
    this.activeCategories = new Map<string, LogCategory>();
    this.activeOccurrenceIndexes = new Map<string, number>();
    await this.loadMore();
  }

  private selectFilter(value: string): void {
    const normalized = value === "" ? null : (Number(value) as LogLevel);
    const filter = this.filterOptions.find((f) => f.value === normalized);
    if (filter && filter !== this.selectedFilter) {
      this.selectedFilter = filter;
      void this.resetAndFetch();
    }
  }

  private selectSort(value: string): void {
    const sort = this.sortOptions.find((s) => s.value === Number(value));
    if (sort && sort !== this.selectedSort) {
      this.selectedSort = sort;
      void this.resetAndFetch();
    }
  }

  private expand(log: StructuredLog): void {
    this.expandedIds = new Set(this.expandedIds).add(log.id);
    if (!this.activeCategories.has(log.id)) {
      const next = new Map(this.activeCategories);
      next.set(log.id, "Message");
      this.activeCategories = next;
    }
  }

  private setCategory(log: StructuredLog, category: LogCategory): void {
    const next = new Map(this.activeCategories);
    next.set(log.id, category);
    this.activeCategories = next;
  }

  private setOccurrenceIndex(log: StructuredLog, index: number): void {
    const next = new Map(this.activeOccurrenceIndexes);
    next.set(log.id, index);
    this.activeOccurrenceIndexes = next;
  }

  private async deleteLog(log: StructuredLog): Promise<void> {
    if (this.saving || !confirm("Delete this log?")) {
      return;
    }

    this.saving = true;
    try {
      await logApi.deleteLog(log.id);
      await this.resetAndFetch();
    } catch (error) {
      this.errorMessage = this.formatError(error);
    } finally {
      this.saving = false;
    }
  }

  private getTimeAgo(dateIso: string): string {
    const date = new Date(dateIso);
    const diffMs = date.getTime() - Date.now();
    const absSeconds = Math.abs(diffMs) / 1000;
    const absMinutes = absSeconds / 60;
    const absHours = absMinutes / 60;
    const absDays = absHours / 24;

    if (absDays >= 1) {
      const days = Math.round(diffMs / 86400000);
      return `${this.relativeFormatter.format(days, "day")} (${this.getFriendlyDate(dateIso)})`;
    }
    if (absHours >= 1) {
      return this.relativeFormatter.format(Math.round(diffMs / 3600000), "hour");
    }
    if (absMinutes >= 1) {
      return this.relativeFormatter.format(Math.round(diffMs / 60000), "minute");
    }
    return "less than a minute ago";
  }

  private getFriendlyDate(dateIso: string): string {
    return this.fullDateFormatter.format(new Date(dateIso));
  }

  private getActiveOccurrenceText(log: StructuredLog): string {
    const active = log.occurrences[this.activeOccurrenceIndexes.get(log.id) ?? 0];
    return active ? JSON.stringify(active, null, 4) : "";
  }

  private getIconName(level: LogLevel | null): string {
    switch (level) {
      case LogLevel.Critical:
      case LogLevel.Error:
        return "circle-exclamation";
      case LogLevel.Warning:
        return "triangle-exclamation";
      case LogLevel.Information:
      case LogLevel.Debug:
      case LogLevel.Trace:
        return "circle-info";
      default:
        return "circle-info";
    }
  }

  private getLogClass(log: StructuredLog): string {
    switch (log.level) {
      case LogLevel.Critical:
        return "left-border border-danger text-danger";
      case LogLevel.Error:
        return "left-border border-danger";
      case LogLevel.Warning:
        return "left-border border-warning";
      case LogLevel.Information:
        return "left-border border-info";
      default:
        return "";
    }
  }

  private getLevelDescription(level: LogLevel): string {
    return this.filterOptions.find((o) => o.value === level)?.title ?? "";
  }

  private getException(log: StructuredLog): string {
    return log.occurrences.find((o: Log) => !!o.exception)?.exception ?? "";
  }

  private getLogDetails(log: StructuredLog): string {
    const category = this.activeCategories.get(log.id) ?? "Message";
    if (category === "Message") {
      return log.messageTemplate;
    }
    if (category === "Exception") {
      return this.getException(log);
    }
    return this.getActiveOccurrenceText(log);
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : JSON.stringify(error);
  }

  private renderLog(log: StructuredLog) {
    const isExpanded = this.expandedIds.has(log.id);
    const activeCategory = this.activeCategories.get(log.id) ?? "Message";
    return html`
      <div class=${`log list-group-item rounded-left ${this.getLogClass(log)}`} @click=${() => this.expand(log)}>
        <p class="title">${log.messageTemplate}</p>
        <p>
          <small>
            <span class="text-muted">Level</span>:
            <wa-icon name=${this.getIconName(log.level)}></wa-icon> ${this.getLevelDescription(log.level)}
            <br />
            <span class="text-muted">Occurrences:</span> ${log.occurrenceCount}
            <br />
            <span class="text-muted">Newest:</span> ${this.getTimeAgo(log.lastOccurrence)}
            <br />
            <span class="text-muted">Oldest:</span> ${this.getTimeAgo(log.firstOccurrence)}
          </small>
        </p>
        ${isExpanded
          ? html`
              <div @click=${(e: Event) => e.stopPropagation()}>
                <div class="btn-group" role="group" aria-label="Log details tabs">
                  ${(["Message", "Exception", "Occurrences"] as LogCategory[]).map(
                    (category) => html`
                      <wa-button size="small" variant=${activeCategory === category ? "brand" : "neutral"} @click=${() => this.setCategory(log, category)}>${category}</wa-button>
                    `,
                  )}
                </div>
                <wa-textarea readonly rows="10" style="width: 100%;" .value=${this.getLogDetails(log)}></wa-textarea>
                ${activeCategory === "Occurrences"
                  ? html`<div class="btn-group" role="group" aria-label="Log occurrences">
                      ${log.occurrences.map(
                        (_occurrence, index) => html`
                          <wa-button size="small" variant=${(this.activeOccurrenceIndexes.get(log.id) ?? 0) === index ? "brand" : "neutral"} @click=${() => this.setOccurrenceIndex(log, index)}>${index + 1}</wa-button>
                        `,
                      )}
                    </div>`
                  : nothing}
                <br />
                <wa-button variant="danger" ?disabled=${this.saving} @click=${() => this.deleteLog(log)}>
                  <wa-icon slot="start" name="trash"></wa-icon>Delete
                </wa-button>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  render() {
    const hasMoreItems = this.logs.length < this.logsTotal;
    return html`
      <section class="log-editor-page admin-page">
        <div class="admin-layout">
          <admin-sidebar active="logs"></admin-sidebar>
          <div>
            <br />
            <div class="btn-toolbar" role="toolbar" aria-label="Log filters">
              <wa-select label="Filter" .value=${this.selectedFilter.value === null ? "" : String(this.selectedFilter.value)} @change=${(e: Event) => this.selectFilter((e.target as HTMLInputElement).value)}>
                ${this.filterOptions.map((filter) => html`<wa-option value=${filter.value === null ? "" : String(filter.value)}><wa-icon name=${this.getIconName(filter.value)}></wa-icon> ${filter.title}</wa-option>`)}
              </wa-select>
              <wa-select label="Sort" .value=${String(this.selectedSort.value)} @change=${(e: Event) => this.selectSort((e.target as HTMLInputElement).value)}>
                ${this.sortOptions.map((sort) => html`<wa-option value=${String(sort.value)}>${sort.title}</wa-option>`)}
              </wa-select>
            </div>
            <br />
            ${this.errorMessage
              ? html`<wa-callout variant="danger"><wa-icon slot="icon" name="circle-exclamation"></wa-icon>${this.errorMessage}</wa-callout>`
              : nothing}
            <div class="list-group">${this.logs.map((log) => this.renderLog(log))}</div>
            ${this.isLoading ? html`<p class="text-center"><wa-spinner></wa-spinner> Loading logs...</p>` : nothing}
            ${this.logs.length
              ? html`<p class="text-muted text-center">
                  Showing ${this.logs.length} of ${this.logsTotal}
                  ${hasMoreItems ? html`<wa-button ?disabled=${this.isLoading} @click=${() => this.loadMore()}>Load more</wa-button>` : nothing}
                </p>`
              : nothing}
          </div>
        </div>
      </section>
    `;
  }
}
