-- Allow public insert for saju_requests (no auth required for fortune telling)
CREATE POLICY "Allow public insert for saju_requests"
ON public.saju_requests
FOR INSERT
WITH CHECK (true);

-- Allow public select for saju_requests
CREATE POLICY "Allow public select for saju_requests"
ON public.saju_requests
FOR SELECT
USING (true);

-- Allow public insert for compatibility_requests
CREATE POLICY "Allow public insert for compatibility_requests"
ON public.compatibility_requests
FOR INSERT
WITH CHECK (true);

-- Allow public select for compatibility_requests
CREATE POLICY "Allow public select for compatibility_requests"
ON public.compatibility_requests
FOR SELECT
USING (true);