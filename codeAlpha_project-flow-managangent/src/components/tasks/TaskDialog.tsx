import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useComments } from '@/hooks/useComments';
import { useTasks } from '@/hooks/useTasks';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskDialogProps {
  taskId: string | null;
  projectId: string | undefined;
  onClose: () => void;
}

export function TaskDialog({ taskId, projectId, onClose }: TaskDialogProps) {
  const { columns } = useTasks(projectId);
  const { comments, isLoading, createComment, isCreating } = useComments(taskId || undefined);
  const [newComment, setNewComment] = useState('');

  const task = columns.flatMap(c => c.tasks).find(t => t.id === taskId);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await createComment(newComment);
    setNewComment('');
  };

  if (!task) return null;

  return (
    <Dialog open={!!taskId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {task.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-3">Comments ({comments.length})</h4>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const initials = comment.user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.user?.full_name || 'User'}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) handleAddComment();
            }}
          />
          <Button onClick={handleAddComment} disabled={isCreating || !newComment.trim()} size="icon" className="flex-shrink-0">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
