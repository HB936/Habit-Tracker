import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Award, Droplet, Moon, Monitor, Settings, Bell, User, X, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';




// Utility functions
const formatDateToLocalString = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Type definitions
type StatCategory = "Water" | "Sleep" | "Screen";
type Stats = Record<StatCategory, {
  current: number;
  goal: number;
  unit: string;
  icon: React.ReactNode;
  streakDays: number;
  color: string;
}>;


// Enhanced Calendar component with localStorage persistence


// Enhanced Calendar component with localStorage persistence
type CalendarDay = {
  date: Date;
  currentMonth: boolean;
  data: {
    Water: number;
    Sleep: number;
    Screen: number;
  };
};

type CalendarViewProps = {
  stats: Stats;
  weeklyChartData: Array<{
    day: string;
    Water: number;
    Sleep: number;
    Screen: number;
  }>;
  onDateSelect: (date: Date) => void;
};

const useHabitHistory = () => {
  // Initialize with empty history or load from localStorage
  const [historyData, setHistoryData] = useState<Record<string, {
    Water: number;
    Sleep: number;
    Screen: number;
  }>>(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('habitHistory');
      return savedHistory ? JSON.parse(savedHistory) : {};
    }
    return {}; // Return empty object for server-side rendering
  });

  // Save current stats to history
  const saveCurrentStats = useCallback((currentStats: Stats) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const todayData = {
        Water: currentStats.Water.current,
        Sleep: currentStats.Sleep.current,
        Screen: currentStats.Screen.current
      };

      setHistoryData(prevHistory => {
        const newHistory = {
          ...prevHistory,
          [today]: todayData
        };

        localStorage.setItem('habitHistory', JSON.stringify(newHistory));
        return newHistory;
      });
    }
  }, []);

  // Get stats for a specific date
  const getStatsForDate = useCallback((date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return historyData[dateKey] || null; // Add null fallback
  }, [historyData]);

  return { historyData, saveCurrentStats, getStatsForDate };
};

const CalendarView: React.FC<CalendarViewProps> = ({ stats, weeklyChartData, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dataSaved, setDataSaved] = useState(false);

  // Load history data from localStorage
  const [historyData, setHistoryData] = useState<Record<string, {
    Water: number;
    Sleep: number;
    Screen: number;
  }>>(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('habitHistory');
      return savedHistory ? JSON.parse(savedHistory) : {};
    }
    return {}; // Return empty object for server-side rendering
  });

  useEffect(() => {
    generateCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, historyData, stats]);

  const generateCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get the first and last day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Calculate days from previous month to show
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    // Calculate total days to show in calendar
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = date.toISOString().split('T')[0];
      const savedData = historyData[dateKey];

      calendarDays.push({
        date,
        currentMonth: false,
        data: savedData || {
          Water: 0,
          Sleep: 0,
          Screen: 0
        }
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateToLocalString(date);
      const todayKey = formatDateToLocalString(new Date());
      const isToday = dateKey === todayKey;

      // Only use saved data or current stats for today
      let dayData;
      if (isToday) {
        // Use current stats for today
        dayData = {
          Water: stats.Water.current,
          Sleep: stats.Sleep.current,
          Screen: stats.Screen.current
        };
      } else {
        // Use saved data or empty data
        dayData = historyData[dateKey] || {
          Water: 0,
          Sleep: 0,
          Screen: 0
        };
      }

      calendarDays.push({
        date,
        currentMonth: true,
        data: dayData
      });
    }

    // Next month days to fill the calendar grid
    const totalCells = 42; // 6 rows x 7 columns
    const remainingCells = totalCells - calendarDays.length;

    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = date.toISOString().split('T')[0];
      const savedData = historyData[dateKey];

      calendarDays.push({
        date,
        currentMonth: false,
        data: savedData || {
          Water: 0,
          Sleep: 0,
          Screen: 0
        }
      });
    }

    setCalendarData(calendarDays);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleSaveStats = () => {
    // Use the selected date or today's date if we're editing today's data
    const dateKey = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const dateData = {
      Water: stats.Water.current,
      Sleep: stats.Sleep.current,
      Screen: stats.Screen.current
    };

    // Update history with the date's data
    const newHistory = {
      ...historyData,
      [dateKey]: dateData
    };

    setHistoryData(newHistory);
    localStorage.setItem('habitHistory', JSON.stringify(newHistory));

    setDataSaved(true);
    setTimeout(() => setDataSaved(false), 3000); // Hide after 3 seconds
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    onDateSelect(day.date);
  };

  const getHabitStatusColor = (category: StatCategory, value: number) => {
    const { goal } = stats[category];
    if (category === "Screen") {
      return value <= goal ? "bg-green-400" : value > goal * 1.5 ? "bg-red-400" : "bg-yellow-400";
    } else {
      return value >= goal ? "bg-green-400" : value >= goal * 0.7 ? "bg-yellow-400" : "bg-red-400";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Helper function to convert dates to local YYYY-MM-DD format for consistent comparisons
  const formatDateToLocalString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold">{formatDate(currentDate)}</h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 h-96">
        {calendarData.map((day, index) => (
          <div
            key={index}
            className={getDayClasses(day, selectedDate)}
            onClick={() => handleDateClick(day)}
          >
            <div className="flex justify-between mb-1">
              <span className={`text-sm ${day.currentMonth ? 'font-medium' : ''}`}>
                {day.date.getDate()}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Droplet size={12} className="text-blue-500" />
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full ${getHabitStatusColor("Water", day.data.Water)}`}
                    style={{ width: `${(day.data.Water / stats.Water.goal) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Moon size={12} className="text-purple-500" />
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full ${getHabitStatusColor("Sleep", day.data.Sleep)}`}
                    style={{ width: `${(day.data.Sleep / stats.Sleep.goal) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Monitor size={12} className="text-amber-500" />
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full ${getHabitStatusColor("Screen", day.data.Screen)}`}
                    style={{ width: `${day.data.Screen <= stats.Screen.goal ? 100 : (stats.Screen.goal / day.data.Screen) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Legend */}
      <div className="mt-4 text-sm flex justify-center space-x-8">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
          <span>Goal met</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
          <span>Near goal</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div>
          <span>Below goal</span>
        </div>
      </div>
    </div>
  );
};

const getDayClasses = (day: CalendarDay, selectedDate: Date | null) => {
  let classes = "h-full p-2 border border-gray-200 overflow-hidden cursor-pointer";

  // Create a reference to today that uses the same date format for comparison
  const today = new Date();
  const todayFormatted = formatDateToLocalString(today);
  const dayFormatted = formatDateToLocalString(day.date);

  if (!day.currentMonth) {
    classes += " bg-gray-50 text-gray-400";
  } else if (dayFormatted === todayFormatted) {
    classes += " bg-blue-50 border-blue-300";
  }

  if (selectedDate && dayFormatted === formatDateToLocalString(selectedDate)) {
    classes += " ring-2 ring-blue-500";
  }

  return classes;
};



export default function Home() {
  // State management
  const [stats, setStats] = useState<Stats>({
    Water: {
      current: 6, goal: 8, unit: "glasses", icon: <Droplet size={24} />,
      streakDays: 5, color: "#3b82f6"
    },
    Sleep: {
      current: 7, goal: 8, unit: "hours", icon: <Moon size={24} />,
      streakDays: 12, color: "#8b5cf6"
    },
    Screen: {
      current: 3, goal: 2, unit: "hours", icon: <Monitor size={24} />,
      streakDays: 0, color: "#f59e0b"
    },
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const { historyData, saveCurrentStats, getStatsForDate } = useHabitHistory();
  const [dataSaved, setDataSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [notifications, setNotifications] = useState([
    { id: 1, message: "You achieved your sleep goal yesterday!", category: "Sleep", time: "2h ago", read: false },
    { id: 2, message: "Don't forget to drink water today", category: "Water", time: "5h ago", read: false },
  ]);

  // Helper function to format dates consistently for comparison
  const formatDateToLocalString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // THEN continue with the rest of the functions



  // THEN continue with the rest of the functions

  const handleSaveStats = () => {
    saveCurrentStats({
      ...stats,
      Water: { ...stats.Water, current: stats.Water.current },
      Sleep: { ...stats.Sleep, current: stats.Sleep.current },
      Screen: { ...stats.Screen, current: stats.Screen.current }
    });

    setDataSaved(true);
    setTimeout(() => setDataSaved(false), 3000);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);

    // Format dates consistently for comparison - ensure we're only comparing the date part
    const selectedDateStr = formatDateToLocalString(date);
    const todayStr = formatDateToLocalString(new Date());

    console.log('Selected date:', selectedDateStr);
    console.log('Today date:', todayStr);

    // Check if selected date is today
    if (selectedDateStr === todayStr) {
      // If today is selected, just use the current stats
      return;
    }

    // For other days, load from history if available
    const savedData = getStatsForDate(date);
    if (savedData) {
      setStats(prev => ({
        Water: { ...prev.Water, current: savedData.Water },
        Sleep: { ...prev.Sleep, current: savedData.Sleep },
        Screen: { ...prev.Screen, current: savedData.Screen },
      }));
    } else {
      // Reset to zero or default values for days with no data
      setStats(prev => ({
        Water: { ...prev.Water, current: 0 },
        Sleep: { ...prev.Sleep, current: 0 },
        Screen: { ...prev.Screen, current: 0 },
      }));
    }
  };

  const handleActivityUpdate = (category: StatCategory, value: number) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        [category]: { ...prev[category], current: value },
      };

      // Save to localStorage for any date (not just today)
      setTimeout(() => {
        // Format the date for localStorage key
        const dateKey = selectedDate.toISOString().split('T')[0];

        // Create entry for this date in history
        const historyEntry = {
          Water: category === 'Water' ? value : prev.Water.current,
          Sleep: category === 'Sleep' ? value : prev.Sleep.current,
          Screen: category === 'Screen' ? value : prev.Screen.current
        };

        // Get current history
        const savedHistory = localStorage.getItem('habitHistory');
        const history = savedHistory ? JSON.parse(savedHistory) : {};

        // Update history with new data
        history[dateKey] = historyEntry;

        // Save back to localStorage
        localStorage.setItem('habitHistory', JSON.stringify(history));
      }, 300);

      return newStats;
    });
  };

  const incrementActivity = (category: StatCategory) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        [category]: { ...prev[category], current: prev[category].current + 1 },
      };

      const selectedDateKey = selectedDate.toISOString().split('T')[0];
      const todayKey = new Date().toISOString().split('T')[0];

      if (selectedDateKey === todayKey) {
        setTimeout(() => saveCurrentStats(newStats), 300);
      }

      return newStats;
    });
  };

  const decrementActivity = (category: StatCategory) => {
    if (stats[category].current > 0) {
      setStats(prev => {
        const newStats = {
          ...prev,
          [category]: { ...prev[category], current: prev[category].current - 1 },
        };

        const selectedDateKey = selectedDate.toISOString().split('T')[0];
        const todayKey = new Date().toISOString().split('T')[0];

        if (selectedDateKey === todayKey) {
          setTimeout(() => saveCurrentStats(newStats), 300);
        }

        return newStats;
      });
    }
  };

  // Function to get progress percentage
  const getProgressPercentage = (category: StatCategory) => {
    const { current, goal } = stats[category];
    return category === "Screen"
      ? (current <= goal ? 100 : (goal / current) * 100)
      : (current / goal) * 100;
  };

  const achievements = [
    { id: 1, title: "Water Champion", description: "Reach water goal for 7 days", category: "Water", progress: 71 },
    { id: 2, title: "Sleep Master", description: "Reach sleep goal for 14 days", category: "Sleep", progress: 85 },
    { id: 3, title: "Digital Detox", description: "Stay under screen time goal for 5 days", category: "Screen", progress: 20 },
  ];

  const weeklyChartData = [
    { day: 'Mon', Water: 5, Sleep: 6, Screen: 4 },
    { day: 'Tue', Water: 6, Sleep: 7, Screen: 3 },
    { day: 'Wed', Water: 7, Sleep: 7.5, Screen: 3.5 },
    { day: 'Thu', Water: 8, Sleep: 8, Screen: 2 },
    { day: 'Fri', Water: 7, Sleep: 7, Screen: 3 },
    { day: 'Sat', Water: 6, Sleep: 8, Screen: 4 },
    { day: 'Sun', Water: 6, Sleep: 7, Screen: 3 },
  ];

  const dailyProgressData = [
    { name: "Water", value: (stats.Water.current / stats.Water.goal) * 100 },
    { name: "Sleep", value: (stats.Sleep.current / stats.Sleep.goal) * 100 },
    { name: "Screen", value: stats.Screen.current <= stats.Screen.goal ? 100 : (stats.Screen.goal / stats.Screen.current) * 100 },
  ];

  const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b"];

  // Rest of the component content...

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans relative">
      {/* Navbar */}
      <nav className="bg-white shadow p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600 flex items-center">
            <Award className="mr-2" size={24} />
            HabitWise
          </h1>
          <div className="flex items-center space-x-4">
            <button
              className={`p-2 rounded-full hover:bg-gray-100 transition ${selectedTab === "dashboard" ? "text-blue-600" : ""}`}
              onClick={() => setSelectedTab("dashboard")}
            >
              <TrendingUp size={22} />
            </button>
            <button
              className={`p-2 rounded-full hover:bg-gray-100 transition ${selectedTab === "calendar" ? "text-blue-600" : ""}`}
              onClick={() => setSelectedTab("calendar")}
            >
              <Calendar size={22} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={22} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-4 top-16 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(notification => (
              <div key={notification.id} className={`p-3 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute right-4 top-16 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-semibold">Settings</h3>
            <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notifications</label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Reminders</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>
          <div className="p-3 border-t bg-gray-50">
            <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto pb-16">
        {selectedTab === "dashboard" && (
          <>
            {/* Hero Banner */}
            <section className="text-center py-12 bg-gradient-to-b from-blue-50 to-white px-4">
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, Alex!
              </h2>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                You're making great progress on your habits.
              </p>
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <Award className="mr-2" size={16} />
                Current streak: {Math.max(...Object.values(stats).map(s => s.streakDays))} days
              </div>
            </section>

            {/* Quick Stats */}
            <section className="max-w-5xl mx-auto px-4 py-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp size={20} className="mr-2" />
                Today's Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["Water", "Sleep", "Screen"] as StatCategory[]).map((category) => (
                  <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                            style={{ backgroundColor: `${stats[category].color}15` }}>
                            <span style={{ color: stats[category].color }}>{stats[category].icon}</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{category}</h4>
                            <div className="text-sm text-gray-500">
                              {category === "Screen" ? "Limit" : "Goal"}: {stats[category].goal} {stats[category].unit}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold">{stats[category].current}</div>
                          <div className="text-xs text-gray-500">{stats[category].unit}</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.min(getProgressPercentage(category), 100)}%`,
                              backgroundColor: stats[category].color,
                            }}>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-xs">
                          <span className="font-medium">{Math.round(getProgressPercentage(category))}%</span>
                          <span className="text-gray-500">Streak: {stats[category].streakDays} days</span>
                        </div>
                      </div>

                      {/* Quick add/remove buttons */}
                      <div className="mt-3 flex justify-between items-center">
                        <button onClick={() => decrementActivity(category)}
                          className="w-12 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50">
                          -
                        </button>
                        <span className="text-sm">Update {category}</span>
                        <button onClick={() => incrementActivity(category)}
                          className="w-12 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50">
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Weekly Progress Charts */}
            <section className="max-w-5xl mx-auto px-4 py-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <TrendingUp size={20} className="mr-2" />
                Weekly Progress
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="Water" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Sleep" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Screen" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Goal Completion / Pie Chart */}
            <section className="max-w-5xl mx-auto px-4 py-6">
              <h3 className="text-xl font-semibold mb-4">Goal Completion Rate</h3>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <h4 className="text-lg font-medium mb-3 text-center">Daily Progress</h4>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dailyProgressData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${Math.round(value)}%`}
                      >
                        {dailyProgressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${Math.round(Number(value))}%`, 'Completion']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Streak & Achievements */}
            <section className="max-w-5xl mx-auto px-4 py-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Award size={20} className="mr-2" />
                Achievements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-300">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <div className="mt-2">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500"
                          style={{ width: `${achievement.progress}%` }}>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-right text-gray-500">
                        {achievement.progress}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Daily Check-In */}
            <section className="max-w-5xl mx-auto px-4 py-6">
              <h3 className="text-xl font-semibold mb-4">Daily Check-In</h3>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(["Water", "Sleep", "Screen"] as StatCategory[]).map((category) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium flex items-center">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                            style={{ backgroundColor: `${stats[category].color}15`, color: stats[category].color }}>
                            {stats[category].icon}
                          </span>
                          {category} Today
                        </label>
                        <span className="text-sm font-medium">
                          {stats[category].current} / {stats[category].goal} {stats[category].unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={category === "Screen" ? 12 : 16}
                        step={category === "Sleep" ? 0.5 : 1}
                        value={stats[category].current}
                        onChange={(e) => handleActivityUpdate(category, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, ${stats[category].color} 0%, ${stats[category].color} ${(stats[category].current / (category === "Screen" ? 12 : 16)) * 100
                            }%, #e5e7eb ${(stats[category].current / (category === "Screen" ? 12 : 16)) * 100
                            }%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                  ))}
                </div>
                {/* Submit button for saving today's data */}
                <div className="mt-6 text-center">
                  <button
                    onClick={handleSaveStats}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
                  >
                    Save Today's Progress
                  </button>
                  {dataSaved && (
                    <div className="mt-2 text-green-600 flex items-center justify-center">
                      <Award size={16} className="mr-1" />
                      Data saved successfully!
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="text-center py-6 text-gray-400 text-sm border-t mt-8">
              © 2025 HabitWise. All rights reserved.
            </footer>
          </>
        )}

        {selectedTab === "calendar" && (
          <section className="max-w-5xl mx-auto px-4 py-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar size={20} className="mr-2" />
              Habit Calendar
            </h3>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg text-blue-800 text-sm">
              <p className="flex items-center">
                <Award size={16} className="mr-1" />
                Pro tip: Click on any day to view or edit that day's habits. Your data will automatically be saved.
              </p>
            </div>
            <CalendarView
              stats={stats}
              weeklyChartData={weeklyChartData}
              onDateSelect={handleDateSelect}
            />

            {/* Date detail view */}
            {/* Date detail view */}
            {selectedDate && (
              <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
                <h4 className="text-lg font-medium mb-4">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} Habits
                  {(() => {
                    const selectedDateKey = selectedDate.toISOString().split('T')[0];
                    const todayKey = new Date().toISOString().split('T')[0];
                    return selectedDateKey !== todayKey && (
                      <span className="text-sm text-gray-500 ml-2">(Viewing historical data)</span>
                    );
                  })()}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(["Water", "Sleep", "Screen"] as StatCategory[]).map((category) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium flex items-center">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                            style={{ backgroundColor: `${stats[category].color}15`, color: stats[category].color }}>
                            {stats[category].icon}
                          </span>
                          {category}
                        </label>
                        <span className="text-sm font-medium">
                          {stats[category].current} / {stats[category].goal} {stats[category].unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={category === "Screen" ? 12 : 16}
                        step={category === "Sleep" ? 0.5 : 1}
                        value={stats[category].current}
                        onChange={(e) => handleActivityUpdate(category, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, ${stats[category].color} 0%, ${stats[category].color} ${(stats[category].current / (category === "Screen" ? 12 : 16)) * 100
                            }%, #e5e7eb ${(stats[category].current / (category === "Screen" ? 12 : 16)) * 100
                            }%, #e5e7eb 100%)`
                        }}
                        disabled={(() => {
                          const selectedTime = selectedDate.getTime();
                          const todayTime = new Date().setHours(0, 0, 0, 0);

                          // Disable inputs for future dates
                          return selectedTime > todayTime;
                        })()}
                      />

                      {/* Only show quick add/remove buttons for today or past dates */}
                      {(() => {
                        const selectedDateStr = formatDateToLocalString(selectedDate);
                        const todayStr = formatDateToLocalString(new Date());

                        // Create date objects with time set to midnight for consistent comparison
                        const selectedDateOnly = new Date(selectedDate);
                        selectedDateOnly.setHours(0, 0, 0, 0);

                        const todayOnly = new Date();
                        todayOnly.setHours(0, 0, 0, 0);

                        // Only allow editing for today or past dates
                        const isEditableDate = selectedDateOnly <= todayOnly;

                        return isEditableDate && (
                          <div className="mt-3 flex justify-between items-center">
                            <button onClick={() => decrementActivity(category)}
                              className="w-12 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50">
                              -
                            </button>
                            <span className="text-sm">Update {category}</span>
                            <button onClick={() => incrementActivity(category)}
                              className="w-12 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50">
                              +
                            </button>
                          </div>
                        );
                      })()}
                      {/* Progress indicator */}
                      <div className="mt-2 text-xs text-gray-500">
                        {category === "Screen"
                          ? `${stats[category].current <= stats[category].goal ? "Within" : "Exceeding"} daily limit`
                          : `${Math.round((stats[category].current / stats[category].goal) * 100)}% of daily goal`
                        }
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Save button for historical dates (if implementing edit functionality) */}
                {(() => {
                  const selectedTime = selectedDate.getTime();
                  const todayTime = new Date().setHours(0, 0, 0, 0);

                  // Only show update button for past dates, not future dates
                  const isPastDate = selectedTime < todayTime;

                  return isPastDate && (
                    <div className="mt-6 text-center">
                      <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
                        onClick={handleSaveStats}
                      >
                        Update Historical Data
                      </button>
                      {dataSaved && (
                        <div className="mt-2 text-green-600 flex items-center justify-center">
                          <Award size={16} className="mr-1" />
                          Data saved successfully!
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}