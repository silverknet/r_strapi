'use strict';

module.exports = {
  async updateNewsForce() {

    const allExistingNews = await strapi.db.query('api::nyhet.nyhet').findMany({
        where: {},  // no filter → get all
        select: ['id', 'title', 'createdAt'], // only these fields
    });

    strapi.log.info(`update news`);

    const access_token = process.env.FACEBOOK_API_TOKEN;
    const page_id = process.env.FACEBOOK_PAGE_ID;
    const twoWeeks = Math.floor(Date.now() / 1000) - 24 * 60 * 60 * 60;
    const url2 = "https://graph.facebook.com/"+ page_id +"/feed?fields=id,message,full_picture,created_time,status_type&since=" + twoWeeks+ "&access_token=" + access_token;
    //     const url = "https://graph.facebook.com/v23.0/213729335316016/posts?since=2025-01-01&fields=message,attachments{media_type,media,url,subattachments}&access_token=" + access_token;

    strapi.log.info(url2);

    try {
        const res = await fetch(url2);

        if (!res.ok) {
            strapi.log.error(`Facebook API error: ${res.status} ${res.statusText}`);
            return;
        }

        const data = await res.json(); // parse JSON response
        strapi.log.info('Facebook posts fetched:');
        strapi.log.info(JSON.stringify(data, null, 2)); // pretty-print
    } catch (err) {
        strapi.log.error('Error fetching Facebook posts:', err);
    }

    strapi.log.info(`Fetched ${allExistingNews.length} news items`);
    return allExistingNews;

  },
  async updateNewsScheduled() {

    const res = await fetch(url)

    // Example job logic: create a new News entry
    const newNews = await strapi.db.query('api::news.news').create({
      data: {
        title: 'Daily automated news',
        content: 'This news item was created automatically by the daily job.',
        publishedAt: new Date(), // optional: auto-publish
      },
    });

    strapi.log.info(`✅ News created with ID: ${newNews.id}`);
    return newNews;
  },
};