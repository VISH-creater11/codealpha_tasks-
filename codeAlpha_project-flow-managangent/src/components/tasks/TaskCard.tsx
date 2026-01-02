import { TaskWithAssignee } from '@/types/database';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithAssignee;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDelete: () => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

export function TaskCard({ task, onClick, onDragStart, onDelete }: TaskCardProps) {
  const initials = task.assignee?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div
      className="task-card group"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground flex-1">{task.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', priorityColors[task.priority] || priorityColors.medium)}>
            {task.priority}
          </span>
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
        {task.assignee && (
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
