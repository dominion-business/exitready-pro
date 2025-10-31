import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, Edit2, Trash2, Filter, ChevronDown, Calendar, Flag, List, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import GanttChart from '../components/GanttChart';
import TaskDetailModal from '../components/TaskDetailModal';

const TaskManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [intangibleCapitalFilter, setIntangibleCapitalFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [questionFilter, setQuestionFilter] = useState(location.state?.questionId || '');
  const [showNotRelevant, setShowNotRelevant] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'gantt'
  const [showFilters, setShowFilters] = useState(true);
  const [calendarPeriod, setCalendarPeriod] = useState('month'); // '5day', '7day', 'month', '3month', '6month'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // Selected date for viewing tasks
  const [selectedTask, setSelectedTask] = useState(null); // Selected task for detail view

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [filter, priorityFilter, activityTypeFilter, intangibleCapitalFilter, dueDateFilter, questionFilter, showNotRelevant]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/tasks';

      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (questionFilter) params.append('question_id', questionFilter);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        let filteredTasks = response.data.tasks;

        // Filter out "not_relevant" tasks from "all" filter unless checkbox is checked
        if (filter === 'all' && !showNotRelevant) {
          filteredTasks = filteredTasks.filter(task => task.status !== 'not_relevant');
        }

        // Apply priority filter
        if (priorityFilter !== 'all') {
          filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        // Apply activity type filter
        if (activityTypeFilter !== 'all') {
          filteredTasks = filteredTasks.filter(task =>
            task.question && task.question.activity_type === activityTypeFilter
          );
        }

        // Apply intangible capital filter
        if (intangibleCapitalFilter !== 'all') {
          filteredTasks = filteredTasks.filter(task =>
            task.question && task.question.intangible_asset_type === intangibleCapitalFilter
          );
        }

        // Apply due date filter
        if (dueDateFilter !== 'all') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          filteredTasks = filteredTasks.filter(task => {
            if (!task.due_date) {
              return dueDateFilter === 'no_date';
            }

            const dueDate = new Date(task.due_date);
            dueDate.setHours(0, 0, 0, 0);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            switch (dueDateFilter) {
              case 'overdue':
                return diffDays < 0;
              case 'today':
                return diffDays === 0;
              case 'next_7_days':
                return diffDays >= 0 && diffDays <= 7;
              case 'next_30_days':
                return diffDays >= 0 && diffDays <= 30;
              case 'next_90_days':
                return diffDays >= 0 && diffDays <= 90;
              case 'beyond_90_days':
                return diffDays > 90;
              case 'no_date':
                return false;
              default:
                return true;
            }
          });
        }

        setTasks(filteredTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/tasks/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus, dueDate = null) => {
    try {
      const token = localStorage.getItem('token');
      const updateData = { status: newStatus };
      if (dueDate !== null) {
        updateData.due_date = dueDate;
      }
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const updateTaskPriority = async (taskId, newPriority) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`,
        { priority: newPriority },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Error updating task priority:', error);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Gantt chart task update handler
  const handleGanttTaskUpdate = async ({ taskId, updates }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Error updating task from Gantt:', error);
    }
  };

  // Unified task update handler for modal
  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${taskId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="text-green-600" size={20} />;
      case 'in_progress':
        return <Clock className="text-blue-600" size={20} />;
      case 'under_review':
        return <AlertCircle className="text-purple-600" size={20} />;
      case 'not_relevant':
        return <Circle className="text-gray-300" size={20} />;
      default:
        return <Circle className="text-gray-400" size={20} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'under_review':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'not_relevant':
        return 'bg-gray-100 text-gray-500 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Calendar Navigation Functions
  const navigateCalendar = (direction) => {
    const newDate = new Date(calendarDate);

    switch (calendarPeriod) {
      case '5day':
      case '7day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case '3month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        break;
      case '6month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 6 : -6));
        break;
      default:
        break;
    }

    setCalendarDate(newDate);
  };

  // Calendar View Helper Functions
  const getCalendarData = () => {
    const today = new Date();
    const referenceDate = new Date(calendarDate);

    switch (calendarPeriod) {
      case '5day': {
        // Show 5-day work week (Mon-Fri)
        const currentDay = referenceDate.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() + mondayOffset);

        const days = [];
        for (let i = 0; i < 5; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayTasks = tasks.filter(task => task.due_date === dateStr);

          days.push({
            date: new Date(currentDate),
            dateStr: dateStr,
            isCurrentMonth: true,
            isToday: currentDate.toDateString() === today.toDateString(),
            tasks: dayTasks
          });
        }

        return {
          type: '5day',
          days: [days],
          title: `${startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${days[4].date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
        };
      }

      case '7day': {
        // Show 7-day week (Sun-Sat)
        const currentDay = referenceDate.getDay();
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - currentDay);

        const days = [];
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayTasks = tasks.filter(task => task.due_date === dateStr);

          days.push({
            date: new Date(currentDate),
            dateStr: dateStr,
            isCurrentMonth: true,
            isToday: currentDate.toDateString() === today.toDateString(),
            tasks: dayTasks
          });
        }

        return {
          type: '7day',
          days: [days],
          title: `${startDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${days[6].date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
        };
      }

      case 'month': {
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const weeks = [];
        let currentDate = new Date(startDate);

        while (currentDate <= lastDay || currentDate.getDay() !== 0) {
          const week = [];
          for (let i = 0; i < 7; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayTasks = tasks.filter(task => task.due_date === dateStr);

            week.push({
              date: new Date(currentDate),
              dateStr: dateStr,
              isCurrentMonth: currentDate.getMonth() === month,
              isToday: currentDate.toDateString() === today.toDateString(),
              tasks: dayTasks
            });

            currentDate.setDate(currentDate.getDate() + 1);
          }
          weeks.push(week);

          if (currentDate > lastDay && currentDate.getDay() === 0) break;
        }

        return {
          type: 'month',
          weeks: weeks,
          title: firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })
        };
      }

      case '3month': {
        const startMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        const months = [];

        for (let m = 0; m < 3; m++) {
          const monthDate = new Date(startMonth);
          monthDate.setMonth(startMonth.getMonth() + m);

          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);

          const weeks = [];
          let currentDate = new Date(firstDay);
          currentDate.setDate(currentDate.getDate() - firstDay.getDay());

          while (currentDate <= lastDay || currentDate.getDay() !== 0) {
            const week = [];
            for (let i = 0; i < 7; i++) {
              const dateStr = currentDate.toISOString().split('T')[0];
              const dayTasks = tasks.filter(task => task.due_date === dateStr);

              week.push({
                date: new Date(currentDate),
                dateStr: dateStr,
                isCurrentMonth: currentDate.getMonth() === month,
                isToday: currentDate.toDateString() === today.toDateString(),
                tasks: dayTasks
              });

              currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(week);

            if (currentDate > lastDay && currentDate.getDay() === 0) break;
          }

          months.push({
            weeks: weeks,
            title: firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })
          });
        }

        return {
          type: '3month',
          months: months,
          title: `${months[0].title} - ${months[2].title}`
        };
      }

      case '6month': {
        const startMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        const months = [];

        for (let m = 0; m < 6; m++) {
          const monthDate = new Date(startMonth);
          monthDate.setMonth(startMonth.getMonth() + m);

          const year = monthDate.getFullYear();
          const month = monthDate.getMonth();
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);

          const weeks = [];
          let currentDate = new Date(firstDay);
          currentDate.setDate(currentDate.getDate() - firstDay.getDay());

          while (currentDate <= lastDay || currentDate.getDay() !== 0) {
            const week = [];
            for (let i = 0; i < 7; i++) {
              const dateStr = currentDate.toISOString().split('T')[0];
              const dayTasks = tasks.filter(task => task.due_date === dateStr);

              week.push({
                date: new Date(currentDate),
                dateStr: dateStr,
                isCurrentMonth: currentDate.getMonth() === month,
                isToday: currentDate.toDateString() === today.toDateString(),
                tasks: dayTasks
              });

              currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(week);

            if (currentDate > lastDay && currentDate.getDay() === 0) break;
          }

          months.push({
            weeks: weeks,
            title: firstDay.toLocaleString('default', { month: 'short' })
          });
        }

        return {
          type: '6month',
          months: months,
          title: `${months[0].title} - ${months[5].title} ${referenceDate.getFullYear()}`
        };
      }

      default:
        return { type: 'month', weeks: [], title: '' };
    }
  };

  // Gantt View Helper Functions
  const getGanttData = () => {
    const tasksWithDates = tasks.filter(task => task.due_date || task.created_at);

    if (tasksWithDates.length === 0) return { tasks: [], startDate: new Date(), endDate: new Date(), totalDays: 0 };

    let minDate = new Date();
    let maxDate = new Date();

    tasksWithDates.forEach(task => {
      const createdDate = new Date(task.created_at);
      const dueDate = task.due_date ? new Date(task.due_date) : new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (createdDate < minDate) minDate = createdDate;
      if (dueDate > maxDate) maxDate = dueDate;
    });

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

    return {
      tasks: tasksWithDates.map(task => {
        const createdDate = new Date(task.created_at);
        const dueDate = task.due_date ? new Date(task.due_date) : new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const startOffset = Math.ceil((createdDate - minDate) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((dueDate - createdDate) / (1000 * 60 * 60 * 24)) + 1;

        return {
          ...task,
          startDate: createdDate,
          endDate: dueDate,
          startOffset,
          duration
        };
      }),
      startDate: minDate,
      endDate: maxDate,
      totalDays
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header with Inline Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <CheckCircle2 className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Task Manager</h1>
                <p className="text-blue-100 text-sm mt-0.5">Track and manage your improvement tasks</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/gap-analysis')}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition font-medium border border-white/30"
            >
              ← Back to Gap Analysis
            </button>
          </div>

          {/* Inline Compact Stats - High Contrast */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-white/25 backdrop-blur-md rounded-lg p-3 border-2 border-white/40 shadow-lg">
                <p className="text-xs text-white font-bold mb-1">Total</p>
                <p className="text-2xl font-extrabold text-white drop-shadow-md">{stats.total}</p>
              </div>
              <div className="bg-white/25 backdrop-blur-md rounded-lg p-3 border-2 border-red-200/50 shadow-lg">
                <p className="text-xs text-white font-bold mb-1">Not Started</p>
                <p className="text-2xl font-extrabold text-white drop-shadow-md">{stats.not_started}</p>
              </div>
              <div className="bg-white/25 backdrop-blur-md rounded-lg p-3 border-2 border-blue-200/50 shadow-lg">
                <p className="text-xs text-white font-bold mb-1">In Progress</p>
                <p className="text-2xl font-extrabold text-white drop-shadow-md">{stats.in_progress}</p>
              </div>
              <div className="bg-white/25 backdrop-blur-md rounded-lg p-3 border-2 border-purple-200/50 shadow-lg">
                <p className="text-xs text-white font-bold mb-1">Review</p>
                <p className="text-2xl font-extrabold text-white drop-shadow-md">{stats.under_review}</p>
              </div>
              <div className="bg-white/25 backdrop-blur-md rounded-lg p-3 border-2 border-green-200/50 shadow-lg">
                <p className="text-xs text-white font-bold mb-1">Completed</p>
                <p className="text-2xl font-extrabold text-white drop-shadow-md">{stats.completed}</p>
              </div>
              <div className="bg-white/25 backdrop-blur-md rounded-lg p-3 border-2 border-gray-200/50 shadow-lg">
                <p className="text-xs text-white font-bold mb-1">Not Relevant</p>
                <p className="text-2xl font-extrabold text-white drop-shadow-md">{stats.not_relevant}</p>
              </div>
              <div className="bg-white/30 backdrop-blur-md rounded-lg p-3 border-2 border-white/60 shadow-xl">
                <p className="text-xs text-white font-bold mb-1">Completion</p>
                <p className="text-2xl font-extrabold text-white drop-shadow-md">{stats.completion_rate}%</p>
                <p className="text-xs text-white font-semibold">{stats.completed}/{stats.relevant_tasks}</p>
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle - Compact */}
        <div className="bg-white rounded-xl shadow-md p-3 mb-4">
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <List size={18} />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar size={18} />
              <span>Calendar View</span>
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === 'gantt'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={18} />
              <span>Gantt View</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filters */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition"
          >
            <div className="flex items-center gap-3">
              <Filter size={22} className="text-blue-600" />
              <span className="font-bold text-gray-900 text-lg">Filters</span>
              {(filter !== 'all' || priorityFilter !== 'all' || activityTypeFilter !== 'all' || intangibleCapitalFilter !== 'all' || dueDateFilter !== 'all') && (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">Active</span>
              )}
            </div>
            <ChevronRight
              size={20}
              className={`text-gray-600 transition-transform ${showFilters ? 'rotate-90' : ''}`}
            />
          </button>

          {showFilters && (
            <div className="p-4 space-y-3 border-t border-gray-200">
              {/* Status Filter - Extra Compact */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[60px]">Status:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'not_started', 'in_progress', 'under_review', 'completed', 'not_relevant'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        filter === status
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter - Extra Compact */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[60px]">Priority:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'high', 'medium', 'low'].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setPriorityFilter(priority)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        priorityFilter === priority
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Type Filter - Extra Compact */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[60px]">Activity:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'De-Risking Activity', 'Strategy Activity', 'Efficiency Activity', 'Growth Activity', 'Culture Activity'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setActivityTypeFilter(type)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        activityTypeFilter === type
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'all' ? 'All' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intangible Capital Type Filter - Extra Compact */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[60px]">Capital:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'Human', 'Structural', 'Customer', 'Social', 'Revenue & Profitability'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setIntangibleCapitalFilter(type)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        intangibleCapitalFilter === type
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'all' ? 'All' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date Filter - Extra Compact */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[60px]">Due Date:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'today', label: 'Today' },
                    { value: 'next_7_days', label: '7d' },
                    { value: 'next_30_days', label: '30d' },
                    { value: 'next_90_days', label: '90d' },
                    { value: 'beyond_90_days', label: '90d+' },
                    { value: 'no_date', label: 'No Date' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDueDateFilter(value)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                        dueDateFilter === value
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

          {/* Show Not Relevant Checkbox */}
              {filter === 'all' && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="showNotRelevant"
                    checked={showNotRelevant}
                    onChange={(e) => setShowNotRelevant(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                  />
                  <label htmlFor="showNotRelevant" className="text-sm text-gray-700 font-medium cursor-pointer">
                    Show "Not Relevant" tasks
                  </label>
                </div>
              )}

              {questionFilter && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-sm text-purple-700 font-medium">
                    Filtering by question: {questionFilter}
                  </span>
                  <button
                    onClick={() => setQuestionFilter('')}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {viewMode === 'list' ? 'Tasks' : viewMode === 'calendar' ? 'Calendar View' : 'Gantt Chart'}
            </h2>
            <span className="text-sm text-gray-600">{tasks.length} tasks</span>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">No tasks found</p>
              <p className="text-gray-500 text-sm mt-2">Tasks will be automatically created based on your gap assessment responses</p>
            </div>
          ) : (
            <>
              {/* LIST VIEW */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition bg-white cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      {/* Task Header - Title and Actions */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getStatusIcon(task.status)}
                          <h3 className={`text-base font-semibold truncate ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                        </div>
                        {!task.is_system_task && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition flex-shrink-0"
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Task Details - Compact Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Status */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 font-medium">Status:</span>
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 px-2 py-1 rounded text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-blue-400 ${getStatusColor(task.status)}`}
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="under_review">Under Review</option>
                            <option value="completed">Completed</option>
                            <option value="not_relevant">Not Relevant</option>
                          </select>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 font-medium">Priority:</span>
                          <select
                            value={task.priority}
                            onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 px-2 py-1 rounded text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-blue-400 ${getPriorityColor(task.priority)}`}
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Due:</span>
                          <input
                            type="date"
                            value={task.due_date || ''}
                            onChange={(e) => updateTaskStatus(task.id, task.status, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task.id, task.status, '');
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition whitespace-nowrap"
                            title="Clear due date"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Quick Date Buttons */}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-500">Quick:</span>
                        <button
                          onClick={() => {
                            const date = new Date();
                            date.setDate(date.getDate() + 7);
                            updateTaskStatus(task.id, task.status, date.toISOString().split('T')[0]);
                          }}
                          className="px-2 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition"
                        >
                          7d
                        </button>
                        <button
                          onClick={() => {
                            const date = new Date();
                            date.setMonth(date.getMonth() + 1);
                            updateTaskStatus(task.id, task.status, date.toISOString().split('T')[0]);
                          }}
                          className="px-2 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition"
                        >
                          1m
                        </button>
                        <button
                          onClick={() => {
                            const date = new Date();
                            date.setMonth(date.getMonth() + 3);
                            updateTaskStatus(task.id, task.status, date.toISOString().split('T')[0]);
                          }}
                          className="px-2 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition"
                        >
                          3m
                        </button>
                        <button
                          onClick={() => {
                            const date = new Date();
                            date.setMonth(date.getMonth() + 6);
                            updateTaskStatus(task.id, task.status, date.toISOString().split('T')[0]);
                          }}
                          className="px-2 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition"
                        >
                          6m
                        </button>
                      </div>

                      {/* Question Tags (if available) */}
                      {task.question && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                            <span className="font-semibold mr-1">Category:</span> {task.question.category_display}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            <span className="font-semibold mr-1">Theme:</span> {task.question.subject}
                          </span>
                          {task.question.activity_type && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                              <span className="font-semibold mr-1">Activity Type:</span> {task.question.activity_type}
                            </span>
                          )}
                          {task.question.intangible_asset_type && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                              <span className="font-semibold mr-1">Intangible Capital:</span> {task.question.intangible_asset_type}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* CALENDAR VIEW */}
              {viewMode === 'calendar' && (() => {
                const calendarData = getCalendarData();

                // Render task cell based on view type
                const renderTaskCell = (day, sizeClass, maxTasks) => (
                  <div
                    key={day.dateStr}
                    className={`${sizeClass} p-2 rounded-lg border-2 transition cursor-pointer ${
                      selectedDate === day.dateStr
                        ? 'bg-indigo-100 border-indigo-500 shadow-lg'
                        : day.isToday
                        ? 'bg-blue-50 border-blue-400 shadow-md'
                        : day.isCurrentMonth
                        ? 'bg-white border-gray-200 hover:border-blue-300'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                    onClick={() => setSelectedDate(day.dateStr)}
                  >
                    <div className={`text-sm font-semibold mb-1 ${
                      selectedDate === day.dateStr ? 'text-indigo-700' :
                      day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {calendarPeriod === '5day' || calendarPeriod === '7day'
                        ? day.date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })
                        : day.date.getDate()
                      }
                    </div>

                    <div className="space-y-1">
                      {day.tasks.slice(0, maxTasks).map(task => (
                        <div
                          key={task.id}
                          className={`text-xs p-1.5 rounded cursor-pointer hover:shadow-md hover:scale-105 transition ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            task.status === 'under_review' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                            task.status === 'not_relevant' ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' :
                            'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={task.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span className="truncate font-medium">{task.title}</span>
                          </div>
                        </div>
                      ))}
                      {day.tasks.length > maxTasks && (
                        <div className="text-xs text-gray-600 font-medium pl-1.5">
                          +{day.tasks.length - maxTasks} more
                        </div>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div className="space-y-4">
                    {/* Calendar Controls */}
                    <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                      <button
                        onClick={() => navigateCalendar('prev')}
                        className="p-2 bg-white hover:bg-blue-50 rounded-lg shadow-sm transition"
                      >
                        <ChevronLeft size={24} className="text-blue-600" />
                      </button>

                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold text-gray-900">{calendarData.title}</h3>
                          <button
                            onClick={() => {
                              setCalendarDate(new Date());
                              setSelectedDate(null);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md transition"
                          >
                            Today
                          </button>
                        </div>
                        <div className="flex gap-2">
                          {['5day', '7day', 'month', '3month', '6month'].map(period => (
                            <button
                              key={period}
                              onClick={() => setCalendarPeriod(period)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                calendarPeriod === period
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-white text-gray-700 hover:bg-blue-50'
                              }`}
                            >
                              {period === '5day' ? '5 Day Week' :
                               period === '7day' ? '7 Day Week' :
                               period === 'month' ? 'Month' :
                               period === '3month' ? '3 Months' :
                               '6 Months'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => navigateCalendar('next')}
                        className="p-2 bg-white hover:bg-blue-50 rounded-lg shadow-sm transition"
                      >
                        <ChevronRight size={24} className="text-blue-600" />
                      </button>
                    </div>

                    {/* 5-Day or 7-Day Week View */}
                    {(calendarData.type === '5day' || calendarData.type === '7day') && (
                      <div className={`grid ${calendarData.type === '5day' ? 'grid-cols-5' : 'grid-cols-7'} gap-3`}>
                        {calendarData.days[0].map(day => renderTaskCell(day, 'min-h-[200px]', 8))}
                      </div>
                    )}

                    {/* Single Month View */}
                    {calendarData.type === 'month' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-7 gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-semibold text-gray-700 py-2">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {calendarData.weeks.map((week, weekIdx) => (
                            week.map((day, dayIdx) => (
                              <React.Fragment key={`${weekIdx}-${dayIdx}`}>
                                {renderTaskCell(day, 'min-h-[120px]', 3)}
                              </React.Fragment>
                            ))
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3-Month View */}
                    {calendarData.type === '3month' && (
                      <div className="grid grid-cols-3 gap-4">
                        {calendarData.months.map((monthData, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="text-center font-bold text-gray-800 mb-3">{monthData.title}</h4>
                            <div className="grid grid-cols-7 gap-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="text-center text-xs font-semibold text-gray-600">
                                  {day}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 mt-1">
                              {monthData.weeks.map((week, weekIdx) => (
                                week.map((day, dayIdx) => (
                                  <React.Fragment key={`${idx}-${weekIdx}-${dayIdx}`}>
                                    {renderTaskCell(day, 'min-h-[60px]', 1)}
                                  </React.Fragment>
                                ))
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 6-Month View */}
                    {calendarData.type === '6month' && (
                      <div className="grid grid-cols-3 gap-3">
                        {calendarData.months.map((monthData, idx) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded-lg">
                            <h4 className="text-center font-semibold text-gray-800 mb-2 text-sm">{monthData.title}</h4>
                            <div className="grid grid-cols-7 gap-0.5">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="text-center text-xs font-semibold text-gray-600">
                                  {day}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5 mt-1">
                              {monthData.weeks.map((week, weekIdx) => (
                                week.map((day, dayIdx) => (
                                  <div
                                    key={`${idx}-${weekIdx}-${dayIdx}`}
                                    className={`min-h-[40px] p-1 rounded text-xs ${
                                      day.isToday
                                        ? 'bg-blue-100 border border-blue-400 font-bold'
                                        : day.isCurrentMonth
                                        ? 'bg-white'
                                        : 'bg-gray-100 text-gray-400'
                                    } ${day.tasks.length > 0 ? 'border-2 border-indigo-400' : ''}`}
                                  >
                                    <div className={`text-center ${day.isToday ? 'text-blue-600' : ''}`}>
                                      {day.date.getDate()}
                                    </div>
                                    {day.tasks.length > 0 && (
                                      <div className="text-center text-xs font-bold text-indigo-600">
                                        {day.tasks.length}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Selected Date Tasks Panel */}
                    {selectedDate && (() => {
                      const selectedDateTasks = tasks.filter(task => task.due_date === selectedDate);
                      const dateObj = new Date(selectedDate + 'T00:00:00');

                      return (
                        <div className="mt-6 bg-white border-2 border-indigo-300 rounded-xl p-6 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                              Tasks for {dateObj.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </h3>
                            <button
                              onClick={() => setSelectedDate(null)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                            >
                              Clear Selection
                            </button>
                          </div>

                          {selectedDateTasks.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No tasks scheduled for this date</p>
                          ) : (
                            <div className="space-y-3">
                              {selectedDateTasks.map(task => (
                                <div
                                  key={task.id}
                                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                                  onClick={() => setSelectedTask(task)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="mt-1">
                                        {getStatusIcon(task.status)}
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                        {task.description && (
                                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                                            {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                          </span>
                                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* Task Detail Modal */}
              {selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      {/* Modal Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(selectedTask.status)}
                          </div>
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
                            {selectedTask.question && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm font-medium">
                                  {selectedTask.question.category_display}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {selectedTask.question.subject}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedTask(null)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          <AlertCircle size={24} className="text-gray-400" />
                        </button>
                      </div>

                      {/* Task Details */}
                      <div className="space-y-4">
                        {selectedTask.description && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                            <p className="text-gray-600">{selectedTask.description}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
                            <select
                              value={selectedTask.status}
                              onChange={(e) => {
                                updateTaskStatus(selectedTask.id, e.target.value);
                                setSelectedTask({ ...selectedTask, status: e.target.value });
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(selectedTask.status)}`}
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="under_review">Under Review</option>
                              <option value="completed">Completed</option>
                              <option value="not_relevant">Not Relevant</option>
                            </select>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Priority</h3>
                            <select
                              value={selectedTask.priority}
                              onChange={(e) => {
                                updateTaskPriority(selectedTask.id, e.target.value);
                                setSelectedTask({ ...selectedTask, priority: e.target.value });
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(selectedTask.priority)}`}
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Due Date</h3>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={selectedTask.due_date || ''}
                              onChange={(e) => {
                                updateTaskStatus(selectedTask.id, selectedTask.status, e.target.value);
                                setSelectedTask({ ...selectedTask, due_date: e.target.value });
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const date = new Date();
                                  date.setDate(date.getDate() + 7);
                                  const dateStr = date.toISOString().split('T')[0];
                                  updateTaskStatus(selectedTask.id, selectedTask.status, dateStr);
                                  setSelectedTask({ ...selectedTask, due_date: dateStr });
                                }}
                                className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition"
                              >
                                7d
                              </button>
                              <button
                                onClick={() => {
                                  const date = new Date();
                                  date.setMonth(date.getMonth() + 1);
                                  const dateStr = date.toISOString().split('T')[0];
                                  updateTaskStatus(selectedTask.id, selectedTask.status, dateStr);
                                  setSelectedTask({ ...selectedTask, due_date: dateStr });
                                }}
                                className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition"
                              >
                                1m
                              </button>
                              <button
                                onClick={() => {
                                  updateTaskStatus(selectedTask.id, selectedTask.status, '');
                                  setSelectedTask({ ...selectedTask, due_date: '' });
                                }}
                                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                                title="Clear due date"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        </div>

                        {selectedTask.notes && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedTask.notes}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-semibold">Created:</span>{' '}
                            {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                          {selectedTask.completed_at && (
                            <div>
                              <span className="font-semibold">Completed:</span>{' '}
                              {new Date(selectedTask.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        {!selectedTask.is_system_task && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this task?')) {
                                deleteTask(selectedTask.id);
                                setSelectedTask(null);
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                          >
                            Delete Task
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTask(null)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GANTT VIEW */}
              {viewMode === 'gantt' && (
                <GanttChart
                  tasks={tasks}
                  onTaskUpdate={handleGanttTaskUpdate}
                  onTaskClick={setSelectedTask}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
};

export default TaskManager;
