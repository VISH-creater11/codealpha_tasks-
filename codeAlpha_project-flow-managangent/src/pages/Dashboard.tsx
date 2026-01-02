import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, FolderKanban, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

const PROJECT_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#6366F1', '#F43F5E'
];

export default function Dashboard() {
  const { projects, isLoading, createProject, deleteProject, isCreating } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', color: PROJECT_COLORS[0] });

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;
    await createProject(newProject);
    setNewProject({ name: '', description: '', color: PROJECT_COLORS[0] });
    setIsDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your team projects and tasks</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project to organize your tasks.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My awesome project"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this project about?"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full transition-transform ${newProject.color === color ? 'scale-110 ring-2 ring-offset-2 ring-primary' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewProject({ ...newProject, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateProject} disabled={isCreating || !newProject.name.trim()}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderKanban className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Create your first project to get started</p>
              <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <Link key={project.id} to={`/project/${project.id}`} className="block group">
                <Card className="h-full transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color }}>
                          <FolderKanban className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => { e.preventDefault(); deleteProject(project.id); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  {project.description && (
                    <CardContent>
                      <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
