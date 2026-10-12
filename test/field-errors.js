// PT-06 belirli bir JSON şeması dayatmaz: details.errors gibi alan haritaları,
// [{ field, message }] listeleri ve yalnızca eksik alanı belirten mesajlar desteklenir.
function hasFieldError(body, field) {
  const aliases = {
    name: /\bname\b|\bad\b|\bisim\b/i,
    email: /\bemail\b|e-posta|\beposta\b/i,
    password: /\bpassword\b|şifre|sifre/i
  };
  function containsField(value) {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(containsField);
    if (Object.entries(value).some(([key, message]) => aliases[field].test(key) && Boolean(message))) return true;
    if (typeof value.field === 'string' && aliases[field].test(value.field) && Boolean(value.message)) return true;
    return Object.values(value).some(containsField);
  }
  if (containsField(body.details) || containsField(body.errors)) return true;
  const message = typeof body.error === 'string' ? body.error : '';
  return aliases[field].test(message) &&
    Object.keys(aliases).filter(key => key !== field).every(key => !aliases[key].test(message));
}

module.exports = { hasFieldError };
