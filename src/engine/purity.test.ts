// Backstop for the architecture's iron rule: the simulation core
// (src/engine, src/gen, src/data) must never import UI, state, storage or
// DOM code. oxlint enforces this too; this test makes it unmissable.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const PURE_DIRS = ['src/engine', 'src/gen', 'src/data']
const FORBIDDEN = [
  /from\s+['"]react/,
  /from\s+['"]zustand/,
  /from\s+['"]idb-keyval/,
  /from\s+['"][^'"]*\/(ui|state|save|scenes)\//,
  /\bdocument\./,
  /\bwindow\./,
  /\blocalStorage\b/,
]

function tsFilesUnder(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...tsFilesUnder(full))
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(full)
  }
  return out
}

describe('engine purity', () => {
  it('sim core has no UI/state/storage/DOM imports', () => {
    const violations: string[] = []
    for (const dir of PURE_DIRS) {
      for (const file of tsFilesUnder(dir)) {
        const source = readFileSync(file, 'utf8')
        for (const pattern of FORBIDDEN) {
          if (pattern.test(source)) violations.push(`${file}: matches ${pattern}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
