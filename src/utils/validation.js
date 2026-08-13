const ALLOWED_STATUSES = new Set(['unread', 'completed', 'uncertain']);
const ALLOWED_UPDATE_FIELDS = new Set(['userNote', 'status']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isSafeId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

function validateSentenceUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be an object' };
  }
  if (Object.keys(body).some((key) => !ALLOWED_UPDATE_FIELDS.has(key))) {
    return { valid: false, error: 'Only userNote and status may be updated' };
  }
  if (typeof body.userNote !== 'string') return { valid: false, error: 'userNote must be a string' };
  if (!ALLOWED_STATUSES.has(body.status)) {
    return { valid: false, error: 'status must be unread, completed, or uncertain' };
  }
  return { valid: true };
}

module.exports = { ALLOWED_STATUSES, isSafeId, validateSentenceUpdate };
