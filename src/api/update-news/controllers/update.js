'use strict';

module.exports = {
  async testLatestFacebook(ctx) {
    const result = await strapi.service('api::update-news.update').testLatestFacebookPost();
    ctx.send(result);
  },
};