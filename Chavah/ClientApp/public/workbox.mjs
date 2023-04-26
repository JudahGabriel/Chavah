import pkg from 'workbox-build';
const { injectManifest } = pkg;

injectManifest({
  globDirectory: 'dist',
  globPatterns: [
    '**/*.{html,js,css,png,webp,jpg}',
  ],
  swSrc: './service-worker.js',
  swDest: 'dist/service-worker.js',
});