/** Proxy-origin regressions; no .env, DB, server, session or real credentials. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../lib/auth.ts', import.meta.url), 'utf8')
  .replace(/^import 'server-only';\s*$/m, '')
  .replace(/^import \{cookies\} from 'next\/headers';\s*$/m, '');
const {outputText} = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
});
const {safeOrigin, isSecureRequest} = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const request = headers => new Request('http://127.0.0.1:3000/api/admin/auth', {headers});
const proxy = {origin:'https://portfolio.example', 'x-forwarded-proto':'https, http', 'x-forwarded-host':'portfolio.example, internal:3000', 'sec-fetch-site':'same-origin'};
const previous = process.env.ALLOWED_ORIGINS;
try {
  process.env.ALLOWED_ORIGINS = '';
  assert.equal(safeOrigin(request(proxy)), true);
  assert.equal(isSecureRequest(request(proxy)), true);
  assert.equal(safeOrigin(request({origin:'http://127.0.0.1:3000'})), true);
  assert.equal(isSecureRequest(request({})), false);
  assert.equal(safeOrigin(request({...proxy,origin:'https://unrelated.example'})), false);
  assert.equal(safeOrigin(request({...proxy,origin:'http://portfolio.example'})), false);
  assert.equal(safeOrigin(request({...proxy,'sec-fetch-site':'cross-site'})), false);
  assert.equal(safeOrigin(request({...proxy,origin:'not a URL'})), false);
  assert.equal(safeOrigin(request({...proxy,origin:'https://portfolio.example/path'})), false);
  assert.equal(safeOrigin(request({...proxy,origin:'file://portfolio.example'})), false);
  assert.equal(safeOrigin(request({})), true);
  process.env.ALLOWED_ORIGINS = ' https://admin.example, https://another.example ';
  assert.equal(safeOrigin(request({...proxy,origin:'https://admin.example','sec-fetch-site':'cross-site'})), true);
  assert.equal(safeOrigin(request({...proxy,origin:'https://admin.example.evil'})), false);
} finally {
  if (previous === undefined) delete process.env.ALLOWED_ORIGINS;
  else process.env.ALLOWED_ORIGINS = previous;
}
console.log('Proxy origin and Secure-cookie protocol checks passed (13 cases; no DB/auth secrets).');
