import test from 'node:test';
import assert from 'node:assert/strict';
import { request, onUnauthorized, triggerUnauthorized, ApiError } from './request';

test('Request layer provides standard HTTP methods', () => {
  assert.equal(typeof request.get, 'function');
  assert.equal(typeof request.post, 'function');
  assert.equal(typeof request.put, 'function');
  assert.equal(typeof request.delete, 'function');
  assert.equal(typeof request.patch, 'function');
});

test('BaseURL can be inspected and updated via Axios defaults', () => {
  const original = request.getBaseURL();
  assert.ok(original.length > 0);
  request.setBaseURL('/custom-api');
  assert.equal(request.getBaseURL(), '/custom-api');
  request.setBaseURL(original);
});

test('Axios instance and interceptors are accessible', () => {
  assert.ok(request.axiosInstance);
  assert.ok(request.interceptors);
  assert.equal(typeof request.interceptors.request.use, 'function');
  assert.equal(typeof request.interceptors.response.use, 'function');
});

test('401 Unauthorized listener fires correctly on trigger', () => {
  let receivedReason = '';
  const unsubscribe = onUnauthorized((reason) => {
    receivedReason = reason;
  });

  triggerUnauthorized('测试会话失效');
  assert.equal(receivedReason, '测试会话失效');

  unsubscribe();
  receivedReason = '';
  triggerUnauthorized('已退订不应接收');
  assert.equal(receivedReason, '');
});

test('ApiError holds status, code and custom details', () => {
  const err = new ApiError('凭证错误', 401, 'UNAUTHORIZED', { detail: 'token expired' });
  assert.equal(err.name, 'ApiError');
  assert.equal(err.status, 401);
  assert.equal(err.code, 'UNAUTHORIZED');
  assert.equal(err.details?.detail, 'token expired');
});
