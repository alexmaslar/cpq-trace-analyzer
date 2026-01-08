-- CPQ Trace Analyzer Database Schema
-- Initial migration for baseline storage and trace management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Traces table: stores raw trace files and parsed data
CREATE TABLE public.traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  raw_content TEXT NOT NULL,  -- The actual trace file content
  parsed_data JSONB,           -- ParsedTrace object (optional, can be regenerated)
  file_size INTEGER NOT NULL,  -- Size in bytes for quota management
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Baselines table: references to traces designated as baselines
CREATE TABLE public.baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  trace_id UUID REFERENCES public.traces(id) ON DELETE CASCADE NOT NULL,
  selection_path JSONB NOT NULL,  -- Array of {featureName, selectedValue, optionCount}
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

-- Traces indexes
CREATE INDEX idx_traces_user_id ON public.traces(user_id);
CREATE INDEX idx_traces_created_at ON public.traces(user_id, created_at DESC);

-- Baselines indexes
CREATE INDEX idx_baselines_user_id ON public.baselines(user_id);
CREATE INDEX idx_baselines_trace_id ON public.baselines(trace_id);
CREATE INDEX idx_baselines_created_at ON public.baselines(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on both tables
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baselines ENABLE ROW LEVEL SECURITY;

-- Traces policies: Users can only access their own traces
CREATE POLICY "Users can view own traces"
  ON public.traces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own traces"
  ON public.traces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own traces"
  ON public.traces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own traces"
  ON public.traces FOR DELETE
  USING (auth.uid() = user_id);

-- Baselines policies: Users can only access their own baselines
CREATE POLICY "Users can view own baselines"
  ON public.baselines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own baselines"
  ON public.baselines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own baselines"
  ON public.baselines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own baselines"
  ON public.baselines FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on traces
CREATE TRIGGER update_traces_updated_at
  BEFORE UPDATE ON public.traces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE QUOTA HELPER VIEWS
-- ============================================

-- View to check storage usage per user
CREATE OR REPLACE VIEW public.user_storage_usage AS
SELECT
  user_id,
  COUNT(*) as trace_count,
  SUM(file_size) as total_bytes,
  ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as total_mb
FROM public.traces
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON public.user_storage_usage TO authenticated;

-- Add RLS policy for the view
ALTER VIEW public.user_storage_usage SET (security_invoker = true);
