'use strict';

const { createStrapi } = require('@strapi/strapi');

async function main() {
  const app = createStrapi();

  await app.load();

  try {
    const result = await app.service('api::update-news.update').updateNewsForce();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
