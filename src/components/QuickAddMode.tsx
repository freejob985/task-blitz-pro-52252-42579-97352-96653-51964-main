// مكون وضع الإضافة السريعة
import { useState, useEffect } from 'react';
import { Plus, X, Save, FolderPlus, Layers, ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import type { Board, Task } from '@/types';

interface QuickAddModeProps {
  isOpen: boolean;
  onClose: () => void;
  boards: Board[];
  onAddBoard: (boardData: Partial<Board>) => void;
  onAddTask: (taskData: Partial<Task>) => void;
  onAddSubBoard: (parentId: string, title: string) => void;
}

export function QuickAddMode({ 
  isOpen, 
  onClose, 
  boards, 
  onAddBoard, 
  onAddTask, 
  onAddSubBoard 
}: QuickAddModeProps) {
  const [activeTab, setActiveTab] = useState<'task' | 'board' | 'subboard'>('task');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskBoardId, setTaskBoardId] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [boardColor, setBoardColor] = useState('#3b82f6');
  const [subBoardTitle, setSubBoardTitle] = useState('');
  const [subBoardParentId, setSubBoardParentId] = useState('');
  const [subBoardColor, setSubBoardColor] = useState('#8b5cf6');
  
  // متغيرات للإضافة المتعددة
  const [multipleMode, setMultipleMode] = useState(false);
  const [taskTitles, setTaskTitles] = useState<string[]>(['']);
  const [boardTitles, setBoardTitles] = useState<string[]>(['']);
  const [subBoardTitles, setSubBoardTitles] = useState<string[]>(['']);
  const [recentlyAdded, setRecentlyAdded] = useState<Array<{type: string, title: string, id: string}>>([]);

  const mainBoards = boards.filter(board => !board.parentId);
  const colors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', 
    '#ef4444', '#06b6d4', '#84cc16', '#f97316'
  ];

  useEffect(() => {
    if (isOpen) {
      setTaskBoardId(mainBoards[0]?.id || '');
      setSubBoardParentId(mainBoards[0]?.id || '');
    }
  }, [isOpen, mainBoards]);

  const handleAddTask = () => {
    if (!taskTitle.trim()) {
      return;
    }
    if (!taskBoardId) {
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      status: 'waiting',
      priority: taskPriority,
      tags: [],
      boardId: taskBoardId,
      createdAt: new Date().toISOString(),
      order: 0,
    };

    onAddTask(newTask);
    setRecentlyAdded(prev => [...prev, { type: 'مهمة', title: taskTitle, id: newTask.id }]);
    
    // إعادة تعيين النموذج
    setTaskTitle('');
    setTaskPriority('medium');
  };

  const handleAddMultipleTasks = () => {
    const validTitles = taskTitles.filter(title => title.trim());
    if (validTitles.length === 0 || !taskBoardId) return;

    validTitles.forEach(title => {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random()}`,
        title: title.trim(),
        status: 'waiting',
        priority: taskPriority,
        tags: [],
        boardId: taskBoardId,
        createdAt: new Date().toISOString(),
        order: 0,
      };

      onAddTask(newTask);
      setRecentlyAdded(prev => [...prev, { type: 'مهمة', title: title.trim(), id: newTask.id }]);
    });
    
    // إعادة تعيين النموذج
    setTaskTitles(['']);
    setTaskPriority('medium');
  };

  const handleAddBoard = () => {
    if (!boardTitle.trim()) return;

    const newBoard: Board = {
      id: `board-${Date.now()}`,
      title: boardTitle.trim(),
      description: boardDescription.trim() || undefined,
      order: boards.length,
      createdAt: new Date().toISOString(),
      color: boardColor,
    };

    onAddBoard(newBoard);
    setRecentlyAdded(prev => [...prev, { type: 'قسم', title: boardTitle, id: newBoard.id }]);
    
    // إعادة تعيين النموذج
    setBoardTitle('');
    setBoardDescription('');
    setBoardColor('#3b82f6');
  };

  const handleAddMultipleBoards = () => {
    const validTitles = boardTitles.filter(title => title.trim());
    if (validTitles.length === 0) return;

    validTitles.forEach((title, index) => {
      const newBoard: Board = {
        id: `board-${Date.now()}-${index}`,
        title: title.trim(),
        description: boardDescription.trim() || undefined,
        order: boards.length + index,
        createdAt: new Date().toISOString(),
        color: boardColor,
      };

      onAddBoard(newBoard);
      setRecentlyAdded(prev => [...prev, { type: 'قسم', title: title.trim(), id: newBoard.id }]);
    });
    
    // إعادة تعيين النموذج
    setBoardTitles(['']);
    setBoardDescription('');
    setBoardColor('#3b82f6');
  };

  const handleAddSubBoard = () => {
    if (!subBoardTitle.trim() || !subBoardParentId) return;

    onAddSubBoard(subBoardParentId, subBoardTitle.trim());
    setRecentlyAdded(prev => [...prev, { type: 'قسم فرعي', title: subBoardTitle, id: `sub-${Date.now()}` }]);
    
    // إعادة تعيين النموذج
    setSubBoardTitle('');
    setSubBoardColor('#8b5cf6');
  };

  const handleAddMultipleSubBoards = () => {
    const validTitles = subBoardTitles.filter(title => title.trim());
    if (validTitles.length === 0 || !subBoardParentId) return;

    validTitles.forEach((title, index) => {
      onAddSubBoard(subBoardParentId, title.trim());
      setRecentlyAdded(prev => [...prev, { type: 'قسم فرعي', title: title.trim(), id: `sub-${Date.now()}-${index}` }]);
    });
    
    // إعادة تعيين النموذج
    setSubBoardTitles(['']);
    setSubBoardColor('#8b5cf6');
  };

  const clearRecentlyAdded = () => {
    setRecentlyAdded([]);
  };

  // دوال إدارة الإدخالات المتعددة
  const addTaskInput = () => {
    setTaskTitles([...taskTitles, '']);
  };

  const removeTaskInput = (index: number) => {
    if (taskTitles.length > 1) {
      setTaskTitles(taskTitles.filter((_, i) => i !== index));
    }
  };

  const updateTaskTitle = (index: number, value: string) => {
    const newTitles = [...taskTitles];
    newTitles[index] = value;
    setTaskTitles(newTitles);
  };

  const addBoardInput = () => {
    setBoardTitles([...boardTitles, '']);
  };

  const removeBoardInput = (index: number) => {
    if (boardTitles.length > 1) {
      setBoardTitles(boardTitles.filter((_, i) => i !== index));
    }
  };

  const updateBoardTitle = (index: number, value: string) => {
    const newTitles = [...boardTitles];
    newTitles[index] = value;
    setBoardTitles(newTitles);
  };

  const addSubBoardInput = () => {
    setSubBoardTitles([...subBoardTitles, '']);
  };

  const removeSubBoardInput = (index: number) => {
    if (subBoardTitles.length > 1) {
      setSubBoardTitles(subBoardTitles.filter((_, i) => i !== index));
    }
  };

  const updateSubBoardTitle = (index: number, value: string) => {
    const newTitles = [...subBoardTitles];
    newTitles[index] = value;
    setSubBoardTitles(newTitles);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">وضع الإضافة السريعة</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    أضف مهام وأقسام جديدة بسرعة وسهولة
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden flex flex-col">
            {/* التبويبات */}
            <div className="flex gap-2 mb-6 flex-shrink-0">
              <Button
                variant={activeTab === 'task' ? 'default' : 'outline'}
                onClick={() => setActiveTab('task')}
                className="flex-1 gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                إضافة مهمة
              </Button>
              <Button
                variant={activeTab === 'board' ? 'default' : 'outline'}
                onClick={() => setActiveTab('board')}
                className="flex-1 gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                إضافة قسم
              </Button>
              <Button
                variant={activeTab === 'subboard' ? 'default' : 'outline'}
                onClick={() => setActiveTab('subboard')}
                className="flex-1 gap-2"
              >
                <Layers className="h-4 w-4" />
                إضافة قسم فرعي
              </Button>
            </div>

            {/* تبديل وضع الإضافة المتعددة */}
            <div className="flex items-center justify-center mb-6">
              <Button
                variant={multipleMode ? 'default' : 'outline'}
                onClick={() => setMultipleMode(!multipleMode)}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                {multipleMode ? 'وضع الإضافة المتعددة' : 'وضع الإضافة المفردة'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* النموذج */}
                <div className="space-y-6">
                  {activeTab === 'task' && (
                    <div className="space-y-4">
                      {multipleMode ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">عناوين المهام *</label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addTaskInput}
                              className="gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              إضافة سطر
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {taskTitles.map((title, index) => (
                              <div key={index} className="flex gap-3">
                                <Input
                                  value={title}
                                  onChange={(e) => updateTaskTitle(index, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && title.trim() && taskBoardId) {
                                      e.preventDefault();
                                      handleAddMultipleTasks();
                                    }
                                    if (e.key === 'ArrowUp' && index > 0) {
                                      e.preventDefault();
                                      const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
                                      prevInput?.focus();
                                      prevInput?.select();
                                    }
                                    if (e.key === 'ArrowDown' && index < taskTitles.length - 1) {
                                      e.preventDefault();
                                      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
                                      nextInput?.focus();
                                      nextInput?.select();
                                    }
                                    if (e.key === 'Enter' && !title.trim()) {
                                      e.preventDefault();
                                      addTaskInput();
                                      setTimeout(() => {
                                        const nextInput = document.querySelector(`input[data-index="${taskTitles.length}"]`) as HTMLInputElement;
                                        nextInput?.focus();
                                      }, 0);
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  placeholder={`مهمة ${index + 1}...`}
                                  className="text-right flex-1 h-14 text-xl font-medium"
                                  data-index={index}
                                />
                                {taskTitles.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTaskInput(index)}
                                    className="text-destructive hover:text-destructive h-12 w-12"
                                  >
                                    <X className="h-5 w-5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-lg font-semibold mb-3 block">عنوان المهمة *</label>
                          <Input
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && taskTitle.trim() && taskBoardId) {
                                e.preventDefault();
                                handleAddTask();
                              }
                            }}
                            placeholder="أدخل عنوان المهمة..."
                            className="text-right h-16 text-2xl font-medium"
                            autoFocus
                          />
                        </div>
                      )}
                      

                      <div>
                        <label className="text-sm font-medium mb-2 block">القسم *</label>
                        <select
                          value={taskBoardId}
                          onChange={(e) => setTaskBoardId(e.target.value)}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          {mainBoards.map(board => (
                            <option key={board.id} value={board.id}>
                              {board.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">الأولوية</label>
                        <div className="flex gap-2">
                          {(['high', 'medium', 'low'] as const).map(priority => (
                            <Button
                              key={priority}
                              variant={taskPriority === priority ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setTaskPriority(priority)}
                              className={cn(
                                priority === 'high' && 'border-red-500 text-red-500 hover:bg-red-50',
                                priority === 'medium' && 'border-yellow-500 text-yellow-500 hover:bg-yellow-50',
                                priority === 'low' && 'border-green-500 text-green-500 hover:bg-green-50'
                              )}
                            >
                              {priority === 'high' ? 'عالي' : priority === 'medium' ? 'متوسط' : 'منخفض'}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={multipleMode ? handleAddMultipleTasks : handleAddTask}
                        disabled={
                          multipleMode 
                            ? (taskTitles.filter(t => t.trim()).length === 0 || !taskBoardId)
                            : (!taskTitle.trim() || !taskBoardId)
                        }
                        className="w-full gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {multipleMode ? `إضافة ${taskTitles.filter(t => t.trim()).length} مهمة` : 'إضافة المهمة'}
                      </Button>
                    </div>
                  )}

                  {activeTab === 'board' && (
                    <div className="space-y-4">
                      {multipleMode ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">أسماء الأقسام *</label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addBoardInput}
                              className="gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              إضافة سطر
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {boardTitles.map((title, index) => (
                              <div key={index} className="flex gap-3">
                                <Input
                                  value={title}
                                  onChange={(e) => updateBoardTitle(index, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && title.trim()) {
                                      e.preventDefault();
                                      handleAddMultipleBoards();
                                    }
                                    if (e.key === 'ArrowUp' && index > 0) {
                                      e.preventDefault();
                                      const prevInput = document.querySelector(`input[data-board-index="${index - 1}"]`) as HTMLInputElement;
                                      prevInput?.focus();
                                      prevInput?.select();
                                    }
                                    if (e.key === 'ArrowDown' && index < boardTitles.length - 1) {
                                      e.preventDefault();
                                      const nextInput = document.querySelector(`input[data-board-index="${index + 1}"]`) as HTMLInputElement;
                                      nextInput?.focus();
                                      nextInput?.select();
                                    }
                                    if (e.key === 'Enter' && !title.trim()) {
                                      e.preventDefault();
                                      addBoardInput();
                                      setTimeout(() => {
                                        const nextInput = document.querySelector(`input[data-board-index="${boardTitles.length}"]`) as HTMLInputElement;
                                        nextInput?.focus();
                                      }, 0);
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  placeholder={`قسم ${index + 1}...`}
                                  className="text-right flex-1 h-14 text-xl font-medium"
                                  data-board-index={index}
                                />
                                {boardTitles.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBoardInput(index)}
                                    className="text-destructive hover:text-destructive h-12 w-12"
                                  >
                                    <X className="h-5 w-5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-lg font-semibold mb-3 block">اسم القسم *</label>
                          <Input
                            value={boardTitle}
                            onChange={(e) => setBoardTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && boardTitle.trim()) {
                                e.preventDefault();
                                handleAddBoard();
                              }
                            }}
                            placeholder="أدخل اسم القسم..."
                            className="text-right h-16 text-2xl font-medium"
                            autoFocus
                          />
                        </div>
                      )}
                      

                      <div>
                        <label className="text-sm font-medium mb-2 block">لون القسم</label>
                        <div className="flex gap-2 flex-wrap">
                          {colors.map(color => (
                            <button
                              key={color}
                              onClick={() => setBoardColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                boardColor === color ? "border-foreground scale-110" : "border-border hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={multipleMode ? handleAddMultipleBoards : handleAddBoard}
                        disabled={
                          multipleMode 
                            ? (boardTitles.filter(t => t.trim()).length === 0)
                            : (!boardTitle.trim())
                        }
                        className="w-full gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {multipleMode ? `إضافة ${boardTitles.filter(t => t.trim()).length} قسم` : 'إضافة القسم'}
                      </Button>
                    </div>
                  )}

                  {activeTab === 'subboard' && (
                    <div className="space-y-4">
                      {multipleMode ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">أسماء الأقسام الفرعية *</label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addSubBoardInput}
                              className="gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              إضافة سطر
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {subBoardTitles.map((title, index) => (
                              <div key={index} className="flex gap-3">
                                <Input
                                  value={title}
                                  onChange={(e) => updateSubBoardTitle(index, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && title.trim() && subBoardParentId) {
                                      e.preventDefault();
                                      handleAddMultipleSubBoards();
                                    }
                                    if (e.key === 'ArrowUp' && index > 0) {
                                      e.preventDefault();
                                      const prevInput = document.querySelector(`input[data-subboard-index="${index - 1}"]`) as HTMLInputElement;
                                      prevInput?.focus();
                                      prevInput?.select();
                                    }
                                    if (e.key === 'ArrowDown' && index < subBoardTitles.length - 1) {
                                      e.preventDefault();
                                      const nextInput = document.querySelector(`input[data-subboard-index="${index + 1}"]`) as HTMLInputElement;
                                      nextInput?.focus();
                                      nextInput?.select();
                                    }
                                    if (e.key === 'Enter' && !title.trim()) {
                                      e.preventDefault();
                                      addSubBoardInput();
                                      setTimeout(() => {
                                        const nextInput = document.querySelector(`input[data-subboard-index="${subBoardTitles.length}"]`) as HTMLInputElement;
                                        nextInput?.focus();
                                      }, 0);
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  placeholder={`قسم فرعي ${index + 1}...`}
                                  className="text-right flex-1 h-14 text-xl font-medium"
                                  data-subboard-index={index}
                                />
                                {subBoardTitles.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSubBoardInput(index)}
                                    className="text-destructive hover:text-destructive h-12 w-12"
                                  >
                                    <X className="h-5 w-5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-lg font-semibold mb-3 block">اسم القسم الفرعي *</label>
                          <Input
                            value={subBoardTitle}
                            onChange={(e) => setSubBoardTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && subBoardTitle.trim() && subBoardParentId) {
                                e.preventDefault();
                                handleAddSubBoard();
                              }
                            }}
                            placeholder="أدخل اسم القسم الفرعي..."
                            className="text-right h-16 text-2xl font-medium"
                            autoFocus
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium mb-2 block">القسم الرئيسي *</label>
                        <select
                          value={subBoardParentId}
                          onChange={(e) => setSubBoardParentId(e.target.value)}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          {mainBoards.map(board => (
                            <option key={board.id} value={board.id}>
                              {board.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">لون القسم الفرعي</label>
                        <div className="flex gap-2 flex-wrap">
                          {colors.map(color => (
                            <button
                              key={color}
                              onClick={() => setSubBoardColor(color)}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all",
                                subBoardColor === color ? "border-foreground scale-110" : "border-border hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={multipleMode ? handleAddMultipleSubBoards : handleAddSubBoard}
                        disabled={
                          multipleMode 
                            ? (subBoardTitles.filter(t => t.trim()).length === 0 || !subBoardParentId)
                            : (!subBoardTitle.trim() || !subBoardParentId)
                        }
                        className="w-full gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {multipleMode ? `إضافة ${subBoardTitles.filter(t => t.trim()).length} قسم فرعي` : 'إضافة القسم الفرعي'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* العناصر المضافة مؤخراً */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">تم إضافتها مؤخراً</h3>
                    {recentlyAdded.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentlyAdded}
                        className="text-muted-foreground"
                      >
                        مسح الكل
                      </Button>
                    )}
                  </div>

                  {recentlyAdded.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recentlyAdded.map((item, index) => (
                        <div
                          key={`${item.id}-${index}`}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="p-1.5 bg-primary/10 rounded">
                            {item.type === 'مهمة' ? (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            ) : item.type === 'قسم' ? (
                              <FolderPlus className="h-4 w-4 text-primary" />
                            ) : (
                              <Layers className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.type}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            جديد
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">لم يتم إضافة أي عناصر بعد</p>
                      <p className="text-xs mt-1">ابدأ بإضافة مهمة أو قسم جديد</p>
                    </div>
                  )}

                  {/* نصائح سريعة */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      نصائح سريعة
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• يمكنك إضافة عدة مهام بسرعة باستخدام هذا الوضع</li>
                      <li>• الأقسام الفرعية تساعد في تنظيم المهام بشكل أفضل</li>
                      <li>• استخدم الألوان المختلفة لتمييز الأقسام</li>
                      <li>• اضغط Enter لحفظ المهمة أو القسم بسرعة</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-3 pt-4 border-t flex-shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة للوضع العادي
              </Button>
              <Button
                onClick={() => {
                  if (activeTab === 'task') {
                    if (multipleMode) handleAddMultipleTasks();
                    else handleAddTask();
                  } else if (activeTab === 'board') {
                    if (multipleMode) handleAddMultipleBoards();
                    else handleAddBoard();
                  } else if (activeTab === 'subboard') {
                    if (multipleMode) handleAddMultipleSubBoards();
                    else handleAddSubBoard();
                  }
                }}
                className="flex-1 gap-2"
                disabled={
                  multipleMode ? (
                    (activeTab === 'task' && (taskTitles.filter(t => t.trim()).length === 0 || !taskBoardId)) ||
                    (activeTab === 'board' && boardTitles.filter(t => t.trim()).length === 0) ||
                    (activeTab === 'subboard' && (subBoardTitles.filter(t => t.trim()).length === 0 || !subBoardParentId))
                  ) : (
                    (activeTab === 'task' && (!taskTitle.trim() || !taskBoardId)) ||
                    (activeTab === 'board' && !boardTitle.trim()) ||
                    (activeTab === 'subboard' && (!subBoardTitle.trim() || !subBoardParentId))
                  )
                }
              >
                <Save className="h-4 w-4" />
                حفظ وإضافة أخرى
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
