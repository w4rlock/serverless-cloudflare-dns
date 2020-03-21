'use strict';

const _ = require('lodash');
const CloudFlare = require('./lib/CloudFlare');

const LOG_PREFFIX = '[ServerlessCloudFlare] - ';

class ServerlessCloudFlarePlugin {
  /**
   * Default serverless constructor
   *
   * @param {object} serverless serverless instance
   * @param {object} options command line arguments
   */
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    let disabled = this.getConfValue('cloudflare.disabled', false);
    if (disabled == 'true') {
      this.log('plugin disabled');
      return;
    }

    this.hooks = {
      'after:deploy:deploy': this.createRecordIfNeed.bind(this),
      'after:remove:remove': this.removeRecordIfNeed.bind(this),
      'cloudflare:deploy:deploy': this.createRecordIfNeed.bind(this),
      'cloudflare:update:update': this.updateRecord.bind(this),
      'cloudflare:remove:remove': this.removeRecordIfNeed.bind(this)
    }

    this.commands = {
      cloudflare: {
        usage: 'cloud flare abm - record set',
        lifecycleEvents: ['deploy', 'remove', 'update'],
        commands: {
          deploy:{ usage: 'create new record set', lifecycleEvents: ['deploy']},
          remove:{ usage: 'remove new record set', lifecycleEvents: ['remove']},
          update:{ usage: 'update new record set', lifecycleEvents: ['update']}
        }
      }
    }
  }



  /**
   * Log to stdout
   *
   * @param {object|string} entity to log
   */
  log(entity) {
    this.serverless.cli.log(
      LOG_PREFFIX + (_.isObject(entity) ? JSON.stringify(entity) : entity)
    );
  }



  /**
   * Get multiprovider configuration
   *
   * @param {string} key configuration key
   * @param {boolean} required=true if value is false throw a error
   * @param {string|object} default_value=undefined default value to return
   * @returns {string} configuration value
   */
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
    const auth = {}, record = {}
    this.cfg = {};
    this.cfg.domain = this.getConfValue('cloudflare.domain');

    auth.email = this.getConfValue('cloudflare.auth.email');
    auth.token = this.getConfValue('cloudflare.auth.token');

    record.name = this.getConfValue('cloudflare.record.name');
    record.content = this.getConfValue('cloudflare.record.content');

    // OPTIONALS FIELDS
    record.type = this.getConfValue('cloudflare.record.type', false, 'CNAME');
    record.proxied = this.getConfValue('cloudflare.record.proxied', false);
    record.proxiable = this.getConfValue('cloudflare.record.proxiable', false);
    record.priority = this.getConfValue('cloudflare.record.priority', false);
    record.ttl = this.getConfValue('cloudflare.record.ttl', false);

    this.cfg.auth = auth;
    this.cfg.record = record;
    this.CloudFlareApi = new CloudFlare(this.cfg.auth.email, this.cfg.auth.token);
  }





  async createRecordIfNeed() {
    this.initialize();
    const { domain } = this.cfg;

    this.log('Creating new record set');
    const res = await this.CloudFlareApi.createDnsRecord(domain, this.cfg.record)
    this.log(res);
  }



  async removeRecordIfNeed() {
    this.initialize();
    const { domain } = this.cfg;

    this.log('Removing record set');
    const record = await this.CloudFlareApi.removeDnsRecord(domain, this.cfg.record)

    this.log(record);
  }


  async updateRecord() {
    this.initialize();
    const { domain } = this.cfg;

    this.log('Updating record set');
    const record = await this.CloudFlareApi.updateDnsRecord(domain, this.cfg.record)

    this.log(record);
  }
}


module.exports = ServerlessCloudFlarePlugin;
