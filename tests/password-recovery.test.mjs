import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recoveryRedirect} from '../lib/password-recovery.ts';
test('password recovery returns to the current production origin, without a fixed localhost URL',()=>{
  assert.equal(recoveryRedirect('https://shop.example.com'),'https://shop.example.com/auth/callback');
  assert.equal(recoveryRedirect('http://127.0.0.1:3220'),'http://127.0.0.1:3220/auth/callback');
  assert.equal(recoveryRedirect('http://localhost:3217'),'http://localhost:3217/auth/callback');
  assert.throws(()=>recoveryRedirect('javascript:alert(1)'));
  assert.throws(()=>recoveryRedirect('http://external.example.com'));
});
