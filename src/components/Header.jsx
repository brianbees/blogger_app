export default function Header() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="sticky top-0 bg-white shadow-sm z-20 px-4 pt-4 pb-3">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-gray-500">{greeting}, Brian</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Voice Journal</h1>
        <p className="text-sm text-gray-600">{dateStr}</p>
      </div>
    </header>
  );
}
