import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, existsSync, readdirSync, copyFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Contract:
 * - Builds the Rust crate in `native/` for `wasm32-unknown-unknown`.
 * - Runs `wasm-bindgen` to generate JS + TS (.d.ts) bindings.
 * - Copies artifacts into `src/wasm/native/` for TypeScript-side imports later.
 */

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const nativeDir = path.join(repoRoot, 'native')

const args = new Set(process.argv.slice(2))
const isRelease = args.has('--release')
const profile = isRelease ? 'release' : 'debug'

const outDir = path.join(repoRoot, 'src', 'wasm', 'native')
const stagingDir = path.join(repoRoot, 'native', 'target', 'wasm-bindgen-staging')
const outGitignorePath = path.join(outDir, '.gitignore')

function run(cmd, cmdArgs, opts = {}) {
  const pretty = [cmd, ...cmdArgs].join(' ')
  const res = spawnSync(cmd, cmdArgs, {
    stdio: 'inherit',
    cwd: opts.cwd ?? repoRoot,
    env: { ...process.env, ...(opts.env ?? {}) },
  })
  if (res.status !== 0) {
    throw new Error(`Command failed (${res.status}): ${pretty}`)
  }
}

function ensureTool(name, hint) {
  const res = spawnSync('zsh', ['-lc', `command -v ${name}`], { stdio: 'pipe' })
  if (res.status !== 0) {
    const msg = hint ? `\n${hint}` : ''
    throw new Error(`Missing required tool: ${name}.${msg}`)
  }
}

function pickWasmArtifact() {
  const depsDir = path.join(nativeDir, 'target', 'wasm32-unknown-unknown', profile, 'deps')
  if (!existsSync(depsDir)) {
    throw new Error(`Expected wasm deps dir not found: ${depsDir}`)
  }

  const wasmFiles = readdirSync(depsDir).filter((f) => f.endsWith('.wasm'))
  const candidates = wasmFiles
    .filter((f) => f.startsWith('native'))
    .map((f) => path.join(depsDir, f))

  if (candidates.length === 0) {
    throw new Error(`No wasm artifact found in ${depsDir}. Found: ${wasmFiles.join(', ')}`)
  }

  if (candidates.length > 1) {
    // Prefer the non-metadata rlib-ish output (usually largest); stable enough for our simple crate.
    // Fallback to first.
    candidates.sort((a, b) => {
      const sa = (spawnSync('zsh', ['-lc', `stat -f %z ${JSON.stringify(a)}`], { stdio: 'pipe' }).stdout || Buffer.from('0')).toString().trim()
      const sb = (spawnSync('zsh', ['-lc', `stat -f %z ${JSON.stringify(b)}`], { stdio: 'pipe' }).stdout || Buffer.from('0')).toString().trim()
      return Number(sb) - Number(sa)
    })
  }

  return candidates[0]
}

// --- Preflight ---
ensureTool('cargo', 'Install Rust from https://rustup.rs')
ensureTool(
  'wasm-bindgen',
  'Install with: cargo install wasm-bindgen-cli\n(then ensure ~/.cargo/bin is on PATH)'
)

// Ensure the target is installed (no-op if already present)
run('rustup', ['target', 'add', 'wasm32-unknown-unknown'])

// Clean staging/out dirs so the frontend always gets a coherent set of files
rmSync(stagingDir, { recursive: true, force: true })
rmSync(outDir, { recursive: true, force: true })
mkdirSync(stagingDir, { recursive: true })
mkdirSync(outDir, { recursive: true })

// Prevent generated binaries from being committed.
// Keep this file tracked so the folder exists even when empty.
writeFileSync(
  outGitignorePath,
  ['*', '!.gitignore', ''].join('\n'),
  'utf8'
)

// --- Build wasm ---
const cargoArgs = ['build', '--target', 'wasm32-unknown-unknown']
if (isRelease) cargoArgs.push('--release')
run('cargo', cargoArgs, { cwd: nativeDir })

const wasmPath = pickWasmArtifact()

// --- Generate bindings ---
// `bundler` is the most convenient target for Vite/ESM imports.
run('wasm-bindgen', [
  wasmPath,
  '--out-dir',
  stagingDir,
  '--target',
  'bundler',
  '--typescript',
])

// --- Copy into frontend src ---
for (const file of readdirSync(stagingDir)) {
  const src = path.join(stagingDir, file)
  const dest = path.join(outDir, file)
  copyFileSync(src, dest)
}

// Re-write .gitignore in case any tooling writes over the output folder.
writeFileSync(
  outGitignorePath,
  ['*', '!.gitignore', ''].join('\n'),
  'utf8'
)

console.log(`\nWASM bindings generated in: ${outDir}`)
console.log(`Profile: ${profile}`)
