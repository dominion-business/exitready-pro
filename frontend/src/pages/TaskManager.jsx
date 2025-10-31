import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, Edit2, Trash2, Filter, ChevronDown, Calendar, Flag } from 'lucide-react';

const TaskManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [questionFilter, setQuestionFilter] = useState(location.state?.questionId || '');

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [filter, questionFilter]);

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
        setTasks(response.data.tasks);
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Task Manager
              </h1>
              <p className="text-gray-600 text-lg mt-2">Track and manage your improvement tasks</p>
            </div>
            <button
              onClick={() => navigate('/gap-analysis')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Back to Gap Analysis
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-1">All</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-1">Not Started</p>
                <p className="text-2xl font-bold text-gray-700">{stats.not_started}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-200 bg-blue-50">
              <div className="text-center">
                <p className="text-xs text-blue-800 font-medium mb-1">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-purple-200 bg-purple-50">
              <div className="text-center">
                <p className="text-xs text-purple-800 font-medium mb-1">Under Review</p>
                <p className="text-2xl font-bold text-purple-600">{stats.under_review}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-green-200 bg-green-50">
              <div className="text-center">
                <p className="text-xs text-green-800 font-medium mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-medium mb-1">Not Relevant</p>
                <p className="text-2xl font-bold text-gray-400">{stats.not_relevant}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-indigo-200 bg-indigo-50">
              <div className="text-center">
                <p className="text-xs text-indigo-800 font-medium mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.completion_rate}%</p>
                <p className="text-xs text-indigo-600 mt-1">{stats.completed} of {stats.relevant_tasks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-700">Filter by Status:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'not_started', 'in_progress', 'under_review', 'completed', 'not_relevant'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

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

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
            <span className="text-sm text-gray-600">{tasks.length} tasks</span>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-lg">No tasks found</p>
              <p className="text-gray-500 text-sm mt-2">Tasks will be automatically created based on your gap assessment responses</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(task.status)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                        )}

                        {task.question && (
                          <div className="flex items-center gap-2 text-sm mb-3">
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium">
                              {task.question.category_display}
                            </span>
                            <span className="text-gray-600">
                              {task.question.subject}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Status and Due Date Controls */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Status:</label>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="under_review">Under Review</option>
                        <option value="completed">Completed</option>
                        <option value="not_relevant">Not Relevant</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Due Date:</label>
                      <input
                        type="date"
                        value={task.due_date || ''}
                        onChange={(e) => updateTaskStatus(task.id, task.status, e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
