import test from 'node:test';
import assert from 'node:assert/strict';
import { login, loginApi } from './auth';

test('login API function is defined and callable', () => {
  assert.equal(typeof login, 'function');
  assert.equal(typeof loginApi, 'function');
  assert.equal(login, loginApi);
});
