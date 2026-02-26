import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jongio.github.io/azd-extensions/',
  base: '/azd-extensions/',
  vite: {
    plugins: [tailwindcss()]
  },
  output: 'static'
});
