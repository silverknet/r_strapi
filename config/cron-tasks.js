module.exports = {
  syncFacebookNewsDaily: {
    task: async ({ strapi }) => {
      try {
        const result = await strapi.service('api::update-news.update').updateNewsScheduled();
        strapi.log.info(
          `[facebook-news-cron] created=${result.createdCount} duplicates=${result.duplicateCount} invalid=${result.invalidCount}`
        );
      } catch (error) {
        strapi.log.error('[facebook-news-cron] sync failed', error);
      }
    },
    options: {
      rule: '0 5 2 * * *',
    },
  },
};
