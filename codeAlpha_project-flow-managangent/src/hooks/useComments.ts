import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Comment, Profile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface CommentWithUser extends Comment {
  user?: Profile;
}

export function useComments(taskId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      return comments.map(comment => ({
        ...comment,
        user: profiles?.find(p => p.id === comment.user_id),
      })) as CommentWithUser[];
    },
    enabled: !!taskId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !taskId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to add comment',
        description: error.message,
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete comment',
        description: error.message,
      });
    },
  });

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    createComment: createCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    isCreating: createCommentMutation.isPending,
  };
}
