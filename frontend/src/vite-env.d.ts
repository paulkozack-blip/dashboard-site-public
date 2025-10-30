/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // добавь другие переменные если нужно
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}