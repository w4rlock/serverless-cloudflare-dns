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
   * TODO: if record cname does not exist => CREATE
   * if exist and content are not equals => UPDATE
   * else RECORD_EXIST
   *
   * @returns {record} cloudflare object record
   */
  async createOrUpdate() {
    const { domain, record } = this.ctx.cfg;

    if (!RecordController.validate(record)) return '';

    let result = '';
    const zoneId = await this.zoneService.getZoneId(domain);
    const oldRecord = await this.recordService.getDnsRecord(zoneId, record);
    const id = _.get(oldRecord, 'id');
    const oldContent = _.get(oldRecord, 'content');

    const create = async () => {
      try {
        const res = await this.recordService.create(zoneId, record);
        return this.ifArrayGetFirst(res);
      } catch (error) {
        throw new Error(`CloudFlare unable to create dns record set: ${error}`);
      }
    };

    const update = async () => {
      try {
        const res = await this.recordService.update(zoneId, id, record);
        return this.ifArrayGetFirst(res);
      } catch (error) {
        throw new Error(
          `CloudFlare unable to update dns record content: ${error}`
        );
      }
    };

    if (_.isEmpty(id)) {
      result = await create();
    } else if (oldContent !== record.content) {
      result = await update();
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

    if (!RecordController.validate(record)) return '';

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
   */
  async update() {
    const { domain, record } = this.ctx.cfg;

    if (!RecordController.validate(record)) return '';

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

    if (!_.get(this, 'ctx.options.A')) {
      query.name = record.name;
    }

    const zoneId = await this.zoneService.getZoneId(domain);
    const result = await this.recordService.getDnsRecords(zoneId, query);

    return result;
  }

  /**
   * validate if is ok to save or update
   *
   * @static
   * @param {object} record
   *
   * @returns {boolean} if is ok to save
   */
  static validate(record) {
    const name = _.get(record, 'name');
    const content = _.get(record, 'content');

    return !_.isEmpty(name) && !_.isEmpty(content);
  }
}

module.exports = RecordController;
