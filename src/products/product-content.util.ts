import sanitizeHtml = require('sanitize-html');

const PRODUCT_DESCRIPTION_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'blockquote',
    'br',
    'em',
    'h2',
    'h3',
    'h4',
    'li',
    'ol',
    'p',
    'strong',
    'u',
    'ul',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
};

export function sanitizeProductDescription(value: unknown): string {
  return sanitizeHtml(typeof value === 'string' ? value : '', PRODUCT_DESCRIPTION_OPTIONS);
}
