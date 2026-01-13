-- Add new columns to worries table
ALTER TABLE public.worries 
ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'web',
ADD COLUMN IF NOT EXISTS use_summary boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

-- Add comment_count to worries for efficient querying
ALTER TABLE public.worries
ADD COLUMN IF NOT EXISTS comment_count integer NOT NULL DEFAULT 0;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_worries_status ON public.worries(status);

-- Create function to update comment count
CREATE OR REPLACE FUNCTION public.update_worry_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.worries 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.worry_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.worries 
    SET comment_count = comment_count - 1 
    WHERE id = OLD.worry_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic comment count update
DROP TRIGGER IF EXISTS trigger_update_worry_comment_count ON public.comments;
CREATE TRIGGER trigger_update_worry_comment_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_worry_comment_count();