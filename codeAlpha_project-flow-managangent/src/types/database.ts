export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Column {
  id: string;
  project_id: string;
  name: string;
  position: number;
  created_at: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  column_id: string;
  project_id: string;
  title: string;
  description: string | null;
  position: number;
  priority: Priority;
  due_date: string | null;
  assignee_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface TaskWithAssignee extends Omit<Task, 'priority'> {
  priority: string;
  assignee?: Profile | null;
}

export interface ColumnWithTasks extends Column {
  tasks: TaskWithAssignee[];
}

export interface ProjectWithMembers extends Project {
  members?: (ProjectMember & { profile?: Profile })[];
}
