-- Function to get poll results
-- Returns array of option_id and count
CREATE OR REPLACE FUNCTION get_poll_results(announcement_id_param UUID)
RETURNS TABLE (
    option_id UUID,
    vote_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (to bypass RLS restriction on viewing others' votes)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        poll_option_id as option_id,
        COUNT(*) as vote_count
    FROM 
        announcement_interactions
    WHERE 
        announcement_id = announcement_id_param
        AND poll_option_id IS NOT NULL
    GROUP BY 
        poll_option_id;
END;
$$;
