import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Clock, TrendingUp, Download, Share2, Loader2, MessageSquare, ThumbsUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#3b82f6", "#ef4444"];

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [voteSession, setVoteSession] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<any>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchResults();
      fetchComments();
    }
  }, [id, user]);

  const fetchResults = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch voting session
      const { data: session, error: sessionError } = await supabase
        .from('voting_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;
      setVoteSession(session);

      // Fetch voting options with vote counts
      const { data: options, error: optionsError } = await supabase
        .from('voting_options')
        .select('*')
        .eq('session_id', id)
        .order('option_order', { ascending: true });

      if (optionsError) throw optionsError;

      // Fetch votes for this session
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*, voting_options(option_text)')
        .eq('session_id', id)
        .eq('is_valid', true);

      if (votesError) throw votesError;

      // Calculate results for each option
      const voteCounts: { [key: string]: number } = {};
      const uniqueVoters = new Set<string>();

      (votes || []).forEach((vote: any) => {
        voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1;
        if (vote.user_id) {
          uniqueVoters.add(vote.user_id);
        }
      });

      const total = votes?.length || 0;
      setTotalVotes(total);
      setTotalParticipants(uniqueVoters.size);

      // Build results array
      const resultsData = (options || []).map((option: any, index: number) => {
        const votes = voteCounts[option.id] || 0;
        const percentage = total > 0 ? (votes / total) * 100 : 0;
        return {
          id: option.id,
          name: option.option_text,
          votes,
          percentage: parseFloat(percentage.toFixed(2)),
          color: COLORS[index % COLORS.length],
        };
      });

      setResults(resultsData);

      // Fetch user's vote if logged in
      if (user?.id) {
        const userVoteData = votes?.find((v: any) => v.user_id === user.id);
        if (userVoteData) {
          setUserVote(userVoteData);
        }
      }

      // Build timeline (votes over time)
      if (votes && votes.length > 0) {
        const timelineMap: { [key: string]: number } = {};
        votes.forEach((vote: any) => {
          if (vote.voted_at) {
            const date = new Date(vote.voted_at);
            const hour = date.getHours();
            const timeLabel = `${hour}:00`;
            timelineMap[timeLabel] = (timelineMap[timeLabel] || 0) + 1;
          }
        });

        const timelineData = Object.entries(timelineMap)
          .map(([time, count]) => ({ time, votes: count }))
          .sort((a, b) => a.time.localeCompare(b.time));

        // Add final count
        timelineData.push({ time: 'Final', votes: total });
        setTimeline(timelineData);
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;

    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('voting_comments')
        .select(`
          *,
          users (id, full_name, email)
        `)
        .eq('session_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user?.id || !id) return;

    try {
      const { data, error } = await supabase
        .from('voting_comments')
        .insert({
          session_id: id,
          user_id: user.id,
          comment_text: newComment.trim(),
        })
        .select(`
          *,
          users (id, full_name, email)
        `)
        .single();

      if (error) throw error;

      setComments([data, ...comments]);
      setNewComment("");
      toast({
        title: "Comment posted!",
        description: "Your comment has been added.",
      });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user?.id) {
      toast({
        title: "Please login",
        description: "You must be logged in to like comments",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user already liked this comment
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // Refresh comments to update likes count
      fetchComments();
    } catch (error: any) {
      console.error('Error liking comment:', error);
    }
  };

  const checkUserLikedComment = async (commentId: string) => {
    if (!user?.id) return false;
    const { data } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();
    return !!data;
  };

  const getWinner = () => {
    if (results.length === 0 || totalVotes === 0) return null;
    
    // Don't show winner if there's only 1 vote (too early to declare a winner)
    // Only show winner if there are at least 2 votes
    if (totalVotes < 2) return null;
    
    // Only declare winner if there are votes and a clear winner (not a tie)
    const sortedResults = [...results].sort((a, b) => b.votes - a.votes);
    if (sortedResults.length > 0 && sortedResults[0].votes > 0) {
      // Check if there's a tie for first place
      const topVotes = sortedResults[0].votes;
      const winners = sortedResults.filter(r => r.votes === topVotes);
      // Only show winner if there's exactly one winner (no tie)
      if (winners.length === 1) {
        // Also check if the session has ended - if it's still active, don't show winner badge
        // (results can still change while voting is active)
        if (voteSession?.status === 'ended') {
          return sortedResults[0];
        }
        // For active sessions, only show winner if it's clearly leading (more than 50% of votes)
        const percentage = (sortedResults[0].votes / totalVotes) * 100;
        if (percentage > 50) {
          return sortedResults[0];
        }
      }
    }
    return null;
  };

  const getDuration = () => {
    if (!voteSession?.scheduled_start || !voteSession?.scheduled_end) return 'N/A';
    const start = new Date(voteSession.scheduled_start);
    const end = new Date(voteSession.scheduled_end);
    const diff = end.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getTurnout = () => {
    // This would require total eligible users, for now just show participants
    return totalParticipants;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!voteSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 mb-4">Voting session not found</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const winner = getWinner();

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="glass-card p-8 border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{voteSession.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-muted text-white">{voteSession.status}</Badge>
                  <span className="text-white/70">
                    {totalVotes} total votes cast
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Winner Announcement */}
          {winner && winner.votes > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 border-white/20 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-success/20 via-primary/20 to-warning/20"></div>
              <div className="relative z-10">
                <Trophy className="w-20 h-20 text-warning mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Winner</h2>
                <p className="text-5xl font-bold text-success mb-2">
                  {winner.name}
                </p>
                <p className="text-2xl text-white/90">
                  {winner.votes} votes ({winner.percentage}%)
                </p>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="glass-card border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {totalParticipants}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Votes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">
                  {totalVotes}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {getDuration()}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-white capitalize">
                  {voteSession.status}
                </div>
              </CardContent>
            </Card>
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar Chart */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Vote Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="name" stroke="#ffffff70" />
                      <YAxis stroke="#ffffff70" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(0,0,0,0.8)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                        {results.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="space-y-3 mt-6">
                    {results.map((result, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white font-medium">{result.name}</span>
                          <span className="text-white/70">
                            {result.votes} votes ({result.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: result.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Vote Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={results}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percentage }) => `${percentage.toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="votes"
                      >
                        {results.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(0,0,0,0.8)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex justify-center gap-6 mt-4 flex-wrap">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: result.color }}
                        ></div>
                        <span className="text-sm text-white/70">{result.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Voting Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="time" stroke="#ffffff70" />
                    <YAxis stroke="#ffffff70" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="votes"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Your Vote */}
          {userVote && (
            <Card className="glass-card border-white/20 border-2 border-primary/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  Your Vote
                  <Badge className="bg-primary text-white">Recorded</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {userVote.voting_options?.option_text || 'Unknown'}
                    </p>
                    <p className="text-sm text-white/70">
                      Cast on {new Date(userVote.voted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Discussion ({comments.length} {comments.length === 1 ? 'comment' : 'comments'})
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => setShowComments(!showComments)}
                >
                  {showComments ? "Hide" : "Show"}
                </Button>
              </CardTitle>
            </CardHeader>
            {showComments && (
              <CardContent className="space-y-4">
                {/* Post Comment */}
                {user && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Share your thoughts..."
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={handlePostComment}
                      className="bg-primary hover:bg-primary/90"
                      disabled={!newComment.trim()}
                    >
                      Post Comment
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                {loadingComments ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-white/70">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-white/20">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="p-4 rounded-lg bg-white/5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-semibold text-white">
                              {comment.users?.full_name || comment.users?.email || 'Anonymous'}
                            </span>
                            <span className="text-xs text-white/50 ml-2">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-white/70 text-sm mb-3">{comment.comment_text}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/70 hover:text-white hover:bg-white/10 h-auto p-1"
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {comment.likes_count || 0}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
