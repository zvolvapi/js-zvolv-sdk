import 'mocha';
import { assert, expect } from 'chai';

import { ZvolvClient } from '../src/index';
import AuthModule from '../src/modules/auth';

describe('ZvolvClient', () => {
  it('should initialize AuthModule correctly', () => {
    const client = new ZvolvClient('https://api.zvolv.com');

    // expect(client.auth).to.be.instanceOf(AuthModule);
    // You can add more checks here to ensure the httpClient is set up correctly
  });

  it('builds the base URL from a host or a full origin', () => {
    expect(ZvolvClient.baseUrl('acme.zvolv.in')).to.equal('https://acme.zvolv.in');
    expect(ZvolvClient.baseUrl('acme.zvolv.in', false)).to.equal('http://acme.zvolv.in');
    expect(ZvolvClient.baseUrl('https://acme.zvolv.in/rest/')).to.equal('https://acme.zvolv.in');
    expect(new ZvolvClient('https://api.zvolv.com').baseURL).to.equal('https://api.zvolv.com');
  });

  it('builds a client from config.json', () => {
    expect(ZvolvClient.fromConfig({ HOST: 'acme.zvolv.in', PROTOCOL: 'https://' }).baseURL).to.equal('https://acme.zvolv.in');
    expect(ZvolvClient.fromConfig({ HOST: '', DOMAIN: 'acme' }).baseURL).to.equal('https://acme.zvolv.in');
  });
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