import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  ChevronRight,
  ChevronDown,
  Download
} from 'lucide-react';

const GanttChart = ({ tasks, onTaskUpdate, onTaskClick }) => {
  const [zoomLevel, setZoomLevel] = useState('week');
  const [viewStartDate, setViewStartDate] = useState(null);
  const [viewEndDate, setViewEndDate] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragMode, setDragMode] = useState(null); // 'move', 'resize-left', 'resize-right'
  const chartRef = useRef(null);

  const ROW_HEIGHT = 60;
  const TASK_NAME_WIDTH = 350;

  // Get column width based on zoom
  const getColumnWidth = () => {
    switch (zoomLevel) {
      case 'day': return 100;
      case 'week': return 80;
      case 'month': return 50;
      case 'quarter': return 40;
      default: return 80;
    }
  };

  const columnWidth = getColumnWidth();

  // Parse date safely
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get date range from tasks
  const getDateRange = () => {
    const validTasks = tasks.filter(t => t.due_date || t.created_at);
    if (validTasks.length === 0) {
      const today = new Date();
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 3, 0)
      };
    }

    let minDate = new Date();
    let maxDate = new Date();

    validTasks.forEach(task => {
      const dueDate = parseDate(task.due_date);
      const createdDate = parseDate(task.created_at);

      if (dueDate) {
        if (dueDate < minDate) minDate = dueDate;
        if (dueDate > maxDate) maxDate = dueDate;
      }
      if (createdDate) {
        if (createdDate < minDate) minDate = createdDate;
        if (createdDate > maxDate) maxDate = createdDate;
      }
    });

    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 30);

    return { start: minDate, end: maxDate };
  };

  // Initialize view dates
  useEffect(() => {
    const range = getDateRange();
    setViewStartDate(range.start);
    setViewEndDate(range.end);
  }, [tasks]);

  // Generate time columns
  const generateTimeColumns = () => {
    if (!viewStartDate || !viewEndDate) return [];

    const columns = [];
    const current = new Date(viewStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (current <= viewEndDate) {
      const isToday = current.toDateString() === today.toDateString();
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;

      columns.push({
        date: new Date(current),
        label: formatDate(current),
        isToday,
        isWeekend
      });

      switch (zoomLevel) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          break;
        default:
          current.setDate(current.getDate() + 7);
      }
    }

    return columns;
  };

  const timeColumns = generateTimeColumns();

  // Get X position for a date
  const getXForDate = (date) => {
    if (!date || !viewStartDate) return 0;
    const diffTime = date - viewStartDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    let position;
    switch (zoomLevel) {
      case 'day':
        position = (diffDays * columnWidth);
        break;
      case 'week':
        position = ((diffDays / 7) * columnWidth);
        break;
      case 'month':
        position = ((diffDays / 30) * columnWidth);
        break;
      case 'quarter':
        position = ((diffDays / 90) * columnWidth);
        break;
      default:
        position = ((diffDays / 7) * columnWidth);
    }

    return position;
  };

  // Get task bar dimensions
  const getTaskBarDimensions = (task) => {
    const startDate = parseDate(task.start_date) || parseDate(task.created_at) || new Date();
    const endDate = parseDate(task.due_date) || new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const x = getXForDate(startDate);
    const endX = getXForDate(endDate);
    const width = Math.max(endX - x, 30);

    return { x, width, startDate, endDate };
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'not_started': 'bg-gray-200 border-gray-400',
      'in_progress': 'bg-blue-200 border-blue-500',
      'under_review': 'bg-yellow-200 border-yellow-500',
      'completed': 'bg-green-200 border-green-500',
      'not_relevant': 'bg-gray-100 border-gray-300'
    };
    return colors[status] || colors.not_started;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'bg-red-500',
      'medium': 'bg-orange-500',
      'low': 'bg-green-500'
    };
    return colors[priority] || colors.medium;
  };

  // Group tasks
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.question?.category_display || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {});

  // Get visible tasks
  const getVisibleTasks = () => {
    const visible = [];
    Object.entries(groupedTasks).forEach(([category, categoryTasks]) => {
      visible.push({ isGroup: true, name: category, count: categoryTasks.length });
      if (!collapsedGroups[category]) {
        categoryTasks.forEach(task => visible.push({ isGroup: false, ...task }));
      }
    });
    return visible;
  };

  const visibleTasks = getVisibleTasks();

  // Toggle group
  const toggleGroup = (category) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Zoom controls
  const handleZoomIn = () => {
    const levels = ['quarter', 'month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const levels = ['quarter', 'month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1]);
    }
  };

  const handleFitToScreen = () => {
    setZoomLevel('week');
    const range = getDateRange();
    setViewStartDate(range.start);
    setViewEndDate(range.end);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    const range = getDateRange();
    setViewStartDate(range.start);
    setViewEndDate(range.end);

    setTimeout(() => {
      const todayX = getXForDate(today);
      if (chartRef.current) {
        chartRef.current.scrollLeft = todayX - 200;
      }
    }, 100);
  };

  const handleExport = () => {
    alert('Export functionality would capture the Gantt chart as PNG/PDF.');
  };

  // Calculate progress
  const getProgress = (task) => {
    return task.status === 'completed' ? 100 :
           task.status === 'in_progress' ? 50 :
           task.status === 'under_review' ? 75 : 0;
  };

  // Drag and drop handlers
  const handleTaskBarMouseDown = (e, task, mode = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingTask(task);
    setDragStartX(e.clientX);
    setDragOffset(0);
    setDragMode(mode);
  };

  // Add mouse event listeners
  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingTask) return;
      const currentOffset = e.clientX - dragStartX;
      setDragOffset(currentOffset);
    };

    const handleUp = async () => {
      if (!draggingTask || dragOffset === 0) {
        setDraggingTask(null);
        setDragOffset(0);
        setDragMode(null);
        return;
      }

      // Calculate the date shift based on zoom level and drag distance
      let daysToShift = 0;

      switch (zoomLevel) {
        case 'day':
          daysToShift = Math.round(dragOffset / columnWidth);
          break;
        case 'week':
          daysToShift = Math.round(dragOffset / columnWidth) * 7;
          break;
        case 'month':
          daysToShift = Math.round(dragOffset / columnWidth) * 15;
          break;
        case 'quarter':
          daysToShift = Math.round(dragOffset / columnWidth) * 30;
          break;
        default:
          daysToShift = Math.round(dragOffset / columnWidth) * 7;
      }

      if (daysToShift === 0) {
        setDraggingTask(null);
        setDragOffset(0);
        setDragMode(null);
        return;
      }

      const updates = {};

      if (dragMode === 'move') {
        // Move both start and end dates
        const currentStartDate = draggingTask.start_date ? new Date(draggingTask.start_date) : (draggingTask.created_at ? new Date(draggingTask.created_at) : new Date());
        const currentDueDate = draggingTask.due_date ? new Date(draggingTask.due_date) : new Date();

        const newStartDate = new Date(currentStartDate);
        newStartDate.setDate(currentStartDate.getDate() + daysToShift);

        const newDueDate = new Date(currentDueDate);
        newDueDate.setDate(currentDueDate.getDate() + daysToShift);

        updates.start_date = newStartDate.toISOString().split('T')[0];
        updates.due_date = newDueDate.toISOString().split('T')[0];
      } else if (dragMode === 'resize-left') {
        // Adjust start date only
        const currentStartDate = draggingTask.start_date ? new Date(draggingTask.start_date) : (draggingTask.created_at ? new Date(draggingTask.created_at) : new Date());
        const newStartDate = new Date(currentStartDate);
        newStartDate.setDate(currentStartDate.getDate() + daysToShift);
        updates.start_date = newStartDate.toISOString().split('T')[0];
      } else if (dragMode === 'resize-right') {
        // Adjust due date only
        const currentDueDate = draggingTask.due_date ? new Date(draggingTask.due_date) : new Date();
        const newDueDate = new Date(currentDueDate);
        newDueDate.setDate(currentDueDate.getDate() + daysToShift);
        updates.due_date = newDueDate.toISOString().split('T')[0];
      }

      // Update the task
      try {
        await onTaskUpdate({
          taskId: draggingTask.id,
          updates
        });
      } catch (error) {
        console.error('Error updating task date:', error);
      }

      // Reset drag state
      setDraggingTask(null);
      setDragOffset(0);
      setDragMode(null);
    };

    if (draggingTask) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
    }
  }, [draggingTask, dragOffset, dragStartX, columnWidth, zoomLevel, onTaskUpdate]);

  const timelineWidth = timeColumns.length * columnWidth;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Calendar className="text-blue-600" size={20} />
          <h3 className="font-bold text-gray-900">Gantt Chart</h3>
          <span className="text-xs text-gray-500">({tasks.length} tasks)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              disabled={zoomLevel === 'quarter'}
            >
              <ZoomOut size={18} className={zoomLevel === 'quarter' ? 'text-gray-300' : 'text-gray-600'} />
            </button>
            <span className="text-xs font-medium text-gray-600 px-2 min-w-[60px] text-center">
              {zoomLevel.charAt(0).toUpperCase() + zoomLevel.slice(1)}
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              disabled={zoomLevel === 'day'}
            >
              <ZoomIn size={18} className={zoomLevel === 'day' ? 'text-gray-300' : 'text-gray-600'} />
            </button>
          </div>

          <button
            onClick={handleFitToScreen}
            className="p-2 bg-white hover:bg-gray-100 rounded-lg transition shadow-sm border border-gray-200"
          >
            <Maximize2 size={18} className="text-gray-600" />
          </button>

          <button
            onClick={handleJumpToToday}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition shadow-sm"
          >
            Today
          </button>

          <button
            onClick={handleExport}
            className="p-2 bg-white hover:bg-gray-100 rounded-lg transition shadow-sm border border-gray-200"
          >
            <Download size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex">
        {/* Task names column - fixed */}
        <div className="flex-shrink-0 bg-white border-r border-gray-200" style={{ width: TASK_NAME_WIDTH }}>
          {/* Header */}
          <div className="h-16 bg-gray-800 flex items-center px-4 border-b border-gray-600">
            <span className="text-white font-bold text-sm">Task Name</span>
          </div>

          {/* Task rows */}
          <div>
            {visibleTasks.map((item, idx) => (
              <div
                key={item.isGroup ? `group-${item.name}` : `task-${item.id}`}
                className={`border-b border-gray-200 ${item.isGroup ? 'bg-gray-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                style={{ height: ROW_HEIGHT }}
              >
                {item.isGroup ? (
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className="w-full h-full px-4 flex items-center gap-2 hover:bg-gray-100 transition text-left"
                  >
                    {collapsedGroups[item.name] ? (
                      <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-600 flex-shrink-0" />
                    )}
                    <span className="font-bold text-sm text-gray-900 truncate">
                      {item.name} ({item.count})
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => onTaskClick && onTaskClick(item)}
                    className="h-full px-4 flex items-center w-full text-left hover:bg-blue-50 transition cursor-pointer"
                  >
                    <span className="text-sm text-gray-700 leading-tight" title={item.title}>
                      {item.title || 'Untitled Task'}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline - scrollable */}
        <div ref={chartRef} className="flex-1 overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <div style={{ width: timelineWidth, minWidth: '100%' }}>
            {/* Timeline header */}
            <div className="h-16 border-b border-gray-300 flex bg-gray-100">
              {timeColumns.map((col, idx) => (
                <div
                  key={idx}
                  className={`border-r border-gray-200 flex items-center justify-center ${
                    col.isToday ? 'bg-yellow-100' : col.isWeekend ? 'bg-gray-50' : 'bg-white'
                  }`}
                  style={{ width: columnWidth, minWidth: columnWidth }}
                >
                  <span className={`text-xs font-medium ${col.isToday ? 'text-yellow-900 font-bold' : 'text-gray-600'}`}>
                    {col.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Task bars */}
            <div className="relative">
              {/* Background columns */}
              <div className="absolute inset-0 flex">
                {timeColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`border-r border-gray-200 ${
                      col.isWeekend ? 'bg-gray-50' : 'bg-white'
                    }`}
                    style={{ width: columnWidth, minWidth: columnWidth }}
                  />
                ))}
              </div>

              {/* Today line */}
              {timeColumns.map((col, idx) => {
                if (col.isToday) {
                  return (
                    <div
                      key={`today-${idx}`}
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: idx * columnWidth + columnWidth / 2 }}
                    />
                  );
                }
                return null;
              })}

              {/* Task bars */}
              {visibleTasks.map((item, idx) => {
                if (item.isGroup) {
                  return (
                    <div
                      key={`group-row-${item.name}`}
                      className="border-b border-gray-200 bg-gray-50"
                      style={{ height: ROW_HEIGHT }}
                    />
                  );
                }

                const { x, width } = getTaskBarDimensions(item);
                const progress = getProgress(item);
                const statusColor = getStatusColor(item.status);
                const priorityColor = getPriorityColor(item.priority);

                // Calculate position with drag offset if this task is being dragged
                const isDragging = draggingTask && draggingTask.id === item.id;
                let finalX = x;
                let finalWidth = width;

                if (isDragging) {
                  if (dragMode === 'resize-left') {
                    finalX = x + dragOffset;
                    finalWidth = width - dragOffset;
                  } else if (dragMode === 'resize-right') {
                    finalWidth = width + dragOffset;
                  } else {
                    // move mode
                    finalX = x + dragOffset;
                  }
                }

                return (
                  <div
                    key={`bar-${item.id}`}
                    className="relative border-b border-gray-200"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className={`absolute top-2 h-8 rounded border-2 ${statusColor} cursor-move hover:shadow-lg transition-shadow ${isDragging ? 'opacity-70 shadow-2xl z-50' : ''}`}
                      style={{
                        left: finalX,
                        width: Math.max(finalWidth, 30),
                      }}
                      onMouseDown={(e) => handleTaskBarMouseDown(e, item, 'move')}
                      onClick={(e) => {
                        if (!isDragging && dragOffset === 0) {
                          onTaskClick && onTaskClick(item);
                        }
                      }}
                    >
                      {/* Left resize handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-10"
                        onMouseDown={(e) => handleTaskBarMouseDown(e, item, 'resize-left')}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Priority bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityColor} rounded-l`} />

                      {/* Progress fill */}
                      {progress > 0 && (
                        <div
                          className="absolute top-0 left-0 bottom-0 bg-blue-500 opacity-30 rounded"
                          style={{ width: `${progress}%` }}
                        />
                      )}

                      {/* Progress text */}
                      {width > 60 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-700">{progress}%</span>
                        </div>
                      )}

                      {/* Right resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-10"
                        onMouseDown={(e) => handleTaskBarMouseDown(e, item, 'resize-right')}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
