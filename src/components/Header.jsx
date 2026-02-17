export default function Header({ onCloudSyncClick, isSignedIn, blogUrl }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const version = '1.0.7'; // Update with each build

  return (
    <header className="sticky top-0 bg-white shadow-sm z-20 px-4 pt-safe pt-4 pb-3" role="banner">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 leading-relaxed">{greeting}, Brian</p>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-semibold text-gray-900 leading-tight">Voice Journal</h1>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                v{version}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{dateStr}</p>
            {blogUrl && (
              <a 
                href={blogUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                View Blog
              </a>
            )}
          </div>
          <button
            onClick={onCloudSyncClick}
            className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-full ${
              isSignedIn 
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            } transition-colors text-white font-medium min-w-[56px] min-h-[56px] shadow-lg`}
            aria-label="Cloud sync settings"
          >
            <span className="text-2xl" aria-hidden="true">{isSignedIn ? '✓' : '☁️'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
