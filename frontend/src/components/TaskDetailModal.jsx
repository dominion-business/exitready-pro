import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Check } from 'lucide-react';

const TaskDetailModal = ({ task, onClose, onUpdate }) => {
  const [editedTask, setEditedTask] = useState({
    status: task.status,
    priority: task.priority,
    due_date: task.due_date || '',
    notes: task.notes || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(task.id, editedTask);
      setShowSaved(true);
      // Don't close immediately, show saved confirmation
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating task:', error);
      setIsSaving(false);
    }
  };

  // Auto-hide saved message
  useEffect(() => {
    if (showSaved) {
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSaved]);

  const hasChanges = () => {
    return (
      editedTask.status !== task.status ||
      editedTask.priority !== task.priority ||
      editedTask.due_date !== (task.due_date || '') ||
      editedTask.notes !== (task.notes || '')
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl sticky top-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  editedTask.status === 'completed' ? 'bg-green-500' :
                  editedTask.status === 'in_progress' ? 'bg-blue-500' :
                  editedTask.status === 'under_review' ? 'bg-yellow-500' :
                  editedTask.status === 'not_relevant' ? 'bg-gray-500' :
                  'bg-red-500'
                }`}>
                  {editedTask.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className={`px-3 py-1 rounded-full font-medium ${
                  editedTask.priority === 'high' ? 'bg-red-500' :
                  editedTask.priority === 'medium' ? 'bg-orange-500' :
                  'bg-green-500'
                }`}>
                  {editedTask.priority?.charAt(0).toUpperCase() + editedTask.priority?.slice(1)} Priority
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition flex-shrink-0"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Edit Section */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
              <AlertCircle size={18} />
              Quick Edit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                <select
                  value={editedTask.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="under_review">Under Review</option>
                  <option value="completed">Completed</option>
                  <option value="not_relevant">Not Relevant</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                <select
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Due Date Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={editedTask.due_date ? editedTask.due_date.split('T')[0] : ''}
                    onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
              <textarea
                value={editedTask.notes}
                onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[100px] resize-y"
                placeholder="Add notes about this task..."
              />
            </div>

            {/* Save Button / Saved Confirmation */}
            {showSaved ? (
              <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-green-100 border-2 border-green-500 rounded-lg animate-pulse">
                <Check size={20} className="text-green-700" />
                <span className="text-sm font-bold text-green-700">Saved Successfully!</span>
              </div>
            ) : hasChanges() && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setEditedTask({
                    status: task.status,
                    priority: task.priority,
                    due_date: task.due_date || '',
                    notes: task.notes || ''
                  })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={isSaving}
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-xs font-bold text-gray-500 mb-1">Created</h3>
              <p className="text-sm text-gray-900">
                {task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-xs font-bold text-gray-500 mb-1">Due Date</h3>
              <p className="text-sm text-gray-900">
                {editedTask.due_date ? new Date(editedTask.due_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'No due date'}
              </p>
            </div>
          </div>

          {/* Question Info */}
          {task.question && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <h3 className="text-sm font-bold text-purple-900 mb-3">Related Assessment Question</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{task.question.subject}</p>

              <div className="flex flex-wrap gap-2">
                {task.question.category_display && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {task.question.category_display}
                  </span>
                )}
                {task.question.activity_type && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    {task.question.activity_type}
                  </span>
                )}
                {task.question.intangible_asset_type && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {task.question.intangible_asset_type}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-xl flex justify-between items-center border-t border-gray-200 sticky bottom-0">
          <div className="text-xs text-gray-500">
            Task ID: {task.id}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
