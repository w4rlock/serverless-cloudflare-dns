const R = require('ramda');
const _ = require('lodash');
const cf = require('cloudflare');
const ZoneService = require('./zone.js');
const RecordService = require('./record.js');

class CloudFlare {
  constructor(email, key) {
    // same instance shared!
    const cloudflare = cf({ email, key });

    this.ifArrayGetFirst = R.when(R.is(Array), R.head);
    this.zoneService = new ZoneService(cloudflare);
    this.recordService = new RecordService(cloudflare);
  }

  /**
   *
   * Create dns record set
   *
   * @param {String} domain name
   * @param {Object} record set
   *
   */
  async createDnsRecord(domainName, record) {
    const zoneId = await this.zoneService.getZoneId(domainName);
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
   * Remove dns record set
   *
   * @param {String} domain name
   * @param {Object} record set
   *
   */
  async removeDnsRecord(domainName, record) {
    const zoneId = await this.zoneService.getZoneId(domainName);
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
   * @param {String} domain name
   * @param {Object} record set
   *
   */
  async updateDnsRecord(domainName, record) {
    const q = R.pick(['name'])(record);

    const zoneId = await this.zoneService.getZoneId(domainName);
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
   * @param {string} domainName root domain name
   * @param {object } record the record object
   * @returns {array} records sets
   */
  async listDnsRecord(domainName, record) {
    const zoneId = await this.zoneService.getZoneId(domainName);
    const result = await this.recordService.getDnsRecords(zoneId, record);

    return result;
  }
}

module.exports = CloudFlare;
