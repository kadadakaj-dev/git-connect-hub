import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      resizeOptions: { background: '#EAF6FF' },
    },
    apple: {
      sizes: [180],
      resizeOptions: { background: '#EAF6FF' },
    },
  },
  images: ['public/pwa-512x512.png'],
});
