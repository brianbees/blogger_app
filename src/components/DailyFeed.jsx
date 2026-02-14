import { useState, useEffect } from 'react';
import SnippetCard from './SnippetCard';

export default function DailyFeed({ snippets, refreshTrigger, onDeleteSnippet, onImageClick, onPublishClick, onTranscriptUpdate, isSignedIn }) {
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
      <div className="text-center py-20 px-4" role="status" aria-live="polite">
        <div className="mb-4 text-5xl" aria-hidden="true">🎙️</div>
        <p className="text-base text-gray-900 font-semibold mb-2">No recordings yet</p>
        <p className="text-sm text-gray-600">Tap the microphone below to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="feed" aria-label="Voice recordings feed">
      {dayKeys.map((dayKey) => (
        <section key={dayKey} aria-labelledby={`date-${dayKey}`}>
          <h2 id={`date-${dayKey}`} className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 px-1">
            {dayKey}
          </h2>
          <div>
            {groupedSnippets[dayKey].map((snippet) => (
              <SnippetCard 
                key={snippet.id} 
                snippet={snippet} 
                onDelete={onDeleteSnippet}
                onImageClick={onImageClick}
                onPublishClick={onPublishClick}
                onTranscriptUpdate={onTranscriptUpdate}
                isSignedIn={isSignedIn}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
