const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..', '..');

test('repository keeps numbered content and system entry points', () => {
  const authoredDirectories = fs.readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !['.git', 'node_modules'].includes(entry.name))
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(authoredDirectories, ['00-library', '01-notes', '98-docs', '99-system']);

  for (const legacyDirectory of ['data', 'docs', 'public', 'src', 'tests', 'skills']) {
    assert.equal(fs.existsSync(path.join(projectRoot, legacyDirectory)), false);
  }

  assert.equal(fs.existsSync(path.join(projectRoot, '99-system', 'server.js')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '99-system', 'README.md')), true);
});
