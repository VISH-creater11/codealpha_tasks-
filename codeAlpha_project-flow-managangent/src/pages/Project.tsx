import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';

export default function Project() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { columns, isLoading, createTask, moveTask, deleteTask } = useTasks(id);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const project = projects.find(p => p.id === id);

  const handleAddTask = async (columnId: string) => {
    if (!newTaskTitle.trim()) return;
    await createTask({ columnId, title: newTaskTitle });
    setNewTaskTitle('');
    setAddingToColumn(null);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      await moveTask({ taskId, targetColumnId: columnId, targetPosition: 0 });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Project Header */}
        <div className="px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: project?.color || '#3B82F6' }} />
              <div>
                <h1 className="text-xl font-bold">{project?.name || 'Project'}</h1>
                {project?.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full">
            {columns.map((column) => (
              <div
                key={column.id}
                className="kanban-column w-80 flex-shrink-0"
                onDrop={(e) => handleDrop(e, column.id)}
                onDragOver={handleDragOver}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-foreground">{column.name}</h3>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                    {column.tasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {column.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task.id)}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                </div>

                {addingToColumn === column.id ? (
                  <div className="mt-2 space-y-2">
                    <input
                      autoFocus
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter task title..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(column.id);
                        if (e.key === 'Escape') setAddingToColumn(null);
                      }}
                      onBlur={() => !newTaskTitle && setAddingToColumn(null)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAddTask(column.id)}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingToColumn(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 justify-start text-muted-foreground"
                    onClick={() => setAddingToColumn(column.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add task
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <TaskDialog
        taskId={selectedTask}
        projectId={id}
        onClose={() => setSelectedTask(null)}
      />
    </AppLayout>
  );
}
