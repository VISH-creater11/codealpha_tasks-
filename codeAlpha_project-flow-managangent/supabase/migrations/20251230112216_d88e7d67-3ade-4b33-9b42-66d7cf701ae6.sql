-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create project members table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Create columns table for kanban boards
CREATE TABLE public.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view projects they are members of" ON public.projects 
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners can update" ON public.projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Project owners can delete" ON public.projects FOR DELETE USING (owner_id = auth.uid());

-- Project members policies
CREATE POLICY "Members can view project members" ON public.project_members 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid())))
  );
CREATE POLICY "Project owners can manage members" ON public.project_members 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );
CREATE POLICY "Project owners can remove members" ON public.project_members 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()) OR user_id = auth.uid()
  );

-- Columns policies
CREATE POLICY "Project members can view columns" ON public.columns 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = columns.project_id AND user_id = auth.uid())))
  );
CREATE POLICY "Project members can create columns" ON public.columns 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = columns.project_id AND user_id = auth.uid())))
  );
CREATE POLICY "Project members can update columns" ON public.columns 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = columns.project_id AND user_id = auth.uid())))
  );
CREATE POLICY "Project members can delete columns" ON public.columns 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = columns.project_id AND user_id = auth.uid())))
  );

-- Tasks policies
CREATE POLICY "Project members can view tasks" ON public.tasks 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())))
  );
CREATE POLICY "Project members can create tasks" ON public.tasks 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())))
  );
CREATE POLICY "Project members can update tasks" ON public.tasks 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())))
  );
CREATE POLICY "Project members can delete tasks" ON public.tasks 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid())))
  );

-- Comments policies
CREATE POLICY "Project members can view comments" ON public.comments 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks t JOIN public.projects p ON t.project_id = p.id WHERE t.id = task_id AND (p.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
  );
CREATE POLICY "Project members can create comments" ON public.comments 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.tasks t JOIN public.projects p ON t.project_id = p.id WHERE t.id = task_id AND (p.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())))
  );
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Enable realtime for tasks and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();