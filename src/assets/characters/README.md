# Character standee images

One WebP per character, named by character id (see `src/data/characters.ts`). Generated from the
standee art in `assets/source/standees/` by `node assets/convert-standees.mjs`, which also holds the
file-name → id mapping. Images are bundled at build time, so rebuild after changing them.
Characters without an image show their initials.
