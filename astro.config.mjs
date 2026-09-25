import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://zhouz.dev',
  output: 'static',
  build: {
    format: 'directory',
  },
  trailingSlash: 'always',
  vite: {
    ssr: {
      external: [],
    },
  },
});
