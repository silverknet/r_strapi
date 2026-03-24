'use strict';

const TITLE_LABELS = ['titel', 'rubrik', 'title'];
const DATE_LABELS = ['datum', 'eventdatum', 'event date'];
const PLACE_LABELS = ['plats', 'place'];

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

function normalizeDateValue(value) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00`;
  }

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return `${trimmed.replace(/\//g, '-')}T00:00:00`;
  }

  let match = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{1,2}):(\d{2})$/);

  if (match) {
    const [, year, month, day, hour, minute] = match;
    return `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute}:00`;
  }

  match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}T00:00:00`;
  }

  match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}T00:00:00`;
  }

  match = trimmed.match(/^(\d{2})[./](\d{2})[./](\d{4})[ T](\d{1,2}):(\d{2})$/);

  if (match) {
    const [, day, month, year, hour, minute] = match;
    return `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute}:00`;
  }

  return null;
}

function extractMetadataLine(line, labels) {
  const trimmed = line.trim();

  for (const label of labels) {
    const regex = new RegExp(`^${escapeRegExp(label)}\\s*:\\s*(.+)$`, 'i');
    const match = trimmed.match(regex);

    if (match) {
      return match[1].trim();
    }
  }

  return null;
}
function extractFirstSentence(message) {
  const match = message.match(/.+?[.!?](?=\s|$)/s);

  if (match) {
    return match[0].trim();
  }

  const [firstLine = ''] = message.split('\n');
  return firstLine.trim();
}

function parseMetadata(message) {
  const lines = message.split(/\r?\n/);
  const bodyLines = [];
  let title = null;
  let date = null;
  let place = null;

  for (const line of lines) {
    const titleValue = extractMetadataLine(line, TITLE_LABELS);

    if (titleValue && !title) {
      title = titleValue;
      continue;
    }

    const dateValue = extractMetadataLine(line, DATE_LABELS);

    if (dateValue && !date) {
      date = normalizeDateValue(dateValue);
      continue;
    }

    const placeValue = extractMetadataLine(line, PLACE_LABELS);

    if (placeValue && !place) {
      place = placeValue;
      continue;
    }

    bodyLines.push(line);
  }

  return {
    title,
    date,
    place,
    body: bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
  };
}

function extractNewsContentFromMessage(message, tag, fallbackDate) {
  const cleanedMessage = stripImportTag(message, tag);

  if (!cleanedMessage) {
    return null;
  }

  const metadata = parseMetadata(cleanedMessage);
  const body = metadata.body;
  const title = metadata.title || extractFirstSentence(body) || body;

  if (!title) {
    return null;
  }

  const description = body
    ? metadata.title
      ? body
      : body.slice(title.length).trim() || body
    : title;

  return {
    title,
    description,
    date: metadata.date || fallbackDate,
    place: metadata.place || null,
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