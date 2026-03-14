function trimToMaxChars(value, maxChars) {
  if (typeof value !== 'string') return '';
  if (!Number.isFinite(maxChars) || maxChars <= 0) return value;
  return value.length <= maxChars ? value : `${value.slice(0, maxChars - 1)}…`;
}

module.exports = { trimToMaxChars };
