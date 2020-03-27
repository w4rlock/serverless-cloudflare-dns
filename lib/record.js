const R = require('ramda');

const RECORD_PROPS = [
  'type',
  'name',
  'content',
  'proxied',
  'proxiable',
  'priority',
  'ttl',
];

class RecordService {
  /**
   * Constructor
   *
   * @param {object} cloudflare the cloudflare instance
   */
  constructor(cloudflare) {
    this.CloudFlareService = cloudflare;
    this.extractResult = R.pathOr([], ['result']);
    this.ifArrayGetFirst = R.when(R.is(Array), R.head);
  }

  /**
   * Get records set
   *
   * @param {String} zoneId
   * @param {Object} query - optional query filters
   *
   * @return {Promise}
   */
  async getDnsRecords(zoneId, query = {}) {
    const q = R.pick(RECORD_PROPS, query);
    let resp;

    try {
      const records = await this.CloudFlareService.dnsRecords.browse(zoneId, q);
      resp = this.extractResult(records);
    } catch (error) {
      throw new Error(`CloudFlare unable to fetch records set: ${error}`);
    }

    return resp;
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
    const q = R.pick(['name'])(record);
    const result = await this.getDnsRecords(zoneId, q);
    return this.ifArrayGetFirst(result);
  }

  /**
   *
   * Create new record set
   *
   * @param {String} zoneId
   * @param {Object} record
   *
   */
  create(zoneId, r = {}) {
    if (!r.name) throw new Error('param record.name is required');
    if (!r.content) throw new Error('param record.content is required');

    const record = R.pick(RECORD_PROPS, r);
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
  remove(zoneId, recordId) {
    if (!zoneId) throw new Error('param zoneId is required');
    if (!recordId) throw new Error('param recordId is required');

    return this.CloudFlareService.dnsRecords.del(zoneId, recordId);
  }

  /**
   * Update record set
   *
   * @param {string} zoneId domain zone id
   * @param {string} oldRecordId old record set id
   * @param {object} record record set object
   * @returns {object} record set updated
   */
  update(zoneId, oldRecordId, record) {
    if (!zoneId) throw new Error('param zoneId is required');
    if (!oldRecordId) throw new Error('param oldRecordId is required');

    const r = R.pick(RECORD_PROPS, record);
    return this.CloudFlareService.dnsRecords.edit(zoneId, oldRecordId, r);
  }
}

module.exports = RecordService;
