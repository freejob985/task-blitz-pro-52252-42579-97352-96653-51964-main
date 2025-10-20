// مكون إدارة المهام للهواتف المحمولة
import { useState } from 'react';
import { Plus, Layers, FolderPlus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, XCircle, Star, Archive, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { showToast } from '@/lib/toast';
import type { Board, Task, TaskStatus, TaskPriority, TaskDifficulty } from '@/types';

interface MobileTaskManagerProps {
  boards: Board[];
  tasks: Task[];
  onAddTask: (boardId: string) => void;
  onAddBoard: (title: string, description?: string, parentId?: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTaskStatusChange: (id: string, status: TaskStatus) => void;
  onToggleSubBoardVisibility: (boardId: string) => void;
  hiddenSubBoards: Set<string>;
  onBulkAdd: (boardId: string) => void;
}

export function MobileTaskManager({
  boards,
  tasks,
  onAddTask,
  onAddBoard,
  onEditTask,
  onDeleteTask,
  onTaskStatusChange,
  onToggleSubBoardVisibility,
  hiddenSubBoards,
  onBulkAdd,
}: MobileTaskManagerProps) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [newSubBoardOpen, setNewSubBoardOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<TaskDifficulty>('medium');
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newSubBoardTitle, setNewSubBoardTitle] = useState('');
  const [newSubBoardDescription, setNewSubBoardDescription] = useState('');
  const [parentBoardId, setParentBoardId] = useState<string>('');

  // الأقسام الرئيسية فقط
  const mainBoards = boards.filter(board => !board.parentId && !board.isArchived);
  
  // الأقسام الفرعية
  const subBoards = boards.filter(board => board.parentId && !board.isArchived);

  const handleAddTask = () => {
    if (!selectedBoardId || !newTaskTitle.trim()) {
      showToast('يرجى اختيار قسم وإدخال عنوان المهمة', 'error');
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      status: 'waiting',
      priority: newTaskPriority,
      difficulty: newTaskDifficulty,
      tags: [],
      boardId: selectedBoardId,
      createdAt: new Date().toISOString(),
      order: tasks.filter(t => t.boardId === selectedBoardId).length,
    };

    onEditTask(newTask);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSelectedBoardId('');
    setNewTaskOpen(false);
    showToast('تم إضافة المهمة بنجاح', 'success');
  };

  const handleAddBoard = () => {
    if (!newBoardTitle.trim()) {
      showToast('يرجى إدخال عنوان القسم', 'error');
      return;
    }

    onAddBoard(newBoardTitle.trim(), newBoardDescription.trim() || undefined);
    setNewBoardTitle('');
    setNewBoardDescription('');
    setNewBoardOpen(false);
    showToast('تم إضافة القسم بنجاح', 'success');
  };

  const handleAddSubBoard = () => {
    if (!newSubBoardTitle.trim() || !parentBoardId) {
      showToast('يرجى إدخال عنوان القسم الفرعي واختيار القسم الرئيسي', 'error');
      return;
    }

    onAddBoard(newSubBoardTitle.trim(), newSubBoardDescription.trim() || undefined, parentBoardId);
    setNewSubBoardTitle('');
    setNewSubBoardDescription('');
    setParentBoardId('');
    setNewSubBoardOpen(false);
    showToast('تم إضافة القسم الفرعي بنجاح', 'success');
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'working': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'waiting': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'frozen': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expert': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-4 space-y-4 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* العنوان الرئيسي */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-cairo font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          إدارة المهام
        </h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة مهامك بسهولة على الهاتف</p>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">المهام</TabsTrigger>
          <TabsTrigger value="boards">الأقسام</TabsTrigger>
          <TabsTrigger value="add">إضافة</TabsTrigger>
        </TabsList>

        {/* تبويب المهام */}
        <TabsContent value="tasks" className="space-y-4">
          {mainBoards.map(board => {
            const boardTasks = tasks.filter(t => t.boardId === board.id);
            const subBoardsForBoard = subBoards.filter(sub => sub.parentId === board.id);
            const isSubBoardsHidden = hiddenSubBoards.has(board.id);

            return (
              <Card key={board.id} className="border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {board.color && (
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: board.color }}
                        />
                      )}
                      <CardTitle className="text-lg font-cairo">{board.title}</CardTitle>
                      {board.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {boardTasks.length} مهمة
                    </Badge>
                  </div>
                  {board.description && (
                    <p className="text-sm text-muted-foreground">{board.description}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* الأقسام الفرعية */}
                  {subBoardsForBoard.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-accent">الأقسام الفرعية</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleSubBoardVisibility(board.id)}
                          className="h-6 px-2 text-xs"
                        >
                          {isSubBoardsHidden ? 
                            <><EyeOff className="h-3 w-3 ml-1" /> إظهار</> : 
                            <><Eye className="h-3 w-3 ml-1" /> إخفاء</>
                          }
                        </Button>
                      </div>
                      
                      {!isSubBoardsHidden && (
                        <div className="space-y-2">
                          {subBoardsForBoard.map(subBoard => {
                            const subBoardTasks = tasks.filter(t => t.boardId === subBoard.id);
                            return (
                              <div key={subBoard.id} className="p-2 bg-accent/5 rounded-lg border border-accent/20">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-medium">{subBoard.title}</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {subBoardTasks.length} مهمة
                                  </Badge>
                                </div>
                                {subBoard.description && (
                                  <p className="text-xs text-muted-foreground mb-2">{subBoard.description}</p>
                                )}
                                <div className="space-y-1">
                                  {subBoardTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                                      {getStatusIcon(task.status)}
                                      <span className="text-xs flex-1 truncate">{task.title}</span>
                                      <div className="flex gap-1">
                                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                          {task.priority}
                                        </Badge>
                                        <Badge className={`text-xs ${getDifficultyColor(task.difficulty)}`}>
                                          {task.difficulty}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                  {subBoardTasks.length > 3 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                      +{subBoardTasks.length - 3} مهمة أخرى
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* مهام القسم الرئيسي */}
                  <div className="space-y-1">
                    {boardTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded border">
                        {getStatusIcon(task.status)}
                        <span className="text-sm flex-1 truncate">{task.title}</span>
                        <div className="flex gap-1">
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          <Badge className={`text-xs ${getDifficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {boardTasks.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{boardTasks.length - 5} مهمة أخرى
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* تبويب الأقسام */}
        <TabsContent value="boards" className="space-y-4">
          <div className="grid gap-3">
            {mainBoards.map(board => {
              const subBoardsForBoard = subBoards.filter(sub => sub.parentId === board.id);
              return (
                <Card key={board.id} className="border-2 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {board.color && (
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: board.color }}
                          />
                        )}
                        <h3 className="font-semibold">{board.title}</h3>
                        {board.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {subBoardsForBoard.length} قسم فرعي
                      </Badge>
                    </div>
                    {board.description && (
                      <p className="text-sm text-muted-foreground mb-3">{board.description}</p>
                    )}
                    {subBoardsForBoard.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-accent">الأقسام الفرعية:</h4>
                        {subBoardsForBoard.map(subBoard => (
                          <div key={subBoard.id} className="flex items-center gap-2 p-2 bg-accent/5 rounded">
                            <div className="w-3 h-3 rounded-full bg-accent" />
                            <span className="text-sm">{subBoard.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* تبويب الإضافة */}
        <TabsContent value="add" className="space-y-4">
          <div className="grid gap-4">
            {/* إضافة مهمة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  إضافة مهمة جديدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مهمة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">القسم</label>
                        <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                          <SelectContent>
                            {mainBoards.map(board => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">عنوان المهمة</label>
                        <Input
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="أدخل عنوان المهمة"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">الوصف (اختياري)</label>
                        <Textarea
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="أدخل وصف المهمة"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">الأولوية</label>
                          <Select value={newTaskPriority} onValueChange={(value: TaskPriority) => setNewTaskPriority(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">منخفضة</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="high">عالية</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">الصعوبة</label>
                          <Select value={newTaskDifficulty} onValueChange={(value: TaskDifficulty) => setNewTaskDifficulty(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">سهلة</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="hard">صعبة</SelectItem>
                              <SelectItem value="expert">خبير</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddTask} className="flex-1">
                          إضافة المهمة
                        </Button>
                        <Button variant="outline" onClick={() => setNewTaskOpen(false)}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* إضافة قسم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-accent" />
                  إضافة قسم جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={newBoardOpen} onOpenChange={setNewBoardOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <FolderPlus className="h-4 w-4 ml-2" />
                      إضافة قسم
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>إضافة قسم جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">عنوان القسم</label>
                        <Input
                          value={newBoardTitle}
                          onChange={(e) => setNewBoardTitle(e.target.value)}
                          placeholder="أدخل عنوان القسم"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">الوصف (اختياري)</label>
                        <Textarea
                          value={newBoardDescription}
                          onChange={(e) => setNewBoardDescription(e.target.value)}
                          placeholder="أدخل وصف القسم"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddBoard} className="flex-1">
                          إضافة القسم
                        </Button>
                        <Button variant="outline" onClick={() => setNewBoardOpen(false)}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* إضافة قسم فرعي */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  إضافة قسم فرعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={newSubBoardOpen} onOpenChange={setNewSubBoardOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Layers className="h-4 w-4 ml-2" />
                      إضافة قسم فرعي
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>إضافة قسم فرعي</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">القسم الرئيسي</label>
                        <Select value={parentBoardId} onValueChange={setParentBoardId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم الرئيسي" />
                          </SelectTrigger>
                          <SelectContent>
                            {mainBoards.map(board => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">عنوان القسم الفرعي</label>
                        <Input
                          value={newSubBoardTitle}
                          onChange={(e) => setNewSubBoardTitle(e.target.value)}
                          placeholder="أدخل عنوان القسم الفرعي"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">الوصف (اختياري)</label>
                        <Textarea
                          value={newSubBoardDescription}
                          onChange={(e) => setNewSubBoardDescription(e.target.value)}
                          placeholder="أدخل وصف القسم الفرعي"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddSubBoard} className="flex-1">
                          إضافة القسم الفرعي
                        </Button>
                        <Button variant="outline" onClick={() => setNewSubBoardOpen(false)}>
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* إضافة مهام متعددة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" />
                  إضافة مهام متعددة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    if (mainBoards.length > 0) {
                      onBulkAdd(mainBoards[0].id);
                    } else {
                      showToast('لا توجد أقسام متاحة', 'error');
                    }
                  }}
                >
                  <Layers className="h-4 w-4 ml-2" />
                  إضافة مهام متعددة
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
