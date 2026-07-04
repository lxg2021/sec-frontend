"use client"

import { useMemo, type ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type DescriptionBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "note"; title: string; text?: string }

function isNoteHeading(text: string) {
  return /performance\s*note|note|warning|caution|性能说明|性能注意|注意事项|注意|提示/i.test(text)
}

function joinDescriptionLines(lines: string[]) {
  const normalized = lines.map((line) => line.trim()).filter(Boolean)
  return normalized.reduce((result, line) => {
    if (!result) {
      return line
    }
    const previousEndsWithCjk = /[\u3400-\u9fff]$/.test(result)
    const nextStartsWithCjk = /^[\u3400-\u9fff\u3001\u3002\uff0c\uff01\uff1f\uff1b\uff1a\uff09\u3011\u300b]/.test(line)
    return `${result}${previousEndsWithCjk && nextStartsWithCjk ? "" : " "}${line}`
  }, "")
}

function parseDescriptionHeading(line: string) {
  const trimmed = line.trim()
  const markdownHeading = trimmed.match(/^#{1,6}\s+(.+)$/)
  if (markdownHeading) {
    return markdownHeading[1].trim()
  }
  const boldHeading = trimmed.match(/^\*\*(.+?)\*\*$/)
  if (boldHeading) {
    return boldHeading[1].trim()
  }
  return ""
}

function parseArtifactDescription(text: string): DescriptionBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const blocks: DescriptionBlock[] = []
  let index = 0

  while (index < lines.length) {
    const trimmed = lines[index].trim()
    if (!trimmed) {
      index += 1
      continue
    }

    const heading = parseDescriptionHeading(trimmed)
    if (heading) {
      blocks.push({ type: "heading", text: heading })
      index += 1
      continue
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/)
    const orderedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (unorderedMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch)
      const items: string[] = []

      while (index < lines.length) {
        const itemLine = lines[index].trim()
        if (!itemLine) {
          index += 1
          break
        }

        const nextUnordered = itemLine.match(/^[-*]\s+(.+)$/)
        const nextOrdered = itemLine.match(/^\d+[.)]\s+(.+)$/)
        const nextHeading = parseDescriptionHeading(itemLine)
        const isDifferentListType = ordered ? Boolean(nextUnordered && !nextOrdered) : Boolean(nextOrdered && !nextUnordered)
        if (nextHeading || isDifferentListType) {
          break
        }

        if ((ordered && nextOrdered) || (!ordered && nextUnordered)) {
          const itemLines = [(nextOrdered || nextUnordered)?.[1] || ""]
          index += 1
          while (index < lines.length) {
            const continuation = lines[index].trim()
            if (!continuation) {
              break
            }
            if (continuation.match(/^[-*]\s+(.+)$/) || continuation.match(/^\d+[.)]\s+(.+)$/) || parseDescriptionHeading(continuation)) {
              break
            }
            itemLines.push(continuation)
            index += 1
          }
          items.push(joinDescriptionLines(itemLines))
          continue
        }
        break
      }

      blocks.push({ type: "list", ordered, items })
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length) {
      const paragraphLine = lines[index].trim()
      if (!paragraphLine || paragraphLine.match(/^[-*]\s+(.+)$/) || paragraphLine.match(/^\d+[.)]\s+(.+)$/) || parseDescriptionHeading(paragraphLine)) {
        break
      }
      paragraphLines.push(paragraphLine)
      index += 1
    }
    blocks.push({ type: "paragraph", text: joinDescriptionLines(paragraphLines) })
  }

  const merged: DescriptionBlock[] = []
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]
    const next = blocks[i + 1]
    if (block.type === "heading" && isNoteHeading(block.text) && next?.type === "paragraph") {
      merged.push({ type: "note", title: block.text, text: next.text })
      i += 1
      continue
    }
    merged.push(block)
  }
  return merged
}

function renderDescriptionInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-bold-${match.index}`} className="font-semibold text-slate-950 dark:text-slate-100">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      nodes.push(
        <code key={`${keyPrefix}-code-${match.index}`} className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          {token.slice(1, -1)}
        </code>,
      )
    }
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }
  return nodes
}

export function ArtifactDescriptionText({ text }: { text: string }) {
  const blocks = useMemo(() => parseArtifactDescription(text), [text])

  if (blocks.length === 0) {
    return null
  }

  return (
    <article className="max-w-[88ch] space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h4 key={`${block.type}-${index}`} className="pt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
              {renderDescriptionInline(block.text, `heading-${index}`)}
            </h4>
          )
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul"
          return (
            <ListTag key={`${block.type}-${index}`} className={cn("space-y-2.5", block.ordered ? "list-decimal pl-5" : "")}>
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${block.type}-${index}-${itemIndex}`}
                  className={cn(
                    "text-slate-700 dark:text-slate-300",
                    block.ordered ? "pl-1" : "grid grid-cols-[10px_minmax(0,1fr)] gap-3",
                  )}
                >
                  {!block.ordered && <span className="mt-[0.8em] size-1.5 rounded-full bg-blue-500" />}
                  <span>{renderDescriptionInline(item, `list-${index}-${itemIndex}`)}</span>
                </li>
              ))}
            </ListTag>
          )
        }

        if (block.type === "note") {
          return (
            <section key={`${block.type}-${index}`} className="rounded-lg bg-amber-50/90 px-4 py-3 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
              <p className="text-sm font-semibold">{renderDescriptionInline(block.title, `note-title-${index}`)}</p>
              {block.text && <p className="mt-2 leading-7">{renderDescriptionInline(block.text, `note-text-${index}`)}</p>}
            </section>
          )
        }

        return (
          <p key={`${block.type}-${index}`} className="text-slate-700 dark:text-slate-300">
            {renderDescriptionInline(block.text, `paragraph-${index}`)}
          </p>
        )
      })}
    </article>
  )
}
