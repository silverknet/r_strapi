'use strict';

/**
 * nyhet service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::nyhet.nyhet');
