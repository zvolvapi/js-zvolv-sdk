import 'mocha';
import { assert, expect } from 'chai';

import { ZvolvClient } from '../src/index';
import AuthModule from '../src/modules/auth';

describe('ZvolvClient', () => {
  it('should initialize AuthModule correctly', () => {
    const client = new ZvolvClient('https://api.zvolv.com', 'myDomain');

    expect(client.auth).to.be.instanceOf(AuthModule);
    // You can add more checks here to ensure the httpClient is set up correctly
  });

  // Add more tests here as needed
});

// describe('NPM Package', () => {
//   it('should be an object', () => {
//     assert.isObject(ZvolvClient);
//   });

//   it('should have a helloWorld property', () => {
//     assert.property(ZvolvClient, 'helloWorld');
//   });
// });

// describe('Hello World Function', () => {
//   it('should be a function', () => {
//     assert.isFunction(helloWorld);
//   });

//   it('should return the hello world message', () => {
//     const expected = 'Hello World from my example modern npm package!';
//     const actual = helloWorld();
//     assert.equal(actual, expected);
//   });
// });