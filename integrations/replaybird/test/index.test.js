'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var ReplayBird = require('../lib/');

describe('ReplayBird', function() {
  var replaybird;
  var analytics;
  var options = {
    siteKey: 'GvXbOw4hfAUrBosk2n9dn5'
  };

  beforeEach(function() {
    analytics = new Analytics();
    replaybird = new ReplayBird(options);
    analytics.use(ReplayBird);
    analytics.use(tester);
    analytics.add(replaybird);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    replaybird.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      ReplayBird,
      integration('ReplayBird')
        .global('replaybird')
        .option('siteKey', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(replaybird, 'load');
    });

    describe('#initialize', function() {
      it('should create window.replaybird', function() {
        analytics.assert(!window.replaybird);
        analytics.initialize();
        analytics.assert(window.replaybird);
      });

      it('should stub window.replaybird with the right methods', function() {
        var methods = [
          'identify',
          'capture',
          'track',
          // 'alias',
          // 'people.set',
          // 'people.set_once',
          // 'set_config',
          // 'register',
          // 'register_once',
          // 'unregister',
          // 'opt_out_capturing',
          // 'has_opted_out_capturing',
          // 'opt_in_capturing',
          // 'reset'
        ];
        analytics.assert(!window.replaybird);
        analytics.initialize();
        each(methods, function(method) {
          analytics.assert(window.replaybird[method]);
        });
      });

      it('should set window.replaybird.siteKey', function() {
        analytics.assert(!window.replaybird);
        analytics.initialize();
        analytics.assert(window.replaybird.siteKey === options.siteKey);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(replaybird.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(replaybird, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.replaybird, 'identify');
      });

      it('should send id as handle', function() {
        analytics.identify('id');
        analytics.called(window.replaybird.identify, 'id');
      });

      it('should send id as handle and traits', function() {
        analytics.identify('id', { trait: 'trait' });
        analytics.called(window.replaybird.identify, 'id', {
          id: 'id',
          trait: 'trait'
        });
      });

      it('should flatten nested objects and arrays', function() {
        analytics.identify('id', {
          email: 'teemo@teemo.com',
          property: 3,
          foo: {
            bar: {
              hello: 'teemo'
            },
            cheese: ['1', 2, 'cheers']
          },
          products: [{ A: 'Jello', B: 1 }, { B: 'Peanut', C: true }]
        });
        analytics.called(window.replaybird.identify, 'id', {
          id: 'id',
          _email: 'teemo@teemo.com',
          property: 3,
          'foo.bar.hello': 'teemo',
          'foo.cheese': '["1",2,"cheers"]',
          products: '[{"A":"Jello","B":1},{"B":"Peanut","C":true}]'
        });
      });

      it('should send date traits as ISOStrings', function() {
        var date = new Date('2016');
        analytics.identify('id', { date: date });
        analytics.called(window.replaybird.identify, 'id', {
          id: 'id',
          date: '2016-01-01T00:00:00.000Z'
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.replaybird, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.replaybird.track, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.replaybird.track, 'event', { property: true });
      });

      it('should filter out undefined or null props', function() {
        analytics.track('event', { property: undefined, prop2: null });
        analytics.called(window.replaybird.track, 'event', {});
      });

      it('should flatten nested objects and arrays', function() {
        analytics.track('event', {
          hello: 'hello',
          property: 3,
          foo: {
            bar: {
              hello: 'teemo'
            },
            cheese: ['1', 2, 'cheers']
          },
          products: [{ A: 'Jello', B: 'haha' }, { A: 'Peanut', B: true }],
          topArray: ['1', 2, true]
        });
        analytics.called(window.replaybird.track, 'event', {
          hello: 'hello',
          property: 3,
          'foo.bar.hello': 'teemo',
          'foo.cheese': '["1",2,"cheers"]',
          products: '[{"A":"Jello","B":"haha"},{"A":"Peanut","B":true}]',
          topArray: '["1",2,true]'
        });
      });
    });
  });
});
