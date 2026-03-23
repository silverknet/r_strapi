'use strict';

module.exports = {
  async testLatestFacebook(ctx) {
    const result = await strapi.service('api::update-news.update').testLatestFacebookPost();
    ctx.send(result);
  },

  async trigger(ctx) {
    try {
      const allNews = await strapi.service('api::update-news.update').updateNewsForce();
      ctx.send({
        message: 'News forced update',
        data: allNews, // return the fetched news
      });
    } catch (err) {
      ctx.throw(500, err);
    }
  },
};