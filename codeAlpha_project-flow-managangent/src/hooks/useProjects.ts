import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Project, Column } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useProjects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });

  const createProjectMutation = useMutation({
    mutationFn: async ({ name, description, color }: { name: string; description?: string; color?: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name,
          description,
          color: color || '#3B82F6',
          owner_id: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add owner as project member
      await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'owner',
        });

      // Create default columns
      const defaultColumns = ['To Do', 'In Progress', 'Review', 'Done'];
      const columnsToInsert = defaultColumns.map((name, index) => ({
        project_id: project.id,
        name,
        position: index,
      }));

      await supabase.from('columns').insert(columnsToInsert);

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project created',
        description: 'Your new project is ready to go!',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create project',
        description: error.message,
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project updated',
        description: 'Changes saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update project',
        description: error.message,
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Project deleted',
        description: 'The project has been removed.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete project',
        description: error.message,
      });
    },
  });

  return {
    projects: projectsQuery.data || [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
  };
}
