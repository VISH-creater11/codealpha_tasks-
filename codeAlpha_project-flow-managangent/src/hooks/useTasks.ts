import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Task, Column, ColumnWithTasks, Profile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function useTasks(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch columns with tasks
  const columnsQuery = useQuery({
    queryKey: ['columns', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('project_id', projectId)
        .order('position');

      if (columnsError) throw columnsError;

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('position');

      if (tasksError) throw tasksError;

      // Fetch profiles for assignees
      const assigneeIds = [...new Set(tasks.filter(t => t.assignee_id).map(t => t.assignee_id))];
      let profiles: Profile[] = [];
      
      if (assigneeIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', assigneeIds);
        profiles = profileData || [];
      }

      // Map tasks to columns
      const columnsWithTasks: ColumnWithTasks[] = columns.map(column => ({
        ...column,
        tasks: tasks
          .filter(task => task.column_id === column.id)
          .map(task => ({
            ...task,
            assignee: profiles.find(p => p.id === task.assignee_id) || null,
          })),
      }));

      return columnsWithTasks;
    },
    enabled: !!projectId && !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async ({ columnId, title, description, priority, dueDate, assigneeId }: {
      columnId: string;
      title: string;
      description?: string;
      priority?: Task['priority'];
      dueDate?: string;
      assigneeId?: string;
    }) => {
      if (!user || !projectId) throw new Error('Not authenticated');

      // Get max position in column
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('position')
        .eq('column_id', columnId)
        .order('position', { ascending: false })
        .limit(1);

      const position = existingTasks && existingTasks.length > 0 
        ? existingTasks[0].position + 1 
        : 0;

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          column_id: columnId,
          project_id: projectId,
          title,
          description,
          priority: priority || 'medium',
          due_date: dueDate,
          assignee_id: assigneeId,
          created_by: user.id,
          position,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
      toast({
        title: 'Task created',
        description: 'Your task has been added to the board.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create task',
        description: error.message,
      });
    },
  });

  // Update task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update task',
        description: error.message,
      });
    },
  });

  // Move task
  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, targetColumnId, targetPosition }: {
      taskId: string;
      targetColumnId: string;
      targetPosition: number;
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update({
          column_id: targetColumnId,
          position: targetPosition,
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to move task',
        description: error.message,
      });
    },
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', projectId] });
      toast({
        title: 'Task deleted',
        description: 'The task has been removed.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete task',
        description: error.message,
      });
    },
  });

  return {
    columns: columnsQuery.data || [],
    isLoading: columnsQuery.isLoading,
    error: columnsQuery.error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    moveTask: moveTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
  };
}
