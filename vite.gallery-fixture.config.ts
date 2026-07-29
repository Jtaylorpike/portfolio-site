import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, normalizePath } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoomPath = normalizePath(path.join(
  projectRoot,
  'tests',
  'fixtures',
  'gallery-room-multi-module.json'
));

export default defineConfig({
  base: '/',
  plugins: [{
    name: 'gallery-room-fixture',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source === './galleryRoom.json'
        && normalizePath(importer ?? '').endsWith('/src/data/galleryRoom.ts')
      ) {
        return fixtureRoomPath;
      }

      return null;
    }
  }],
  build: {
    outDir: 'dist-gallery-fixture',
    emptyOutDir: true,
    chunkSizeWarningLimit: 750
  }
});
