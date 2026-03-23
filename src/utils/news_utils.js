'use strict';

function normalizeFacebookPostId(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasImportTag(message, tag) {
  if (typeof message !== 'string' || !tag) {
    return false;
  }

  return new RegExp(escapeRegExp(tag), 'i').test(message);
}

function stripImportTag(message, tag) {
  if (typeof message !== 'string') {
    return '';
  }

  if (!tag) {
    return message.trim();
  }

  return message
    .replace(new RegExp(escapeRegExp(tag), 'ig'), ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractFirstSentence(message) {
  const match = message.match(/.+?[.!?](?=\s|$)/s);

  if (match) {
    return match[0].trim();
  }

  const [firstLine = ''] = message.split('\n');
  return firstLine.trim();
}

function extractNewsContentFromMessage(message, tag) {
  const cleanedMessage = stripImportTag(message, tag);

  if (!cleanedMessage) {
    return null;
  }

  const title = extractFirstSentence(cleanedMessage) || cleanedMessage;
  const remainder = cleanedMessage.slice(title.length).trim();

  return {
    title,
    description: remainder || cleanedMessage,
  };
}

async function buildExistingFacebookIdSet(strapi) {
  const allExistingNews = await strapi.db.query('api::nyhet.nyhet').findMany({
    where: {
      facebook_post_id: {
        $notNull: true,
      },
    },
    select: ['facebook_post_id'],
  });

  return new Set(
    allExistingNews
      .map((entry) => normalizeFacebookPostId(entry.facebook_post_id))
      .filter(Boolean)
  );
}

module.exports = {
  buildExistingFacebookIdSet,
  extractNewsContentFromMessage,
  hasImportTag,
  normalizeFacebookPostId,
};