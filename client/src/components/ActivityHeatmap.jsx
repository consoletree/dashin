import { useMemo } from 'react';

export default function ActivityHeatmap({ data, title = 'Login Activity' }) {
  // Process data into weeks/days format
  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate empty data for past 12 weeks
      const weeks = [];
      const today = new Date();
      
      for (let week = 11; week >= 0; week--) {
        const days = [];
        for (let day = 0; day < 7; day++) {
          const date = new Date(today);
          date.setDate(date.getDate() - (week * 7 + (6 - day)));
          days.push({
            date: date.toISOString().split('T')[0],
            count: 0
          });
        }
        weeks.push(days);
      }
      return weeks;
    }

    // Convert data array to date map
    const dateMap = {};
    data.forEach(item => {
      dateMap[item._id || item.date] = item.count;
    });

    // Generate weeks
    const weeks = [];
    const today = new Date();
    
    for (let week = 11; week >= 0; week--) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + (6 - day)));
        const dateStr = date.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          count: dateMap[dateStr] || 0
        });
      }
      weeks.push(days);
    }
    
    return weeks;
  }, [data]);

  const maxCount = useMemo(() => {
    const counts = heatmapData.flat().map(d => d.count);
    return Math.max(...counts, 1);
  }, [heatmapData]);

  const getColor = (count) => {
    if (count === 0) return 'bg-[#1a1a25]';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'bg-emerald-900/50';
    if (intensity < 0.5) return 'bg-emerald-700/60';
    if (intensity < 0.75) return 'bg-emerald-500/70';
    return 'bg-emerald-400';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card">
      <div className="card-header">{title}</div>
      
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2 text-xs text-gray-500">
          {dayLabels.map((day, i) => (
            <div key={day} className="h-4 flex items-center" style={{ display: i % 2 === 0 ? 'flex' : 'none' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1">
          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={day.date}
                  className={`w-4 h-4 rounded-sm ${getColor(day.count)} transition-colors hover:ring-1 hover:ring-white/30`}
                  title={`${day.date}: ${day.count} logins`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-[#1a1a25]" />
          <div className="w-4 h-4 rounded-sm bg-emerald-900/50" />
          <div className="w-4 h-4 rounded-sm bg-emerald-700/60" />
          <div className="w-4 h-4 rounded-sm bg-emerald-500/70" />
          <div className="w-4 h-4 rounded-sm bg-emerald-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
