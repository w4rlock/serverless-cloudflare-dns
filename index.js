const _ = require('lodash');
const CloudFlare = require('./lib/cloudflare');

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

    const disabled = this.getConfValue('cloudflare.disabled', false);
    if (disabled) {
      this.log('plugin disabled');
      return;
    }

    this.hooks = {
      'after:deploy:deploy': this.createRecordIfNeed.bind(this),
      'after:remove:remove': this.removeRecordIfNeed.bind(this),
      'cloudflare:deploy:deploy': this.createRecordIfNeed.bind(this),
      'cloudflare:update:update': this.updateRecord.bind(this),
      'cloudflare:remove:remove': this.removeRecordIfNeed.bind(this),
      'cloudflare:list:list': this.listRecord.bind(this),
    };

    this.commands = {
      cloudflare: {
        usage: 'cloud flare abm - record set',
        lifecycleEvents: ['deploy', 'remove', 'update', 'list'],
        commands: {
          deploy: {
            usage: 'create new record set',
            lifecycleEvents: ['deploy'],
          },
          remove: {
            usage: 'remove new record set',
            lifecycleEvents: ['remove'],
          },
          update: {
            usage: 'update new record set',
            lifecycleEvents: ['update'],
          },
          list: {
            usage: 'list record set',
            lifecycleEvents: ['list'],
          },
        },
      },
    };
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
   * @param {boolean} required=true if value is null throw a error
   * @param {string|object} defaultValue=undefined default value to return
   * @returns {string} configuration value
   */
  getConfValue(key, required = true, defaultValue = undefined) {
    const fromEnv = (k) => process.env[k];
    const fromCmdArg = (k) => this.options[k];
    const fromYaml = (k) => _.get(this.serverless, `service.custom.${k}`);

    let k = key.replace(/\./g, '-');
    let val = fromCmdArg(k);
    if (val) return val;

    k = key.replace(/\./g, '_').toUpperCase();
    val = fromEnv(k);
    if (val) return val;

    k = key;
    val = fromYaml(k);
    if (val) return val;

    if (required && !defaultValue) {
      throw new Error(`property value for ${key} is missing.`);
    }

    return defaultValue;
  }

  /**
   * Initialize variables
   *
   */
  initialize() {
    const auth = {};
    const record = {};
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
    this.CloudFlareApi = new CloudFlare(
      this.cfg.auth.email,
      this.cfg.auth.token
    );
  }

  /**
   * Create a new cloudflare record if not exist (check for cname to validate)
   *
   * @returns {record} cloudflare object record
   */
  async createRecordIfNeed() {
    this.initialize();

    this.log('Creating new record set');
    const res = await this.CloudFlareApi.createDnsRecord(
      this.cfg.domain,
      this.cfg.record
    );

    this.log(res);
  }

  /**
   * Remove cloud flare record set based on cname field to remove
   *
   */
  async removeRecordIfNeed() {
    this.initialize();

    this.log('Removing record set');
    const record = await this.CloudFlareApi.removeDnsRecord(
      this.cfg.domain,
      this.cfg.record
    );

    this.log(record);
  }

  /**
   * Update cloud flare record set based on cname field to update
   *
   */
  async updateRecord() {
    this.initialize();

    this.log('Updating record set');
    const record = await this.CloudFlareApi.updateDnsRecord(
      this.cfg.domain,
      this.cfg.record
    );

    this.log(record);
  }

  /**
   * List records
   *
   */
  async listRecord() {
    this.initialize();

    this.log('Listing record set');

    const q = {};
    const records = await this.CloudFlareApi.listDnsRecord(this.cfg.domain, q);

    this.log(records);
  }
}

module.exports = ServerlessCloudFlarePlugin;
