module.exports = {
  routes: [
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