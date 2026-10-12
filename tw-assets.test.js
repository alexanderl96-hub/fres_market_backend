// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Structure checks for CSS, JSON, HTML and WebAssembly files, written by TestWeaver.
const root = fileURLToPath(new URL('.', import.meta.url));
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const count = (s, c) => s.split(c).length - 1;

// tw:generated asset package.json
describe("package.json", () => {
  it('is valid JSON', () => {
    expect(() => JSON.parse(read("package.json"))).not.toThrow();
  });
});
