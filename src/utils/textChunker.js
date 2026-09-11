const chunkText = (text, chunkSize = 500, overlap = 100) => {
  if (typeof text !== "string") {
    return [];
  }

  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return [];
  }

  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("overlap must be 0 or greater and less than chunkSize");
  }

  const chunks = [];
  let start = 0;

  while (start < normalizedText.length) {
    const end = Math.min(start + chunkSize, normalizedText.length);
    chunks.push(normalizedText.slice(start, end).trim());

    if (end === normalizedText.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
};

module.exports = {
  chunkText,
};
