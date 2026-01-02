-- Create security definer function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = _project_id AND p.owner_id = _user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = _project_id AND pm.user_id = _user_id
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view projects they are members of" ON public.projects;

-- Recreate project_members SELECT policy using security definer function
CREATE POLICY "Members can view project members" 
ON public.project_members 
FOR SELECT 
USING (public.is_project_member(auth.uid(), project_id));

-- Recreate projects SELECT policy using security definer function  
CREATE POLICY "Users can view projects they are members of" 
ON public.projects 
FOR SELECT 
USING (owner_id = auth.uid() OR public.is_project_member(auth.uid(), id));