import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Check } from 'lucide-react';

// Tag descriptions
const ACTIVITY_DESCRIPTIONS = {
  'De-Risking Activity': 'Questions that reduce business risk and protect value. These activities should typically be completed first as they prevent value destruction and make your business more stable and predictable.',
  'Strategy Activity': 'Questions related to long-term planning, market positioning, and competitive advantage. These define the direction of your business and should be addressed after de-risking activities.',
  'Efficiency Activity': 'Questions about operational optimization, process improvement, and resource utilization. These activities make your business run smoother and more profitably.',
  'Growth Activity': 'Questions focused on expansion, new markets, and scaling operations. These activities drive top-line revenue and should be prioritized once your foundation is solid.',
  'Culture Activity': 'Questions about organizational values, team dynamics, and workplace environment. These create the foundation for sustainable performance and employee retention.'
};

const INTANGIBLE_DESCRIPTIONS = {
  'Human': 'The collective skills, knowledge, and capabilities of your workforce. This includes employee expertise, training programs, leadership quality, and organizational culture that drives performance.',
  'Structural': 'The systems, processes, databases, and intellectual property that remain with the company. This includes proprietary software, documented procedures, patents, and organizational infrastructure.',
  'Customer': 'The value of your customer relationships, brand reputation, and market position. This includes customer loyalty, retention rates, brand equity, and the strength of customer relationships.',
  'Social': 'The value derived from networks, partnerships, and external relationships. This includes strategic alliances, supplier relationships, industry connections, and community reputation.',
  'Revenue & Profitability': 'The financial performance and sustainability of your business operations. This includes revenue streams, profit margins, cash flow management, and overall financial health.'
};

const CATEGORY_DESCRIPTIONS = {
  'Financial Performance & Documentation': 'Measures profitability, margins, cash flow, and overall financial health of the business. Evaluates the quality and organization of financial records.',
  'Revenue Quality & Predictability': 'Evaluates the predictability, diversity, and sustainability of your revenue streams. Assesses recurring revenue and customer retention patterns.',
  'Customer Concentration & Relationships': 'Assesses customer diversification and the strength of customer relationships to reduce concentration risk. Evaluates customer loyalty and lifetime value.',
  'Management Team & Operations': 'Evaluates leadership depth, operational capabilities, and team effectiveness. Measures the strength and independence of the management team.',
  'Competitive Position & Market Dynamic': 'Analyzes market positioning, competitive advantages, and barriers to entry. Assesses your differentiation and competitive moat.',
  'Growth Potential & Scalability': 'Measures growth trajectory, market opportunity, and ability to scale operations efficiently without proportional cost increases.',
  'Intellectual Property & Proprietary Assets': 'Assesses proprietary assets, competitive moats, and innovation capabilities. Evaluates patents, trademarks, trade secrets, and unique processes.',
  'Legal, Compliance & Risk Management': 'Reviews legal structure, regulatory compliance, and risk management practices. Ensures proper documentation and liability protection.',
  'Owner Dependency & Transferability': 'Evaluates how much the business relies on the owner for operations and relationships. Measures the transferability of key relationships and knowledge.',
  'Strategic Positioning & Market Reputation': 'Assesses long-term strategy, market positioning, and strategic partnerships. Evaluates brand reputation and market perception.'
};

const TaskDetailModal = ({ task, onClose, onUpdate }) => {
  const [editedTask, setEditedTask] = useState({
    status: task.status,
    priority: task.priority,
    start_date: task.start_date || '',
    due_date: task.due_date || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [noteHistory, setNoteHistory] = useState(() => {
    try {
      return task.notes ? JSON.parse(task.notes) : [];
    } catch {
      // If notes is not JSON, convert old format to new format
      return task.notes ? [{ text: task.notes, timestamp: task.created_at || new Date().toISOString() }] : [];
    }
  });

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
      editedTask.start_date !== (task.start_date || '') ||
      editedTask.due_date !== (task.due_date || '')
    );
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const updatedHistory = [
      ...noteHistory,
      {
        text: newNote,
        timestamp: new Date().toISOString()
      }
    ];

    setNoteHistory(updatedHistory);
    setNewNote('');

    try {
      await onUpdate(task.id, { notes: JSON.stringify(updatedHistory) });
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleEditNote = (index) => {
    setEditingNoteIndex(index);
    setEditingNoteText(noteHistory[index].text);
  };

  const handleSaveEditedNote = async (index) => {
    if (!editingNoteText.trim()) return;

    const updatedHistory = [...noteHistory];
    updatedHistory[index] = {
      ...updatedHistory[index],
      text: editingNoteText,
      lastEdited: new Date().toISOString()
    };

    setNoteHistory(updatedHistory);
    setEditingNoteIndex(null);
    setEditingNoteText('');

    try {
      await onUpdate(task.id, { notes: JSON.stringify(updatedHistory) });
    } catch (error) {
      console.error('Error saving edited note:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteIndex(null);
    setEditingNoteText('');
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl sticky top-0 z-20">
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
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <AlertCircle size={16} />
                Quick Edit
              </h3>
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Created:</span> {task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : 'N/A'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={editedTask.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                <select
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Date Section */}
            <div className="grid grid-cols-2 gap-3">
              {/* Start Date Section */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={editedTask.start_date ? editedTask.start_date.split('T')[0] : ''}
                  onChange={(e) => setEditedTask({ ...editedTask, start_date: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      setEditedTask({ ...editedTask, start_date: date.toISOString().split('T')[0] });
                    }}
                    className="px-1.5 py-0.5 text-[10px] bg-green-100 hover:bg-green-200 text-green-700 rounded transition font-medium"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 7);
                      setEditedTask({ ...editedTask, start_date: date.toISOString().split('T')[0] });
                    }}
                    className="px-1.5 py-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition font-medium"
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
                      setEditedTask({ ...editedTask, start_date: nextMonth.toISOString().split('T')[0] });
                    }}
                    className="px-1.5 py-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition font-medium"
                  >
                    Next Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const date = new Date();
                      const currentMonth = date.getMonth();
                      const currentQuarter = Math.floor(currentMonth / 3);
                      const nextQuarter = currentQuarter + 1;
                      const nextQuarterMonth = nextQuarter * 3;
                      const nextQuarterDate = new Date(date.getFullYear(), nextQuarterMonth, 1);
                      if (nextQuarterDate < date) {
                        nextQuarterDate.setFullYear(nextQuarterDate.getFullYear() + 1);
                      }
                      setEditedTask({ ...editedTask, start_date: nextQuarterDate.toISOString().split('T')[0] });
                    }}
                    className="px-1.5 py-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition font-medium"
                  >
                    Next Qtr
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditedTask({ ...editedTask, start_date: '' })}
                    className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Due Date Section */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editedTask.due_date ? editedTask.due_date.split('T')[0] : ''}
                  onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1.5"
                />
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const baseDate = editedTask.start_date ? new Date(editedTask.start_date) : new Date();
                      const date = new Date(baseDate);
                      date.setDate(date.getDate() + 7);
                      setEditedTask({ ...editedTask, due_date: date.toISOString().split('T')[0] });
                    }}
                    className="px-1.5 py-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition font-medium"
                  >
                    7d
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const baseDate = editedTask.start_date ? new Date(editedTask.start_date) : new Date();
                      const date = new Date(baseDate);
                      date.setMonth(date.getMonth() + 1);
                      setEditedTask({ ...editedTask, due_date: date.toISOString().split('T')[0] });
                    }}
                    className="px-1.5 py-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition font-medium"
                  >
                    1m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const baseDate = editedTask.start_date ? new Date(editedTask.start_date) : new Date();
                      const date = new Date(baseDate);
                      date.setMonth(date.getMonth() + 3);
                      setEditedTask({ ...editedTask, due_date: date.toISOString().split('T')[0] });
                    }}
                    className="px-1.5 py-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition font-medium"
                  >
                    3m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const baseDate = editedTask.start_date ? new Date(editedTask.start_date) : new Date();
                      const date = new Date(baseDate);
                      date.setMonth(date.getMonth() + 6);
                      setEditedTask({ ...editedTask, due_date: date.toISOString().split('T')[0] });
                    }}
                    className="px-1.5 py-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition font-medium"
                  >
                    6m
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditedTask({ ...editedTask, due_date: '' })}
                    className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button / Saved Confirmation */}
            {showSaved ? (
              <div className="mt-2 flex items-center justify-center gap-1.5 p-2 bg-green-100 border border-green-500 rounded">
                <Check size={16} className="text-green-700" />
                <span className="text-xs font-bold text-green-700">Saved!</span>
              </div>
            ) : hasChanges() && (
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditedTask({
                    status: task.status,
                    priority: task.priority,
                    start_date: task.start_date || '',
                    due_date: task.due_date || ''
                  })}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                  disabled={isSaving}
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && (
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
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

          {/* Completed Date */}
          {task.completed_at && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-semibold">Completed:</span>
              <span>{new Date(task.completed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>
            </div>
          )}

          {/* Notes History Section */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h3 className="text-xs font-bold text-gray-700 mb-3">Notes History</h3>

            {/* Add New Note */}
            <div className="mb-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                rows="2"
                placeholder="Add a new note..."
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="mt-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>

            {/* Notes List */}
            {noteHistory.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {noteHistory.map((note, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-500">
                        {note.lastEdited ? (
                          <>
                            Last edited: {new Date(note.lastEdited).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </>
                        ) : (
                          new Date(note.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })
                        )}
                      </span>
                      {editingNoteIndex !== index && (
                        <button
                          onClick={() => handleEditNote(index)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingNoteIndex === index ? (
                      <div>
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none mb-1.5"
                          rows="3"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleSaveEditedNote(index)}
                            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{note.text}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic text-center py-4">No notes yet. Add your first note above.</p>
            )}
          </div>

          {/* Question Info */}
          {task.question && (
            <div className="border border-gray-200 rounded-lg p-3">

              <div className="flex flex-wrap items-center gap-2">
                {task.question.category_display && (
                  <div className="relative group/category inline-flex items-center gap-1.5 px-2.5 py-1 bg-fuchsia-50 border border-fuchsia-200 rounded-md cursor-help">
                    <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div>
                    <span className="text-xs font-medium text-fuchsia-700">Category: {task.question.category_display}</span>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/category:opacity-100 transition pointer-events-none z-30 max-w-md whitespace-normal shadow-lg">
                      <div className="font-semibold mb-1">{task.question.category_display}:</div>
                      {CATEGORY_DESCRIPTIONS[task.question.category_display] || 'Assessment category measuring business attractiveness and readiness.'}
                    </div>
                  </div>
                )}

                {task.question.subject && (
                  <div className="relative group/theme inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 border border-cyan-200 rounded-md cursor-help">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <span className="text-xs font-medium text-cyan-700">Theme: {task.question.subject}</span>
                    {task.question.question_text && (
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/theme:opacity-100 transition pointer-events-none z-30 max-w-md whitespace-normal shadow-lg">
                        <div className="font-semibold mb-1">Full Question:</div>
                        {task.question.question_text}
                      </div>
                    )}
                  </div>
                )}

                {task.question.activity_type && (
                  <div className="relative group/activity inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md cursor-help">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-medium text-emerald-700">Activity: {task.question.activity_type}</span>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/activity:opacity-100 transition pointer-events-none z-30 max-w-md whitespace-normal shadow-lg">
                      <div className="font-semibold mb-1">{task.question.activity_type}:</div>
                      {ACTIVITY_DESCRIPTIONS[task.question.activity_type] || 'Activity type description not available.'}
                    </div>
                  </div>
                )}

                {task.question.intangible_asset_type && (
                  <div className="relative group/intangible inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md cursor-help">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-xs font-medium text-amber-700">Intangibles: {task.question.intangible_asset_type}</span>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/intangible:opacity-100 transition pointer-events-none z-30 max-w-md whitespace-normal shadow-lg">
                      <div className="font-semibold mb-1">{task.question.intangible_asset_type}:</div>
                      {INTANGIBLE_DESCRIPTIONS[task.question.intangible_asset_type] || 'Intangible asset description not available.'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-xl flex justify-between items-center border-t border-gray-200 sticky bottom-0 z-20">
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
