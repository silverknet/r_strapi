'use strict';

const {
  buildExistingFacebookIdSet,
  extractNewsContentFromMessage,
  hasImportTag,
  normalizeFacebookPostId,
} = require('../../../utils/news_utils');

const NEWS_UID = 'api::nyhet.nyhet';
const DEFAULT_FACEBOOK_NEWS_TAG = 'simonstorp.se';
const DAY_IN_SECONDS = 24 * 60 * 60;
const FEED_PAGE_SIZE = 100;
const FACEBOOK_FIELDS = [
  'id',
  'message',
  'full_picture',
  'created_time',
  'status_type',
  'permalink_url',
].join(',');

function getFacebookConfig() {
  const accessToken = process.env.FACEBOOK_API_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const tag = process.env.FACEBOOK_NEWS_TAG || DEFAULT_FACEBOOK_NEWS_TAG;

  if (!accessToken || !pageId) {
    throw new Error('Missing FACEBOOK_API_TOKEN or FACEBOOK_PAGE_ID');
  }

  return { accessToken, pageId, tag };
}

function buildFacebookFeedUrl({ pageId, accessToken, sinceUnix, limit = FEED_PAGE_SIZE }) {
  const url = new URL(`https://graph.facebook.com/${pageId}/feed`);
  url.searchParams.set('fields', FACEBOOK_FIELDS);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', accessToken);

  if (sinceUnix) {
    url.searchParams.set('since', String(sinceUnix));
  }

  return url.toString();
}

async function fetchFacebookFeed(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Facebook API error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function fetchFacebookPosts({ sinceUnix }) {
  const { accessToken, pageId } = getFacebookConfig();
  const posts = [];
  let nextUrl = buildFacebookFeedUrl({ pageId, accessToken, sinceUnix });

  while (nextUrl) {
    const data = await fetchFacebookFeed(nextUrl);

    if (Array.isArray(data.data)) {
      posts.push(...data.data);
    }

    nextUrl = data?.paging?.next || null;
  }

  return posts;
}

function buildFallbackFacebookUrl(pageId, postId) {
  if (!postId) {
    return null;
  }

  if (!String(postId).includes('_')) {
    return `https://www.facebook.com/${pageId}/posts/${postId}`;
  }

  const [, entryId] = String(postId).split('_');
  return `https://www.facebook.com/${pageId}/posts/${entryId}`;
}

function toNewsData(post, tag, pageId) {
  const facebookPostId = normalizeFacebookPostId(post?.id);
  const parsedMessage = extractNewsContentFromMessage(post?.message, tag);
  const createdTime = post?.created_time;

  if (!facebookPostId || !parsedMessage || !createdTime) {
    return null;
  }

  return {
    title: parsedMessage.title,
    Beskrivning: parsedMessage.description,
    Datum: createdTime.slice(0, 10),
    url: post?.permalink_url || buildFallbackFacebookUrl(pageId, facebookPostId),
    facebook_post_id: facebookPostId,
  };
}

async function createMissingNews(posts, tag, pageId) {
  const existingIds = await buildExistingFacebookIdSet(strapi);
  const created = [];
  const skippedDuplicates = [];
  const skippedInvalid = [];

  for (const post of posts) {
    const facebookPostId = normalizeFacebookPostId(post?.id);

    if (!facebookPostId) {
      skippedInvalid.push({ reason: 'missing_id' });
      continue;
    }

    if (existingIds.has(facebookPostId)) {
      skippedDuplicates.push(facebookPostId);
      continue;
    }

    const newsData = toNewsData(post, tag, pageId);

    if (!newsData) {
      skippedInvalid.push({
        id: facebookPostId,
        reason: 'missing_message_or_created_time',
      });
      continue;
    }

    const createdDocument = await strapi.documents(NEWS_UID).create({
      data: newsData,
      status: 'published',
    });

    existingIds.add(facebookPostId);
    created.push({
      documentId: createdDocument.documentId,
      title: newsData.title,
      facebook_post_id: facebookPostId,
      url: newsData.url,
    });
  }

  return {
    created,
    skippedDuplicates,
    skippedInvalid,
  };
}

async function syncFacebookNews({ daysBack, source }) {
  const { tag, pageId } = getFacebookConfig();
  const sinceUnix = Math.floor(Date.now() / 1000) - (daysBack * DAY_IN_SECONDS);
  const posts = await fetchFacebookPosts({ sinceUnix });
  const taggedPosts = posts.filter((post) => hasImportTag(post?.message, tag));
  const importResult = await createMissingNews(taggedPosts, tag, pageId);

  return {
    ok: true,
    source,
    daysBack,
    tag,
    fetchedCount: posts.length,
    taggedCount: taggedPosts.length,
    createdCount: importResult.created.length,
    duplicateCount: importResult.skippedDuplicates.length,
    invalidCount: importResult.skippedInvalid.length,
    created: importResult.created,
    duplicates: importResult.skippedDuplicates,
    invalid: importResult.skippedInvalid,
  };
}

module.exports = {
  /**
   * Fetches the single newest post on the Page feed (limit=1) and logs it.
   */
  async testLatestFacebookPost() {
    try {
      const { accessToken, pageId, tag } = getFacebookConfig();
      const url = buildFacebookFeedUrl({
        pageId,
        accessToken,
        limit: 1,
      });
      const data = await fetchFacebookFeed(url);
      const post = data?.data?.[0] ?? null;

      return {
        ok: true,
        tag,
        post,
        matchesTag: hasImportTag(post?.message, tag),
        mappedNews: post ? toNewsData(post, tag, pageId) : null,
      };
    } catch (err) {
      strapi.log.error('[test-latest-facebook] Fetch failed:', err);
      return { ok: false, error: String(err) };
    }
  },

  async updateNewsForce() {
    return syncFacebookNews({
      daysBack: 14,
      source: 'force',
    });
  },

  async updateNewsScheduled() {
    return syncFacebookNews({
      daysBack: 1,
      source: 'cron',
    });
  },
};