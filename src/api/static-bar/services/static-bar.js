'use strict';

/**
 * static-bar service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::static-bar.static-bar');
