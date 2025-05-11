import sanitizeHtml from 'sanitize-html';

export const sanitizeDescription = (req, res, next) => {
  if (req.body.description) {
    req.body.description = sanitizeHtml(req.body.description, {
      allowedTags: ['b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      allowedAttributes: {
        'a': ['href', 'target', 'rel'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        'a': (tagName, attribs) => ({
          tagName: 'a',
          attribs: {
            href: attribs.href,
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        })
      }
    });
  }
  next();
};
