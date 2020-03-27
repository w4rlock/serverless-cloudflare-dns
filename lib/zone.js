const R = require('ramda');

class ZoneService {
  constructor(cloudflare) {
    this.CloudFlareService = cloudflare;
    this.extractId = R.path([0, 'id']);
    this.extractResult = R.pathOr([], ['result']);
  }

  /**
   *
   * Get zones
   *
   * @param {Object} - query filter
   * @return {Array} zones result
   */
  async getZones(query = {}) {
    const q = R.pick(['name'], query);
    let result;

    try {
      result = await this.CloudFlareService.zones
        .browse(q)
        .then(this.extractResult);
    } catch (error) {
      throw new Error(`CloudFlare unable to fetch zones: ${error}`);
    }

    return result;
  }

  /**
   *
   * Get zone id
   *
   * @param {String} domain name
   *
   */
  async getZoneId(domainName = '') {
    const q = {};

    if (domainName) {
      q.name = domainName;
    }

    const zones = await this.getZones(q);
    const zoneId = this.extractId(zones);

    if (!zoneId) {
      throw new Error(`there is not a zone registered for ${domainName}`);
    }
    return zoneId;
  }
}

module.exports = ZoneService;
