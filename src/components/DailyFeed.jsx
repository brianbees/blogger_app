import { useState, useEffect } from 'react';
import SnippetCard from './SnippetCard';

export default function DailyFeed({ snippets, refreshTrigger, onDeleteSnippet }) {
  const [groupedSnippets, setGroupedSnippets] = useState({});

  useEffect(() => {
    const groups = snippets.reduce((acc, snippet) => {
      const { dayKey } = snippet;
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(snippet);
      return acc;
    }, {});

    setGroupedSnippets(groups);
  }, [snippets, refreshTrigger]);

  const dayKeys = Object.keys(groupedSnippets).sort().reverse();

  if (dayKeys.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="mb-4 text-4xl">🎙️</div>
        <p className="text-base text-gray-900 font-medium mb-2">No recordings yet</p>
        <p className="text-sm text-gray-500">Tap the microphone below to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dayKeys.map((dayKey) => (
        <div key={dayKey}>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            {dayKey}
          </h2>
          <div>
            {groupedSnippets[dayKey].map((snippet) => (
              <SnippetCard key={snippet.id} snippet={snippet} onDelete={onDeleteSnippet} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
