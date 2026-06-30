import type { ReactNode } from "react"

const IOC_BASE = "font-mono text-[0.92em] font-semibold px-1 py-px rounded-[0.28em] border"
const NOWRAP = "whitespace-nowrap"
const BREAK = "break-all"

const STYLE = {
  danger: "text-red-700 bg-red-50 border-red-200",
  file: "text-amber-700 bg-amber-50 border-amber-200",
  hash: "text-slate-700 bg-slate-100 border-slate-200",
  proc: "text-blue-700 bg-blue-50 border-blue-200",
}

const PATTERNS: { re: RegExp; cls: string }[] = [
  { re: /https?:\/\/[^\s，。、）)]+/g, cls: `${IOC_BASE} ${BREAK} ${STYLE.danger}` },
  { re: /\b[a-f0-9]{32}\b/gi, cls: `${IOC_BASE} ${BREAK} ${STYLE.hash}` },
  { re: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?\b/g, cls: `${IOC_BASE} ${NOWRAP} ${STYLE.danger}` },
  { re: /\b[\w.\-\[\]]+\.(?:dll|exe|mso|sys|bat|ps1|vbs)\b/gi, cls: `${IOC_BASE} ${NOWRAP} ${STYLE.file}` },
  { re: /\bPID\s*\d+\b/gi, cls: `${IOC_BASE} ${NOWRAP} ${STYLE.proc}` },
]

interface Segment {
  start: number
  end: number
  cls: string
}

export function HighlightIOC({
  text,
  keywords = [],
  className,
}: {
  text: string
  keywords?: string[]
  className?: string
}) {
  const segments: Segment[] = []

  for (const keyword of keywords) {
    if (!keyword) continue

    let index = text.indexOf(keyword)
    while (index !== -1) {
      segments.push({
        start: index,
        end: index + keyword.length,
        cls: "font-semibold text-red-700 bg-red-50 border border-red-200 px-1 py-px rounded-[0.28em]",
      })
      index = text.indexOf(keyword, index + keyword.length)
    }
  }

  for (const { re, cls } of PATTERNS) {
    re.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = re.exec(text)) !== null) {
      segments.push({
        start: match.index,
        end: match.index + match[0].length,
        cls,
      })
    }
  }

  if (!segments.length) {
    return <span className={className}>{text}</span>
  }

  segments.sort((a, b) => a.start - b.start || b.end - a.end)

  const merged: Segment[] = []
  let cursor = 0
  for (const segment of segments) {
    if (segment.start < cursor) continue
    merged.push(segment)
    cursor = segment.end
  }

  const output: ReactNode[] = []
  let position = 0
  merged.forEach((segment, index) => {
    if (segment.start > position) {
      output.push(text.slice(position, segment.start))
    }

    output.push(
      <span key={index} className={segment.cls}>
        {text.slice(segment.start, segment.end)}
      </span>,
    )
    position = segment.end
  })

  if (position < text.length) {
    output.push(text.slice(position))
  }

  return <span className={className}>{output}</span>
}
