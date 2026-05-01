export function extractModelText(result: unknown): string {
  if (typeof result === 'string') return result.trim();
  if (!result || typeof result !== 'object') return '';

  const record = result as Record<string, unknown>;
  const directCandidates = [
    record.text,
    record.content,
    record.output,
    record.message,
    record.reply,
    record.answer,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  for (const nestedKey of ['data', 'result', 'response']) {
    const nested = record[nestedKey];
    const nestedText = extractModelText(nested);
    if (nestedText) return nestedText;
  }

  const choices = record.choices;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      const choiceText = extractModelText(choice);
      if (choiceText) return choiceText;
    }
  }

  return '';
}

