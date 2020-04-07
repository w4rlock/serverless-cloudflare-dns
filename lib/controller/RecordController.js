const R = require('ramda');
const _ = require('lodash');
const ZoneService = require('../service/ZoneService.js');
const RecordService = require('../service/RecordService.js');

class RecordController {
  /**
   * Constructor
   *
   * @param {object} context plugin context
   */
  constructor(ctx) {
    this.ctx = ctx;

    this.ifArrayGetFirst = R.when(R.is(Array), R.head);
    this.zoneService = new ZoneService(this.ctx.CloudFlare);
    this.recordService = new RecordService(this.ctx.CloudFlare);
  }

  /**
   *
   * Create dns record set
   *
   * @returns {record} cloudflare object record
   */
  async create() {
    const { domain, record } = this.ctx.cfg;
    const zoneId = await this.zoneService.getZoneId(domain);
    let result = await this.recordService.getDnsRecord(zoneId, record);

    if (_.isEmpty(result, 'id')) {
      try {
        result = await this.recordService.create(zoneId, record);
        result = this.ifArrayGetFirst(result);
      } catch (error) {
        throw new Error(`CloudFlare unable to create dns record set: ${error}`);
      }
    } else {
      result = 'CF_RECORD_EXISTENT';
    }

    return result;
  }

  /**
   *
   * Remove cloud flare record set based on cname field to remove
   *
   * @returns {record} cloudflare object record
   */
  async remove() {
    const { domain, record } = this.ctx.cfg;
    const zoneId = await this.zoneService.getZoneId(domain);
    let result = await this.recordService.getDnsRecord(zoneId, record);

    if (!_.isEmpty(result, 'id')) {
      try {
        result = await this.recordService.remove(zoneId, result.id);
        result = this.ifArrayGetFirst(result);
      } catch (error) {
        throw new Error(`CloudFlare unable to remove dns record set: ${error}`);
      }
    } else {
      result = 'CF_RECORD_NOT_FOUND';
    }

    return result;
  }

  /**
   *
   * Update dns record set
   * NOTE: the old record is searched by 'name' field
   *
   *
   */
  async update() {
    const { domain, record } = this.ctx.cfg;
    const q = R.pick(['name'])(record);

    const zoneId = await this.zoneService.getZoneId(domain);
    let result = await this.recordService.getDnsRecord(zoneId, q);

    if (!_.isEmpty(result, 'id')) {
      try {
        result = await this.recordService.update(zoneId, result.id, record);
        result = this.ifArrayGetFirst(result);
      } catch (error) {
        throw new Error(`CloudFlare unable to update dns record set: ${error}`);
      }
    } else {
      result = 'CF_RECORD_NOT_FOUND';
    }

    return result;
  }

  /**
   * List records set
   *
   * @returns {array} records sets
   */
  async list() {
    const { domain, record } = this.ctx.cfg;
    const query = {};

    if (!_.get(this, 'ctx.options.all')) {
      query.name = record.name;
    }

    const zoneId = await this.zoneService.getZoneId(domain);
    const result = await this.recordService.getDnsRecords(zoneId, query);

    return result;
  }
}

module.exports = RecordController;
