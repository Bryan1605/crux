/**
 * Rutas y nombres de las fuentes del diccionario.
 *
 * La caché vive en `src/assets/texts/.cache-lexico/` (ignorada por git); los
 * JSON derivados que se publican están en `public/textos/exegesis/lemas/` y
 * `public/textos/exegesis/lexico.json`.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CACHE = path.join(ROOT, 'src/assets/texts/.cache-lexico');
export const MORPH_DIR = path.join(CACHE, 'morphgnt');
export const TBESG_PATH = path.join(CACHE, 'tbesg.txt');
export const LEMAS_DIR = path.join(ROOT, 'public/textos/exegesis/lemas');
export const LEXICO_PATH = path.join(ROOT, 'public/textos/exegesis/lexico.json');
export const SOURCE_PATH = path.join(ROOT, 'content/lexico/griego.json');

/** Ficheros de MorphGNT → id de libro de la web. */
export const MORPHGNT_FILES = [
  ['61-Mt-morphgnt.txt', 'mateo'],
  ['62-Mk-morphgnt.txt', 'marcos'],
  ['63-Lk-morphgnt.txt', 'lucas'],
  ['64-Jn-morphgnt.txt', 'juan'],
  ['65-Ac-morphgnt.txt', 'hechos'],
  ['66-Ro-morphgnt.txt', 'romanos'],
  ['67-1Co-morphgnt.txt', '1-corintios'],
  ['68-2Co-morphgnt.txt', '2-corintios'],
  ['69-Ga-morphgnt.txt', 'galatas'],
  ['70-Eph-morphgnt.txt', 'efesios'],
  ['71-Php-morphgnt.txt', 'filipenses'],
  ['72-Col-morphgnt.txt', 'colosenses'],
  ['73-1Th-morphgnt.txt', '1-tesalonicenses'],
  ['74-2Th-morphgnt.txt', '2-tesalonicenses'],
  ['75-1Ti-morphgnt.txt', '1-timoteo'],
  ['76-2Ti-morphgnt.txt', '2-timoteo'],
  ['77-Tit-morphgnt.txt', 'tito'],
  ['78-Phm-morphgnt.txt', 'filemon'],
  ['79-Heb-morphgnt.txt', 'hebreos'],
  ['80-Jas-morphgnt.txt', 'santiago'],
  ['81-1Pe-morphgnt.txt', '1-pedro'],
  ['82-2Pe-morphgnt.txt', '2-pedro'],
  ['83-1Jn-morphgnt.txt', '1-juan'],
  ['84-2Jn-morphgnt.txt', '2-juan'],
  ['85-3Jn-morphgnt.txt', '3-juan'],
  ['86-Jud-morphgnt.txt', 'judas'],
  ['87-Re-morphgnt.txt', 'apocalipsis']
];

/** Libro de la web → fichero de MorphGNT. */
export const MORPH_BY_BOOK = new Map(MORPHGNT_FILES.map(([file, book]) => [book, file]));
