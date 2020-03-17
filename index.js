'use strict';

const _ = require('lodash');
const CloudFlare = require('./lib/CloudFlare');

const LOG_PREFFIX = '[ServerlessCloudFlare] - ';

class ServerlessCloudFlarePlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'after:deploy:deploy': this.createRecordIfNeed.bind(this),
      'before:remove:remove': this.removeRecordIfNeed.bind(this),
      'cloudflare-deploy:deploy': this.createRecordIfNeed.bind(this),
      'cloudflare-remove:remove': this.removeRecordIfNeed.bind(this)
    }

    this.commands = {
      'cloudflare-deploy': {
        usage: 'deploy a record set',
        lifecycleEvents: ['deploy']
      },
      'cloudflare-remove': {
        usage: 'remove a record set',
        lifecycleEvents: ['remove']
      }
    }
  }



  /**
   * Log to console
   * @param msg:string message to log
   */
  log(entity) {
    this.serverless.cli.log(
      LOG_PREFFIX + (_.isObject(entity) ? JSON.stringify(entity) : entity)
    );
  }



  getConfValue(key, required = true, default_value = undefined) {
    const fromEnv =    k => process.env[k];
    const fromCmdArg = k => this.options[k];
    const fromYaml =   k => _.get(this.serverless, `service.custom.${k}`);

    let k = key.replace(/\./g, '-');
    let val = fromCmdArg(k);
    if (val) return val;

    k = key.replace(/\./g, '_').toUpperCase();
    val = fromEnv(k);
    if (val) return val;

    k = key;
    val = fromYaml(k);
    if (val) return val;

    if (required && !default_value) {
      throw new Error(`property value for ${key} is missing.`)
    }

    return default_value;
  }



  initialize() {
    this.cfg = { auth: {}, record: {}};
    this.cfg.domain = this.getConfValue('cloudflare.domain');
    this.cfg.auth.email = this.getConfValue('cloudflare.auth.email');
    this.cfg.auth.token = this.getConfValue('cloudflare.auth.token');
    this.cfg.record.name = this.getConfValue('cloudflare.record.name');
    this.cfg.record.content = this.getConfValue('cloudflare.record.content');
    this.cfg.record.type = this.getConfValue('cloudflare.record.type', false, 'CNAME');

    this.CloudFlareApi = new CloudFlare(this.cfg.auth.email, this.cfg.auth.token);
  }





  async createRecordIfNeed() {
    this.initialize();
    const { domain } = this.cfg;

    this.log('Checking or create record set');
    const res = await this.CloudFlareApi.createDnsRecord(domain, this.cfg.record)
    this.log(res);
  }



  async removeRecordIfNeed() {
    this.initialize();
    const { domain } = this.cfg;

    this.log('Checking or remove record set');
    const record = await this.CloudFlareApi.removeDnsRecord(domain, this.cfg.record)

    this.log(record);
  }
}


module.exports = ServerlessCloudFlarePlugin;
