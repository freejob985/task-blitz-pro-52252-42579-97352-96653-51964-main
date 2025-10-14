// شريط البحث والفلاتر
import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Task, Board } from '@/types';

export interface FilterState {
  status: Task['status'][];
  priority: Task['priority'][];
  tags: string[];
  boardId: string | null;
  boardCategory: string | null;
  showFavoritesOnly: boolean;
  overdue: boolean;
}

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  boards: Board[];
  allTags: string[];
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  boards,
  allTags,
}: SearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFiltersCount = 
    filters.status.length +
    filters.priority.length +
    filters.tags.length +
    (filters.boardId ? 1 : 0) +
    (filters.boardCategory ? 1 : 0) +
    (filters.showFavoritesOnly ? 1 : 0) +
    (filters.overdue ? 1 : 0);

  const handleStatusToggle = (status: Task['status']) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handlePriorityToggle = (priority: Task['priority']) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: newPriority });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleBoardCategoryChange = (category: string) => {
    onFiltersChange({ 
      ...filters, 
      boardCategory: category === 'all' ? null : category,
      boardId: null // Clear board selection when changing category
    });
  };

  const handleFavoritesToggle = () => {
    onFiltersChange({ 
      ...filters, 
      showFavoritesOnly: !filters.showFavoritesOnly 
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      tags: [],
      boardId: null,
      boardCategory: null,
      showFavoritesOnly: false,
      overdue: false,
    });
  };

  const categories = [...new Set(boards.map(b => b.category).filter(Boolean))];
  const favoriteBoards = boards.filter(b => b.isFavorite);

  return (
    <div className="flex gap-2 items-center">
      {/* بحث */}
      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث في المهام..."
          className="pr-10"
          dir="rtl"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* فلاتر */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 relative">
            <Filter className="h-4 w-4" />
            فلاتر
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start" dir="rtl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-cairo font-semibold">الفلاتر</h3>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  مسح الكل
                </Button>
              )}
            </div>

            {/* فلتر القسم */}
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select
                value={filters.boardId || 'all'}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, boardId: v === 'all' ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأقسام</SelectItem>
                  {(filters.showFavoritesOnly ? favoriteBoards : boards)
                    .filter(board => !filters.boardCategory || board.category === filters.boardCategory)
                    .map(board => (
                    <SelectItem key={board.id} value={board.id}>
                      <div className="flex items-center gap-2">
                        {board.color && (
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: board.color }}
                          />
                        )}
                        <span>{board.title}</span>
                        {board.isFavorite && <span>⭐</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فلتر فئة القسم */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>فئة القسم</Label>
                <Select
                  value={filters.boardCategory || 'all'}
                  onValueChange={handleBoardCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفئات</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* فلتر المفضلة */}
            {favoriteBoards.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="favorites-only"
                  checked={filters.showFavoritesOnly}
                  onCheckedChange={handleFavoritesToggle}
                />
                <Label htmlFor="favorites-only" className="cursor-pointer">
                  الأقسام المفضلة فقط ({favoriteBoards.length})
                </Label>
              </div>
            )}

            {/* فلتر الحالة */}
            <div className="space-y-2">
              <Label>الحالة</Label>
              <div className="space-y-2">
                {[
                  { value: 'working', label: 'قيد العمل' },
                  { value: 'waiting', label: 'بانتظار' },
                  { value: 'frozen', label: 'مجمّد' },
                  { value: 'completed', label: 'مكتمل' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${value}`}
                      checked={filters.status.includes(value as Task['status'])}
                      onCheckedChange={() => handleStatusToggle(value as Task['status'])}
                    />
                    <Label htmlFor={`status-${value}`} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* فلتر الأولوية */}
            <div className="space-y-2">
              <Label>الأولوية</Label>
              <div className="space-y-2">
                {[
                  { value: 'high', label: 'عالية' },
                  { value: 'medium', label: 'متوسطة' },
                  { value: 'low', label: 'منخفضة' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center gap-2">
                    <Checkbox
                      id={`priority-${value}`}
                      checked={filters.priority.includes(value as Task['priority'])}
                      onCheckedChange={() => handlePriorityToggle(value as Task['priority'])}
                    />
                    <Label htmlFor={`priority-${value}`} className="cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* فلتر متأخر */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="overdue"
                checked={filters.overdue}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, overdue: !!checked })
                }
              />
              <Label htmlFor="overdue" className="cursor-pointer">
                المهام المتأخرة فقط
              </Label>
            </div>

            {/* فلتر الوسوم */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label>الوسوم</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
