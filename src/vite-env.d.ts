/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

// Extend ImportMeta with Vite env types
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
