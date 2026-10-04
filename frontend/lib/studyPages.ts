export interface StudyNotePage {
  id: string;
  title: string;
  content: string; // Brief notes / concepts (Markdown supported)
  hasWorkedExample?: boolean;
  exampleTitle?: string; // e.g. "WORKED EXAMPLE", "STEP-BY-STEP SOLUTION", "EXAMPLE ANALYSIS"
  exampleProblem?: string; // Problem statement or excerpt
  exampleSolution?: string; // Step-by-step solution, breakdown, or key insight
}

/**
 * Parses a topic's notesMarkdown field into structured StudyNotePage array.
 * Supports:
 * 1. Serialized JSON array of StudyNotePage
 * 2. Markdown delimited by horizontal rules (---)
 * 3. Fallback raw single-page markdown
 */
export function parseTopicPages(notesMarkdown: string, fallbackTitle: string = 'Introduction'): StudyNotePage[] {
  if (!notesMarkdown || !notesMarkdown.trim()) {
    return [
      {
        id: 'page-1',
        title: fallbackTitle,
        content: '',
        hasWorkedExample: false,
      },
    ];
  }

  const trimmed = notesMarkdown.trim();

  // 1. Check if stored as JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p, idx) => ({
          id: p.id || `page-${idx + 1}`,
          title: p.title || `Page ${idx + 1}`,
          content: p.content || '',
          hasWorkedExample: Boolean(p.hasWorkedExample),
          exampleTitle: p.exampleTitle || 'WORKED EXAMPLE',
          exampleProblem: p.exampleProblem || '',
          exampleSolution: p.exampleSolution || '',
        }));
      }
    } catch (e) {
      // Fall through to markdown parsing if JSON fails
    }
  }

  // 2. Check if delimited by markdown page dividers (---)
  const chunks = trimmed.split(/\n---\s*\n/);
  if (chunks.length > 1) {
    return chunks.map((chunk, idx) => {
      const lines = chunk.trim().split('\n');
      let title = `Page ${idx + 1}`;
      let content = chunk.trim();

      if (lines[0]?.startsWith('#')) {
        title = lines[0].replace(/^#+\s*/, '').trim();
        content = lines.slice(1).join('\n').trim();
      }

      return {
        id: `page-${idx + 1}`,
        title,
        content,
        hasWorkedExample: false,
      };
    });
  }

  // 3. Fallback single-page
  const firstLine = trimmed.split('\n')[0] || '';
  let title = fallbackTitle;
  let content = trimmed;

  if (firstLine.startsWith('#')) {
    title = firstLine.replace(/^#+\s*/, '').trim();
    content = trimmed.split('\n').slice(1).join('\n').trim();
  }

  return [
    {
      id: 'page-1',
      title,
      content,
      hasWorkedExample: false,
    },
  ];
}

/**
 * Serializes an array of StudyNotePage objects to JSON string for storage in notesMarkdown.
 */
export function serializeTopicPages(pages: StudyNotePage[]): string {
  return JSON.stringify(pages, null, 2);
}
