import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { ordinal } from "@/lib/navigation"
import { cn } from "@/lib/utils"

/* ==========================================================================
   RECORD VIEW
   Shared primitives for the list pages. A record view is a ledger: full-bleed
   hairline rules, mono column heads, tabular figures, and a numbered register
   down the left edge. No cards, no shadows, no fills.
   ========================================================================== */

const GUTTER = "px-6 sm:px-8 lg:px-12"

/** Full-bleed masthead band for a record view. */
export function RecordHeader({
  eyebrow,
  title,
  subtitle,
  count,
  countLabel,
  action,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  count?: number
  countLabel: string
  action?: ReactNode
}) {
  return (
    <header className={cn("border-b border-rule pb-8 pt-10 lg:pb-10 lg:pt-14", GUTTER)}>
      <div className="anim-rise flex items-center gap-5">
        <span className="micro micro-signal shrink-0">{eyebrow}</span>
        <span className="anim-rule lag-1 h-px flex-1 bg-rule" />
        <span className="index-numeral shrink-0 text-[0.6875rem] text-muted-foreground">
          {count === undefined ? "––" : count} {countLabel}
        </span>
      </div>

      <div className="anim-rise lag-1 mt-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="display text-[clamp(2.25rem,5vw,3.25rem)]">{title}</h1>
          {subtitle && (
            <p className="mt-4 max-w-lg text-[0.875rem] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  )
}

/** Horizontal scroll frame — wide ledgers scroll rather than squeeze. */
export function RecordTable({
  columns,
  children,
  className,
  sticky = true,
}: {
  /** Column heads, in order. `null` renders an unlabelled cell (e.g. actions). */
  columns: { label: string | null; className?: string }[]
  children: ReactNode
  className?: string
  /** Grouped ledgers stack several tables, so only ungrouped heads stick. */
  sticky?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full min-w-[52rem] table-fixed border-collapse", className)}>
        <thead>
          <tr
            className={cn(
              "border-b border-foreground bg-background",
              sticky && "lg:sticky lg:top-14"
            )}
          >
            {/* Register column — the row ordinals live here */}
            <th
              scope="col"
              className={cn("w-14 py-3.5 pl-6 pr-2 text-left sm:pl-8 lg:pl-12", "micro")}
            >
              <span className="sr-only">Row</span>
            </th>
            {columns.map((column, i) => (
              <th
                key={column.label ?? `col-${i}`}
                scope="col"
                className={cn(
                  "micro micro-ink py-3.5 pr-6 text-left align-bottom last:pr-6 sm:last:pr-8 lg:last:pr-12",
                  column.className
                )}
              >
                {column.label ?? <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** One ledger row, marked with its ordinal and a signal bar on hover. */
export function RecordRow({
  index,
  children,
  isPending,
}: {
  index: number
  children: ReactNode
  isPending?: boolean
}) {
  return (
    <tr
      className={cn(
        "group border-b border-rule transition-colors duration-100 hover:bg-signal-tint",
        isPending && "pointer-events-none opacity-35"
      )}
    >
      <td className="relative w-14 py-4 pl-6 pr-2 align-middle sm:pl-8 lg:pl-12">
        {/* Flush-left signal bar, drawn only on hover */}
        <span
          className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-signal transition-transform duration-150 group-hover:scale-y-100"
          aria-hidden="true"
        />
        <span className="index-numeral text-[0.625rem] text-muted-foreground transition-colors duration-100 group-hover:text-signal">
          {ordinal(index + 1)}
        </span>
      </td>
      {children}
    </tr>
  )
}

/** A ledger cell. `tone` sets the typographic role. */
export function Cell({
  children,
  tone = "secondary",
  title,
  className,
}: {
  children: ReactNode
  tone?: "primary" | "secondary" | "code" | "numeral"
  title?: string
  className?: string
}) {
  return (
    <td
      title={title}
      className={cn(
        "truncate py-4 pr-6 align-middle last:pr-6 sm:last:pr-8 lg:last:pr-12",
        tone === "primary" && "text-[0.9375rem] font-semibold tracking-[-0.02em] text-foreground",
        tone === "secondary" && "text-[0.875rem] text-muted-foreground",
        tone === "code" && "font-mono text-[0.75rem] tracking-[-0.01em] text-muted-foreground",
        tone === "numeral" && "index-numeral text-[0.8125rem] text-foreground",
        className
      )}
    >
      {children}
    </td>
  )
}

/**
 * Row actions as mono micro-labels. Edit is either a route (`editTo`) or an
 * in-page handler (`onEdit`) — pages that edit through an inline panel use the
 * latter.
 */
export function RecordActions({
  editTo,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  deleteLabel = "Delete",
}: {
  editTo?: string
  onEdit?: () => void
  onDelete: () => void
  canEdit?: boolean
  canDelete?: boolean
  deleteLabel?: string
}) {
  const editClass =
    "micro transition-colors duration-100 hover:text-signal focus-visible:text-signal"

  return (
    <td className="py-4 pr-6 text-right align-middle sm:pr-8 lg:pr-12">
      <span className="inline-flex items-center gap-4">
        {canEdit && editTo && (
          <Link to={editTo} className={editClass}>
            Edit
          </Link>
        )}
        {canEdit && !editTo && onEdit && (
          <button type="button" onClick={onEdit} className={editClass}>
            Edit
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="micro transition-colors duration-100 hover:text-destructive focus-visible:text-destructive"
          >
            {deleteLabel}
          </button>
        )}
      </span>
    </td>
  )
}

/** A band of counters, divided by hairlines. Values are always real. */
export function CounterBand({
  children,
  cols = 3,
}: {
  children: ReactNode
  cols?: 2 | 3 | 4
}) {
  return (
    <section
      className={cn(
        "stagger grid grid-cols-1 border-b border-rule",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-3",
        cols === 4 && "grid-cols-2 sm:grid-cols-4"
      )}
    >
      {children}
    </section>
  )
}

export function Counter({
  label,
  value,
  text,
  isLoading,
  isError,
  tone = "ink",
  note,
  className,
}: {
  label: string
  /** A count — zero-padded to two digits. */
  value?: number
  /** A pre-formatted figure printed verbatim (e.g. "94%", "B"). Wins over `value`. */
  text?: string
  isLoading?: boolean
  isError?: boolean
  tone?: "ink" | "signal" | "alert"
  /** Optional micro caption printed beneath the figure. */
  note?: string
  className?: string
}) {
  const figure = text ?? String(value ?? 0).padStart(2, "0")
  const display = isError ? "––" : isLoading ? "··" : figure

  return (
    <div className={cn("px-6 py-8 sm:px-8 lg:px-12", className)}>
      <span className="micro">{label}</span>
      <div
        className={cn(
          "stat-numeral mt-5 text-[clamp(2.25rem,5vw,3.5rem)]",
          isLoading || isError
            ? "text-muted-foreground"
            : tone === "signal"
              ? "text-signal"
              : tone === "alert"
                ? "text-destructive"
                : "text-foreground"
        )}
      >
        {display}
      </div>
      {note && !isLoading && !isError && <span className="micro mt-3 block">{note}</span>}
    </div>
  )
}

/**
 * A score as a ruled meter: hairline track, solid fill, tabular percentage.
 * Reads at a glance down a column without resorting to a colour code.
 */
export function ScoreBar({ percentage }: { percentage: number }) {
  const clamped = Math.max(0, Math.min(100, percentage))

  return (
    <span className="flex items-center gap-3">
      <span className="index-numeral w-9 shrink-0 text-[0.8125rem] text-foreground">
        {clamped}%
      </span>
      <span
        className="relative h-[3px] min-w-10 flex-1 bg-rule"
        role="img"
        aria-label={`${clamped} percent`}
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0",
            clamped >= 80 ? "bg-foreground" : clamped >= 60 ? "bg-signal" : "bg-destructive"
          )}
          style={{ width: `${clamped}%` }}
        />
      </span>
    </span>
  )
}

/** Section head for a grouped ledger (e.g. one class's roster). */
export function RecordGroup({
  title,
  meta,
  children,
}: {
  title: string
  meta: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-rule last:border-b-0">
      <div
        className={cn(
          "flex flex-wrap items-baseline justify-between gap-3 border-b border-rule bg-muted/40 py-4",
          GUTTER
        )}
      >
        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.025em]">{title}</h2>
        <span className="index-numeral text-[0.6875rem] text-muted-foreground">{meta}</span>
      </div>
      {children}
    </section>
  )
}

/** Loading — a rule that sweeps while records are fetched. */
export function RecordLoading({ label }: { label: string }) {
  return (
    <div className={cn("py-16", GUTTER)}>
      <span className="micro">{label}</span>
      <div className="relative mt-5 h-px w-full overflow-hidden bg-rule">
        <span className="anim-sweep absolute inset-y-0 left-0 w-1/4 bg-signal" />
      </div>
    </div>
  )
}

/** Error — a ruled block marked with the destructive bar. */
export function RecordError({ error }: { error: unknown }) {
  return (
    <div className={cn("py-8", GUTTER)}>
      <div role="alert" className="border-l-2 border-destructive bg-destructive/[0.06] px-4 py-3">
        <span className="micro text-destructive">Request failed</span>
        <p className="mt-2 text-[0.8125rem] leading-snug text-foreground">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
      </div>
    </div>
  )
}

/** Empty — the register exists, it simply holds nothing yet. */
export function RecordEmpty({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={cn("border-b border-rule py-20 text-center", GUTTER)}>
      <span className="micro">{label}</span>
      <p className="mx-auto mt-4 max-w-sm text-[0.875rem] leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

/** Inline link in the system idiom — signal, ruled underline. */
export function RecordLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-signal underline decoration-1 underline-offset-4 transition-colors duration-100 hover:text-foreground"
    >
      {children}
    </Link>
  )
}

/* ==========================================================================
   FORM & MARKER PRIMITIVES
   ========================================================================== */

/** Inline creation panel — a ruled band, not a floating card. */
export function RecordPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <section className={cn("anim-rise border-b border-rule bg-muted/40 py-8 lg:py-10", GUTTER)}>
      <div className="flex items-center gap-5">
        <span className="micro micro-signal shrink-0">{eyebrow}</span>
        <span className="h-px flex-1 bg-rule" />
      </div>
      <h2 className="mt-5 text-[1.25rem] font-semibold tracking-[-0.03em]">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  )
}

/** A numbered form field: mono ordinal, micro label, ruled control. */
export function Field({
  index,
  label,
  htmlFor,
  optional,
  hint,
  error,
  children,
  className,
}: {
  index: number
  label: string
  htmlFor: string
  /** Marked in the margin rather than with an asterisk on the label. */
  optional?: boolean
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("border-t border-rule py-4", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="flex items-baseline gap-4">
          <span className="index-numeral text-[0.6875rem] text-muted-foreground">
            {ordinal(index)}
          </span>
          <span className="micro micro-ink">{label}</span>
        </label>
        {optional && <span className="micro shrink-0">Optional</span>}
      </div>
      <div className="mt-2.5">{children}</div>
      {hint && !error && <p className="micro mt-3 leading-relaxed">{hint}</p>}
      {error && (
        <p className="micro mt-3 leading-relaxed text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Page shell for a single-record form: a constrained measure of numbered
 * fields, ruled top and bottom, with the actions on their own band.
 */
export function FormSheet({ children }: { children: ReactNode }) {
  return (
    <div className={cn("anim-rise lag-1 max-w-2xl py-10 lg:py-12", GUTTER)}>{children}</div>
  )
}

/**
 * Status marker. Square, hairline, mono — a stamp on a record, never a pill.
 * `signal` marks the notable state; `mute` is the ordinary one.
 */
export function Marker({
  children,
  tone = "mute",
}: {
  children: ReactNode
  tone?: "mute" | "signal" | "alert" | "ink"
}) {
  return (
    <span
      className={cn(
        "micro inline-flex items-center border px-2 py-1 leading-none",
        tone === "mute" && "border-rule text-muted-foreground",
        tone === "signal" && "border-signal/35 bg-signal-tint text-signal",
        tone === "alert" && "border-destructive/35 bg-destructive/[0.06] text-destructive",
        tone === "ink" && "border-foreground bg-foreground text-background"
      )}
    >
      {children}
    </span>
  )
}
