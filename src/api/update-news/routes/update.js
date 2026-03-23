module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/update-news/test-latest-facebook',
      handler: 'update.testLatestFacebook',
      config: {
        auth: false,
      },
    },
  ],
};