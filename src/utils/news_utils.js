
const status_type = Object.freeze({
  ADDED_PHOTOS: "added_photos",
  ADDED_VIDEO: "added_video",
  APP_CREATED_STORY: "app_created_story",
  APPROVED_FRIEND: "approved_friend",
  CREATED_EVENT: "created_event",
  CREATED_GROUP: "created_group",
  CREATED_NOTE: "created_note",
  MOBILE_STATUS_UPDATE: "mobile_status_update",
  PUBLISHED_STORY: "published_story",
  SHARED_STORY: "shared_story",
  TAGGED_IN_PHOTO: "tagged_in_photo",
  WALL_POST: "wall_post",
});

export async function addNews(news_data){

    const allExistingNews = await strapi.db.query('api::nyhet.nyhet').findMany({
        where: {}, 
        select: ['facebook_post_id'],
    });

    const newArticle = await strapi.db.query('api::article.article').create({
    data: {
        title: news_data.title ?? "Uppdatering från facebook",
        beskrivning: ",
        bild: news_data.full_picture ??
    },
    });
}