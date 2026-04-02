import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: '#EAF6FF' },
    },
  },
  images: ['public/maskable-icon-512x512.png'],
});
