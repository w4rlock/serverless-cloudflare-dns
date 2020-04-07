const _ = require('lodash');
const BbPromise = require('bluebird');
const BaseServerlessPlugin = require('base-serverless-plugin');
const CloudFlare = require('cloudflare');
const RecordCtl = require('./lib/controller/RecordController.js');
const Commands = require('./lib/Commands');

const LOG_PREFFIX = '[ServerlessCloudFlare] -';

class ServerlessCloudFlarePlugin extends BaseServerlessPlugin {
  /**
   * Serverless plugin constructor
   *
   * @param {object} serverless serverless instance
   * @param {object} options command line arguments
   */
  constructor(serverless, options) {
    super(serverless, options, LOG_PREFFIX, 'cloudflare');

    this.hooks = {
      'after:deploy:deploy': () =>
        BbPromise.bind(this)
          .then(this.initialize)
          .then(() => this.RecordCtl.create())
          .then(this.log),
      'after:remove:remove': () =>
        BbPromise.bind(this)
          .then(this.initialize)
          .then(() => this.RecordCtl.remove())
          .then(this.log),
      'cloudflare:record:deploy:deploy': () =>
        BbPromise.bind(this)
          .then(this.initialize)
          .then(() => this.RecordCtl.create())
          .then(this.log),
      'cloudflare:record:update:update': () =>
        BbPromise.bind(this)
          .then(this.initialize)
          .then(() => this.RecordCtl.update())
          .then(this.log),
      'cloudflare:record:remove:remove': () =>
        BbPromise.bind(this)
          .then(this.initialize)
          .then(() => this.RecordCtl.remove())
          .then(this.log),
      'cloudflare:record:list:list': () =>
        BbPromise.bind(this)
          .then(this.initialize)
          .then(() => this.RecordCtl.list())
          .then(this.log),
    };

    this.commands = Commands;
  }

  /**
   * Initialize User config variables.
   *
   */
  initialize() {
    this.cfg = {
      auth: {},
      record: {},
    };

    this.cfg.domain = this.getConf('domain');

    this.cfg.auth.email = this.getConf('auth.email');
    this.cfg.auth.token = this.getConf('auth.token');

    // if declared tag record validate
    const record = this.getConf('record', false, {});
    if (!_.isEmpty(record)) {
      this.cfg.record.name = this.getConf('record.name');
      this.cfg.record.content = this.getConf('record.content');

      // OPTIONALS FIELDS
      this.cfg.record.type = this.getConf('record.type', false, 'CNAME');
      this.cfg.record.priority = this.getConf('record.priority', false);
      this.cfg.record.ttl = this.getConf('record.ttl', false);
      this.cfg.record.proxied = this.getConf('record.proxied', false, true);
      this.cfg.record.proxiable = this.getConf('record.proxiable', false, true);
    }

    this.CloudFlare = new CloudFlare({
      email: this.cfg.auth.email,
      key: this.cfg.auth.token,
    });

    const ctx = this;
    this.RecordCtl = new RecordCtl(ctx);

    return BbPromise.resolve();
  }
}

module.exports = ServerlessCloudFlarePlugin;
