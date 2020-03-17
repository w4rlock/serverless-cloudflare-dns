'use strict';

const R = require('ramda');
const cf = require('cloudflare')


class CloudFlare {
  constructor(email, key) {
    this.CloudFlareService = cf({ email, key });

    this.extractId = R.path([0,'id']);
    this.extractResult = R.pathOr([], ['result']);
    this.ifArrayGetFirst = R.when(R.is(Array), R.pathOr({},[0]));
  }



  /**
   *
   * Get zones
   *
   * @param {Object} - query filter
   *
   * @return Promise
   */
  getZones(query = {}) {
    const q = R.pick(['name'], query);
    return this.CloudFlareService.zones
      .browse(q)
      .then(this.extractResult);
  }


  /**
   * Get records set
   *
   * @param {String} zoneId
   * @param {Object} query - optional query filters
   *
   * @return {Promise}
   */
  getDnsRecords(zoneId, query = {}) {
    const q = R.pick(['type','name','content'], query);

    return this.CloudFlareService.dnsRecords
      .browse(zoneId, q)
      .then(this.extractResult);
  }


  /**
   *
   * Create new record set
   *
   * @param {String} zoneId
   * @param {Object} record
   *
   */
  __createDnsRecord(zoneId, r = {}) {
    if (!r.name) throw new Error('param record.name is required');
    if (!r.content) throw new Error('param record.content is required');

    const record = R.pick(['type','name','content'], r);
    record.type = record.type || 'CNAME';

    return this.CloudFlareService.dnsRecords.add(zoneId, record);
  }

  /**
   *
   * Remove record set
   *
   * @param {String} zoneId
   * @param {String} record set id
   *
   */
  __removeDnsRecord(zoneId, recordId) {
    if (!zoneId) throw new Error('param zoneId is required');
    if (!recordId) throw new Error('param recordId is required');

    return this.CloudFlareService.dnsRecords.del(zoneId, recordId);
  }


  /**
   *
   * Get zone id
   *
   * @param {String} domain name
   *
   *
   */
  async getZoneId(domainName = '') {
    let zones, zoneId;
    let q = {};

    if (domainName) {
      q.name = domainName;
    }

    try {
      zones = await this.getZones(q);
      zoneId = this.extractId(zones);
    }
    catch(error) {
      throw new Error(`CloudFlare unable to fetch zones: ${error}`);
    }

    if (!zoneId) throw new Error(`there is not a zone registered for ${domainName}`)
    return zoneId;
  }



  /**
   *
   * Get dns record set
   *
   * @param {String} zone id
   * @param {Object} query record set
   *
   */
  async getDnsRecord(zoneId, record) {
    let result

    try {
      result = this.getDnsRecords(zoneId, record);
    }
    catch(error) {
      throw new Error(`CloudFlare unable to fetch records set: ${error}`);
    }

    return this.ifArrayGetFirst(result);
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
    let recordId, zoneId, result;

    zoneId = await this.getZoneId(domainName);
    result = await this.getDnsRecord(zoneId, record);
    recordId = this.extractId(result);

    if (!recordId) {
      try {
        result = await this.__createDnsRecord(zoneId, record);
        result = this.ifArrayGetFirst(result);
      }
      catch(error) {
        throw new Error(`CloudFlare unable to create dns record set ${error}`);
      }
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
    let recordId, zoneId, result;

    zoneId = await this.getZoneId(domainName);
    result = await this.getDnsRecord(zoneId, record);
    recordId = this.extractId(result);

    if (recordId) {
      try {
        result = await this.__removeDnsRecord(zoneId, recordId);
        result = this.ifArrayGetFirst(result);
      }
      catch(error) {
        throw new Error(`CloudFlare unable to remove dns record set ${error}`);
      }
    }

    return result;
  }
}


module.exports = CloudFlare;
