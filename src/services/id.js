let counter = 0;

function generateId(prefix) {
  counter += 1;
  const ts = Date.now().toString(36);
  const seq = counter.toString(36).padStart(4, '0');
  return `${prefix}_${ts}_${seq}`;
}

module.exports = { generateId };
