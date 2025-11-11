-- ============================================================================
-- Add Comments Table for Voting Sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.voting_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voting_comments_session_id ON public.voting_comments(session_id);
CREATE INDEX idx_voting_comments_user_id ON public.voting_comments(user_id);
CREATE INDEX idx_voting_comments_created_at ON public.voting_comments(created_at);

-- Table for comment likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.voting_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Disable RLS
ALTER TABLE public.voting_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.voting_comments TO authenticated, anon;
GRANT ALL ON public.comment_likes TO authenticated, anon;

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.voting_comments
        SET likes_count = (
            SELECT COUNT(*) FROM public.comment_likes
            WHERE comment_id = NEW.comment_id
        )
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.voting_comments
        SET likes_count = (
            SELECT COUNT(*) FROM public.comment_likes
            WHERE comment_id = OLD.comment_id
        )
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update likes count
CREATE TRIGGER update_comment_likes_trigger
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_likes_count();

SELECT '✅ Comments table created successfully!' as status;

