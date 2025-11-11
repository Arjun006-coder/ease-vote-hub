import { useState, useEffect } from "react";
import { Navbar } from "@/components/Layout/Navbar";
import { Home, Vote, History, User, LogOut, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const viewParam = searchParams.get("view") || "dashboard";
  const [activeView, setActiveView] = useState(viewParam);
  const [votingSessions, setVotingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({ votesToday: 0, totalVotes: 0 });
  const [voteHistory, setVoteHistory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    user_type: "",
    year: "",
    section: "",
    club: "",
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        full_name: userProfile.full_name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        department: userProfile.department || "",
        user_type: userProfile.user_type || "",
        year: userProfile.year?.toString() || "",
        section: userProfile.section || "",
        club: userProfile.club || "",
      });
    }
  }, [userProfile]);

  useEffect(() => {
    fetchVotingSessions();
  }, []);

  useEffect(() => {
    const view = searchParams.get("view") || "dashboard";
    setActiveView(view);
  }, [searchParams]);

  const fetchVotingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('voting_sessions')
        .select('*')
        .in('status', ['active', 'ended'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVotingSessions(data || []);
    } catch (error) {
      console.error('Error fetching voting sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get votes cast today
        const { data: votesToday, error: todayError } = await supabase
          .from('votes')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_valid', true)
          .gte('voted_at', today.toISOString());

        // Get total votes
        const { data: totalVotes, error: totalError } = await supabase
          .from('votes')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_valid', true);

        if (!todayError && !totalError) {
          setStatsData({
            votesToday: votesToday?.length || 0,
            totalVotes: totalVotes?.length || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Fetch user's vote history from database
  useEffect(() => {
    const fetchVoteHistory = async () => {
      if (!user?.id) return;

      try {
        // Fetch votes cast by this user
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select(`
            id,
            voted_at,
            session_id,
            option_id,
            voting_sessions (
              id,
              title,
              status,
              actual_end
            ),
            voting_options (
              id,
              option_text
            )
          `)
          .eq('user_id', user.id)
          .eq('is_valid', true)
          .order('voted_at', { ascending: false })
          .limit(10);

        if (votesError) throw votesError;

        // Transform votes into vote history format
        // For each vote, we need to fetch the session results to get winner and total votes
        const historyPromises = (votes || []).map(async (vote: any) => {
          const session = vote.voting_sessions;
          const option = vote.voting_options;
          
          // Fetch results for this session to get winner and total votes
          let winner = 'N/A';
          let totalVotes = 0;
          
          if (session?.id) {
            try {
              // Fetch all votes for this session
              const { data: sessionVotes, error: votesError } = await supabase
                .from('votes')
                .select('option_id')
                .eq('session_id', session.id)
                .eq('is_valid', true);
              
              if (!votesError && sessionVotes) {
                totalVotes = sessionVotes.length;
                
                // Calculate winner (option with most votes)
                const voteCounts: { [key: string]: number } = {};
                sessionVotes.forEach((v: any) => {
                  voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1;
                });
                
                // Find option with max votes
                const voteCountValues = Object.values(voteCounts);
                if (voteCountValues.length > 0) {
                  const maxVotes = Math.max(...voteCountValues);
                  const winnerOptionId = Object.keys(voteCounts).find(
                    key => voteCounts[key] === maxVotes
                  );
                  
                  if (winnerOptionId && maxVotes > 0) {
                  // Fetch winner option text
                  const { data: winnerOption } = await supabase
                    .from('voting_options')
                    .select('option_text')
                    .eq('id', winnerOptionId)
                    .single();
                  
                  if (winnerOption) {
                    // Check for ties
                    const winnersCount = Object.values(voteCounts).filter(
                      count => count === maxVotes
                    ).length;
                    
                    if (winnersCount > 1) {
                      winner = 'Tie';
                    } else {
                      winner = winnerOption.option_text;
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching session results:', error);
            }
          }
          
          return {
            id: vote.id,
            title: session?.title || 'Unknown Session',
            date: new Date(vote.voted_at).toLocaleDateString(),
            selected: option?.option_text || 'Unknown Option',
            sessionId: vote.session_id,
            votedAt: vote.voted_at,
            winner: winner,
            totalVotes: totalVotes,
          };
        });
        
        const history = await Promise.all(historyPromises);

        setVoteHistory(history);

        // Create recent activity from votes
        const activity = (votes || []).slice(0, 5).map((vote: any) => {
          const session = vote.voting_sessions;
          const timeAgo = getTimeAgo(new Date(vote.voted_at));
          return {
            action: `Voted in ${session?.title || 'election'}`,
            time: timeAgo,
          };
        });

        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching vote history:', error);
        // Set empty arrays on error
        setVoteHistory([]);
        setRecentActivity([]);
      }
    };

    if (user) {
      fetchVoteHistory();
    }
  }, [user]);

  const stats = [
    { label: "Votes Cast Today", value: statsData?.votesToday?.toString() || "0", color: "text-success" },
    { label: "Active Sessions", value: loading ? "..." : votingSessions.length.toString(), color: "text-primary" },
    { label: "Vote History", value: statsData?.totalVotes?.toString() || "0", color: "text-warning" },
    { label: "Pending Verifications", value: userProfile?.id_card_verified && userProfile?.email_verified ? "0" : "1", color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 glass-card border-r border-white/20 min-h-[calc(100vh-73px)] p-4">
          <nav className="space-y-2">
            <Button
              variant={activeView === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("dashboard")}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeView === "active-votes" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("active-votes")}
            >
              <Vote className="w-4 h-4 mr-2" />
              Active Votes
            </Button>
            <Button
              variant={activeView === "history" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("history")}
            >
              <History className="w-4 h-4 mr-2" />
              Vote History
            </Button>
            <Button
              variant={activeView === "profile" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("profile")}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <div className="pt-4 border-t border-white/20">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeView === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Welcome back, {userProfile?.full_name || "User"}! 👋
                </h1>
                <p className="text-white/70">Here's your voting overview</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="glass-card border-white/20 hover-scale">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-white/70">
                          {stat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <motion.div 
                          className={`text-3xl font-bold ${stat.color}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                        >
                          {stat.value}
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Active Voting Sessions */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Active Voting Sessions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <p className="text-white/70">Loading...</p>
                  ) : votingSessions.length === 0 ? (
                    <p className="text-white/70">No active voting sessions</p>
                  ) : (
                    votingSessions.slice(0, 2).map((vote) => (
                    <Card
                      key={vote.id}
                      className="glass-card border-white/20 hover-scale hover-glow cursor-pointer"
                      onClick={() => {
                        // If vote is ended, go to results page; otherwise go to vote page
                        if (vote.status === 'ended') {
                          navigate(`/results/${vote.id}`);
                        } else {
                          navigate(`/vote/${vote.id}`);
                        }
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white">{vote.title}</CardTitle>
                            <CardDescription className="text-white/70 mt-2">
                              {vote.description || "No description"}
                            </CardDescription>
                          </div>
                          <Badge className="bg-success text-white">{vote.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {vote.scheduled_end && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">Ends:</span>
                              <span className="text-warning font-semibold">
                                {new Date(vote.scheduled_end).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {vote.criteria && (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(vote.criteria).map(([key, value]: [string, any]) => (
                                <Badge
                                  key={key}
                                  variant="outline"
                                  className="border-white/30 text-white/90"
                                >
                                  {key}: {Array.isArray(value) ? value.join(", ") : value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                    )
                  ))}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                        <div className="flex-1">
                          <p className="text-white">{activity.action}</p>
                          <p className="text-sm text-white/50">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeView === "active-votes" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-bold text-white">Active Votes</h1>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      placeholder="Search votes..."
                      className="pl-10 bg-white/10 border-white/30 text-white w-64"
                    />
                  </div>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <p className="text-white/70">Loading...</p>
                ) : votingSessions.length === 0 ? (
                  <p className="text-white/70">No active voting sessions</p>
                ) : (
                  votingSessions.map((vote) => (
                    <Card
                      key={vote.id}
                      className="glass-card border-white/20 hover-scale cursor-pointer"
                      onClick={() => {
                        // If vote is ended, go to results page; otherwise go to vote page
                        if (vote.status === 'ended') {
                          navigate(`/results/${vote.id}`);
                        } else {
                          navigate(`/vote/${vote.id}`);
                        }
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white mb-2">{vote.title}</CardTitle>
                            <CardDescription className="text-white/70">
                              {vote.description || "No description"}
                            </CardDescription>
                          </div>
                          <Badge className="bg-success text-white ml-4">{vote.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {vote.scheduled_end && (
                            <div>
                              <p className="text-sm text-white/70 mb-1">Ends</p>
                              <p className="text-warning font-semibold text-lg">
                                {new Date(vote.scheduled_end).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {vote.criteria && (
                            <div>
                              <p className="text-sm text-white/70 mb-1">Criteria</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(vote.criteria).map(([key, value]: [string, any]) => (
                                  <Badge
                                    key={key}
                                    variant="outline"
                                    className="border-white/30 text-white/90 text-xs"
                                  >
                                    {key}: {Array.isArray(value) ? value.join(", ") : value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeView === "history" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold text-white">Vote History</h1>

              <div className="space-y-4">
                {voteHistory.map((vote) => (
                  <Card key={vote.id} className="glass-card border-white/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white">{vote.title}</CardTitle>
                          <CardDescription className="text-white/70">
                            Voted on {vote.date}
                          </CardDescription>
                        </div>
                        <Badge className="bg-white/20 text-white border border-white/30">Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/20">
                          <p className="text-sm text-white/70 mb-1">Your Vote</p>
                          <p className="text-white font-semibold text-lg">
                            {vote.selected}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/70">Winner</p>
                            <p className="text-success font-semibold">{vote.winner}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white/70">Total Votes</p>
                            <p className="text-white font-semibold">{vote.totalVotes}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-white/30 text-white hover:bg-white/10"
                          onClick={() => navigate(`/results/${vote.sessionId}`)}
                        >
                          View Full Results
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold text-white">Profile</h1>

              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-white text-2xl">
                        {userProfile?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold text-xl">
                        {userProfile?.full_name || "User"}
                      </p>
                      <p className="text-white/70">{userProfile?.email || ""}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <Label className="text-white/70 text-sm">Full Name</Label>
                      <Input
                        value={profileData.full_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, full_name: e.target.value })
                        }
                        className="mt-1 bg-white/10 border-white/30 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Email</Label>
                      <Input
                        value={profileData.email}
                        disabled
                        className="mt-1 bg-white/5 border-white/20 text-white/50"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Phone</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        className="mt-1 bg-white/10 border-white/30 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Department</Label>
                      <Input
                        value={profileData.department}
                        disabled
                        className="mt-1 bg-white/5 border-white/20 text-white/50"
                      />
                    </div>
                    {userProfile?.user_type === "student" && (
                      <>
                        <div>
                          <Label className="text-white/70 text-sm">Year</Label>
                          <Input
                            value={profileData.year}
                            disabled
                            className="mt-1 bg-white/5 border-white/20 text-white/50"
                          />
                        </div>
                        <div>
                          <Label className="text-white/70 text-sm">Section</Label>
                          <Input
                            value={profileData.section}
                            disabled
                            className="mt-1 bg-white/5 border-white/20 text-white/50"
                          />
                        </div>
                        {profileData.club && (
                          <div>
                            <Label className="text-white/70 text-sm">Club</Label>
                            <Input
                              value={profileData.club}
                              disabled
                              className="mt-1 bg-white/5 border-white/20 text-white/50"
                            />
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <Label className="text-white/70 text-sm">User Type</Label>
                      <Input
                        value={profileData.user_type || ""}
                        disabled
                        className="mt-1 bg-white/5 border-white/20 text-white/50 capitalize"
                      />
                    </div>
                  </div>

                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from("users")
                          .update({
                            full_name: profileData.full_name,
                            phone: profileData.phone,
                          })
                          .eq("id", user?.id);

                        if (error) throw error;

                        await refreshProfile();
                        toast({
                          title: "Profile updated",
                          description: "Your profile has been successfully updated.",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to update profile",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">ID Verification Status</CardTitle>
                    <Badge
                      className={
                        userProfile?.id_card_verified
                          ? "bg-success text-white"
                          : "bg-warning text-white"
                      }
                    >
                      {userProfile?.id_card_verified ? "✓ Verified" : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70">
                    {userProfile?.id_card_verified
                      ? "Your ID has been verified. You can participate in all voting sessions."
                      : "Your ID verification is pending. Please complete ID verification to participate in voting sessions."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};


export default Dashboard;
