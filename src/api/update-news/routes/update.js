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
    {
      method: 'POST',
      path: '/update-news/trigger',
      handler: 'update.trigger',
      config: {
        auth: false, // Set to true if you want only logged-in admins to trigger
      },
    },
  ],
};