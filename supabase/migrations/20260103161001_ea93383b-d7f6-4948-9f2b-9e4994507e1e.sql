-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create worries table for community feature
CREATE TABLE public.worries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_summary TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.worries ENABLE ROW LEVEL SECURITY;

-- RLS policies for worries
CREATE POLICY "Anyone can read worries"
ON public.worries
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert worries"
ON public.worries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update worries"
ON public.worries
FOR UPDATE
USING (true);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worry_id UUID REFERENCES public.worries(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments
CREATE POLICY "Anyone can read comments"
ON public.comments
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert comments"
ON public.comments
FOR INSERT
WITH CHECK (true);

-- Create updated_at trigger for worries
CREATE TRIGGER update_worries_updated_at
BEFORE UPDATE ON public.worries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();