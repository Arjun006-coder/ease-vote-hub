import { useState, useEffect } from "react";
import { Navbar } from "@/components/Layout/Navbar";
import {
  LayoutDashboard,
  Vote,
  Plus,
  Users,
  Shield,
  BarChart,
  Settings,
  MoreVertical,
  Download,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { CreateVoteForm } from "@/components/CreateVoteForm";

const Admin = () => {
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("overview");
  const [showCreateVoteForm, setShowCreateVoteForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalVotes: 0,
    pendingVerifications: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentVotes, setRecentVotes] = useState<any[]>([]);
  const [allVotingSessions, setAllVotingSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);

  // Additional safety check (AdminRoute already handles this, but this is a backup)
  useEffect(() => {
    if (userProfile) {
      const isAdmin = userProfile.role === 'admin' || userProfile.role === 'moderator';
      if (!isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin panel.',
          variant: 'destructive',
        });
        navigate('/dashboard', { replace: true });
      }
    }
  }, [userProfile, navigate, toast]);

  // Fetch all admin data
  useEffect(() => {
    if (userProfile && (userProfile.role === 'admin' || userProfile.role === 'moderator')) {
      fetchAdminData();
    }
  }, [userProfile]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchVotingSessions(),
        fetchUsers(),
        fetchVerifications(),
        fetchChartData(),
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Active sessions
      const { count: activeSessions, error: sessionsError } = await supabase
        .from('voting_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (sessionsError) throw sessionsError;

      // Total votes
      const { count: totalVotes, error: votesError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('is_valid', true);

      if (votesError) throw votesError;

      // Pending verifications (users not verified)
      const { count: pendingVerifications, error: verificationsError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .or('id_card_verified.eq.false,email_verified.eq.false');

      if (verificationsError) throw verificationsError;

      setStats({
        totalUsers: totalUsers || 0,
        activeSessions: activeSessions || 0,
        totalVotes: totalVotes || 0,
        pendingVerifications: pendingVerifications || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default values on error to prevent crashes
      setStats({
        totalUsers: 0,
        activeSessions: 0,
        totalVotes: 0,
        pendingVerifications: 0,
      });
    }
  };

  const fetchVotingSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('voting_sessions')
        .select(`
          *,
          voting_options (id),
          votes (id, user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Increased limit to show more sessions

      if (error) throw error;

      const sessions = (data || []).map((session: any) => {
        // Count unique voters
        const uniqueVoters = new Set();
        (session.votes || []).forEach((vote: any) => {
          if (vote.user_id) {
            uniqueVoters.add(vote.user_id);
          }
        });
        
        return {
          id: session.id,
          title: session.title,
          status: session.status,
          created: new Date(session.created_at).toLocaleDateString(),
          participants: uniqueVoters.size,
          votes: session.votes?.length || 0,
          scheduled_start: session.scheduled_start,
          scheduled_end: session.scheduled_end,
        };
      });

      setRecentVotes(sessions);
      setAllVotingSessions(data || []);
    } catch (error) {
      console.error('Error fetching voting sessions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          votes (id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const usersData = (data || []).map((user: any) => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email,
        phone: user.phone || 'N/A',
        registered: new Date(user.created_at).toLocaleDateString(),
        verified: user.id_card_verified && user.email_verified,
        totalVotes: user.votes?.length || 0,
        role: user.role,
        is_blocked: user.is_blocked,
      }));

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or('id_card_verified.eq.false,email_verified.eq.false')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const verificationsData = (data || []).map((user: any) => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email,
        submitted: new Date(user.created_at).toLocaleString(),
        status: !user.id_card_verified ? 'pending' : 'approved',
        id_card_image_url: user.id_card_image_url,
        id_card_verified: user.id_card_verified,
        email_verified: user.email_verified,
      }));

      setVerifications(verificationsData);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Get votes from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('votes')
        .select('voted_at')
        .eq('is_valid', true)
        .gte('voted_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      // Group by day
      const dayMap: { [key: string]: number } = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Initialize with 0 for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        dayMap[dayName] = 0;
      }

      // Count votes per day
      (data || []).forEach((vote: any) => {
        const date = new Date(vote.voted_at);
        const dayName = days[date.getDay()];
        dayMap[dayName] = (dayMap[dayName] || 0) + 1;
      });

      // Convert to array format
      const chartDataArray = Object.entries(dayMap).map(([day, votes]) => ({
        day,
        votes,
      }));

      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const handleCreateVoteSuccess = () => {
    setShowCreateVoteForm(false);
    fetchAdminData(); // Refresh data after creating vote
    toast({
      title: 'Success',
      description: 'Voting session created successfully',
    });
  };

  const handleActivateVote = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('voting_sessions')
        .update({ 
          status: 'active',
          actual_start: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Voting session activated successfully',
      });
      fetchVotingSessions();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate voting session',
        variant: 'destructive',
      });
    }
  };

  const handleEndVote = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('voting_sessions')
        .update({ 
          status: 'ended',
          actual_end: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Voting session ended successfully',
      });
      
      // Refresh all data
      await Promise.all([
        fetchVotingSessions(),
        fetchStats(),
      ]);
    } catch (error: any) {
      console.error('Error ending vote:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to end voting session',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVote = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this voting session?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('voting_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Voting session deleted successfully',
      });
      fetchVotingSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete voting session',
        variant: 'destructive',
      });
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_blocked: !isBlocked })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${!isBlocked ? 'blocked' : 'unblocked'} successfully`,
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleApproveVerification = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          id_card_verified: true,
          email_verified: true,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User verification approved',
      });
      fetchVerifications();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve verification',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      {showCreateVoteForm && (
        <CreateVoteForm 
          onClose={() => {
            setShowCreateVoteForm(false);
            fetchAdminData(); // Refresh data after closing form
          }} 
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 glass-card border-r border-white/20 min-h-[calc(100vh-73px)] p-4">
          <nav className="space-y-2">
            <Button
              variant={activeView === "overview" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("overview")}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeView === "manage-votes" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("manage-votes")}
            >
              <Vote className="w-4 h-4 mr-2" />
              Manage Votes
            </Button>
            <Button
              variant={activeView === "create-vote" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setShowCreateVoteForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Vote
            </Button>
            <Button
              variant={activeView === "users" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("users")}
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeView === "verifications" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("verifications")}
            >
              <Shield className="w-4 h-4 mr-2" />
              Verifications
            </Button>
            <Button
              variant={activeView === "analytics" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("analytics")}
            >
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={activeView === "settings" ? "default" : "ghost"}
              className="w-full justify-start text-white hover:bg-white/10"
              onClick={() => setActiveView("settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeView === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-white/70">Manage and monitor voting activities</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="glass-card border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">
                      {stats.totalUsers.toLocaleString()}
                    </div>
                    <p className="text-sm text-white/50">Registered users</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                      Active Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-success mb-1">
                      {stats.activeSessions}
                    </div>
                    <p className="text-sm text-white/50">Ongoing votes</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                      Total Votes Cast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-warning mb-1">
                      {stats.totalVotes.toLocaleString()}
                    </div>
                    <p className="text-sm text-white/50">All time votes</p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                      Pending Verifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-error mb-1">
                      {stats.pendingVerifications}
                    </div>
                    <p className="text-sm text-white/50">Awaiting approval</p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Votes Over Time (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="day" stroke="#ffffff70" />
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

              {/* Recent Voting Sessions */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Voting Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-white/70">Title</TableHead>
                        <TableHead className="text-white/70">Status</TableHead>
                        <TableHead className="text-white/70">Created</TableHead>
                        <TableHead className="text-white/70">Participants</TableHead>
                        <TableHead className="text-white/70">Votes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentVotes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-white/70 py-8">
                            No voting sessions yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentVotes.map((vote) => (
                          <TableRow key={vote.id} className="border-white/20">
                            <TableCell className="text-white font-medium">{vote.title}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  vote.status === "active"
                                    ? "bg-success text-white"
                                    : vote.status === "ended"
                                    ? "bg-muted text-white"
                                    : "bg-warning text-white"
                                }
                              >
                                {vote.status.charAt(0).toUpperCase() + vote.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white/70">{vote.created}</TableCell>
                            <TableCell className="text-white/70">{vote.participants}</TableCell>
                            <TableCell className="text-white/70">{vote.votes}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeView === "manage-votes" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-bold text-white">Manage Votes</h1>
                <Button 
                  className="bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowCreateVoteForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Vote
                </Button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    placeholder="Search votes..."
                    className="pl-10 bg-white/10 border-white/30 text-white"
                  />
                </div>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <Tabs defaultValue="active" className="w-full">
                <TabsList className="bg-white/10 mb-6">
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger
                    value="scheduled"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Scheduled
                  </TabsTrigger>
                  <TabsTrigger
                    value="ended"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Ended
                  </TabsTrigger>
                  <TabsTrigger
                    value="draft"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Draft
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <Card className="glass-card border-white/20">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20">
                            <TableHead className="text-white/70">Title</TableHead>
                            <TableHead className="text-white/70">Start Date</TableHead>
                            <TableHead className="text-white/70">End Date</TableHead>
                            <TableHead className="text-white/70">Participants</TableHead>
                            <TableHead className="text-white/70">Total Votes</TableHead>
                            <TableHead className="text-white/70">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allVotingSessions
                            .filter((v) => v.status === "active")
                            .length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-white/70 py-8">
                                No active voting sessions
                              </TableCell>
                            </TableRow>
                          ) : (
                            allVotingSessions
                              .filter((v) => v.status === "active")
                              .map((vote: any) => {
                                const uniqueVoters = new Set();
                                (vote.votes || []).forEach((v: any) => {
                                  if (v.user_id) uniqueVoters.add(v.user_id);
                                });
                                
                                return (
                                  <TableRow key={vote.id} className="border-white/20">
                                    <TableCell className="text-white font-medium">
                                      {vote.title}
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                      {vote.scheduled_start ? new Date(vote.scheduled_start).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                      {vote.scheduled_end ? new Date(vote.scheduled_end).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                      {uniqueVoters.size}
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                      {vote.votes?.length || 0}
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-white hover:bg-white/10"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="glass-card border-white/30">
                                          <DropdownMenuItem onClick={() => navigate(`/vote/${vote.id}`)}>
                                            View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleEndVote(vote.id)}>
                                            End Vote
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-error"
                                            onClick={() => handleDeleteVote(vote.id)}
                                          >
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="draft">
                  <Card className="glass-card border-white/20">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20">
                            <TableHead className="text-white/70">Title</TableHead>
                            <TableHead className="text-white/70">Start Date</TableHead>
                            <TableHead className="text-white/70">End Date</TableHead>
                            <TableHead className="text-white/70">Status</TableHead>
                            <TableHead className="text-white/70">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allVotingSessions
                            .filter((v) => v.status === "draft")
                            .length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-white/70 py-8">
                                No draft voting sessions
                              </TableCell>
                            </TableRow>
                          ) : (
                            allVotingSessions
                              .filter((v) => v.status === "draft")
                              .map((vote: any) => (
                                <TableRow key={vote.id} className="border-white/20">
                                  <TableCell className="text-white font-medium">
                                    {vote.title}
                                  </TableCell>
                                  <TableCell className="text-white/70">
                                    {vote.scheduled_start ? new Date(vote.scheduled_start).toLocaleDateString() : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-white/70">
                                    {vote.scheduled_end ? new Date(vote.scheduled_end).toLocaleDateString() : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="bg-warning text-white">
                                      Draft
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-white hover:bg-white/10"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="glass-card border-white/30">
                                        <DropdownMenuItem onClick={() => handleActivateVote(vote.id)}>
                                          Activate Vote
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigate(`/vote/${vote.id}`)}>
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-error"
                                          onClick={() => handleDeleteVote(vote.id)}
                                        >
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="scheduled">
                  <Card className="glass-card border-white/20">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20">
                            <TableHead className="text-white/70">Title</TableHead>
                            <TableHead className="text-white/70">Start Date</TableHead>
                            <TableHead className="text-white/70">End Date</TableHead>
                            <TableHead className="text-white/70">Status</TableHead>
                            <TableHead className="text-white/70">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-white/70 py-8">
                              Scheduled sessions coming soon
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ended">
                  <Card className="glass-card border-white/20">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/20">
                            <TableHead className="text-white/70">Title</TableHead>
                            <TableHead className="text-white/70">Start Date</TableHead>
                            <TableHead className="text-white/70">End Date</TableHead>
                            <TableHead className="text-white/70">Participants</TableHead>
                            <TableHead className="text-white/70">Total Votes</TableHead>
                            <TableHead className="text-white/70">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allVotingSessions
                            .filter((v) => v.status === "ended")
                            .length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-white/70 py-8">
                                No ended voting sessions
                              </TableCell>
                            </TableRow>
                          ) : (
                            allVotingSessions
                              .filter((v) => v.status === "ended")
                              .map((vote: any) => {
                                const uniqueVoters = new Set();
                                (vote.votes || []).forEach((v: any) => {
                                  if (v.user_id) uniqueVoters.add(v.user_id);
                                });
                                
                                return (
                                  <TableRow key={vote.id} className="border-white/20">
                                    <TableCell className="text-white font-medium">
                                      {vote.title}
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                      {vote.scheduled_start ? new Date(vote.scheduled_start).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                      {vote.scheduled_end ? new Date(vote.scheduled_end).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                      {uniqueVoters.size}
                                    </TableCell>
                                    <TableCell className="text-white/70">
                                      {vote.votes?.length || 0}
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-white hover:bg-white/10"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="glass-card border-white/30">
                                          <DropdownMenuItem onClick={() => navigate(`/results/${vote.id}`)}>
                                            View Results
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-error"
                                            onClick={() => handleDeleteVote(vote.id)}
                                          >
                                            Delete
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {activeView === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-bold text-white">Users</h1>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-10 bg-white/10 border-white/30 text-white"
                />
              </div>

              <Card className="glass-card border-white/20">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-white/70">Name</TableHead>
                        <TableHead className="text-white/70">Email</TableHead>
                        <TableHead className="text-white/70">Phone</TableHead>
                        <TableHead className="text-white/70">Registered</TableHead>
                        <TableHead className="text-white/70">Status</TableHead>
                        <TableHead className="text-white/70">Total Votes</TableHead>
                        <TableHead className="text-white/70">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-white/70 py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id} className="border-white/20">
                            <TableCell className="text-white font-medium">{user.name}</TableCell>
                            <TableCell className="text-white/70">{user.email}</TableCell>
                            <TableCell className="text-white/70">{user.phone}</TableCell>
                            <TableCell className="text-white/70">{user.registered}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  user.verified
                                    ? "bg-success text-white"
                                    : "bg-warning text-white"
                                }
                              >
                                {user.verified ? "Verified" : "Pending"}
                              </Badge>
                              {user.is_blocked && (
                                <Badge className="ml-2 bg-error text-white">Blocked</Badge>
                              )}
                              {user.role !== 'user' && (
                                <Badge className="ml-2 bg-white/20 text-white border border-white/30">{user.role}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-white/70">{user.totalVotes}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/10"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="glass-card border-white/30">
                                  <DropdownMenuItem onClick={() => handleBlockUser(user.id, user.is_blocked)}>
                                    {user.is_blocked ? 'Unblock User' : 'Block User'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeView === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold text-white">Analytics</h1>
              
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Votes Over Time (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="day" stroke="#ffffff70" />
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
            </motion.div>
          )}

          {activeView === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold text-white">Settings</h1>
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Admin Settings</CardTitle>
                  <CardDescription className="text-white/70">
                    Configure admin panel settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70">Settings coming soon...</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeView === "verifications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-bold text-white">ID Verifications</h1>

              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-white/10 mb-6">
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Pending ({verifications.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Approved
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Rejected
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {verifications.length === 0 ? (
                      <div className="col-span-2 text-center text-white/70 py-8">
                        No pending verifications
                      </div>
                    ) : (
                      verifications.map((verification) => (
                        <Card key={verification.id} className="glass-card border-white/20">
                          <CardHeader>
                            <CardTitle className="text-white">{verification.name}</CardTitle>
                            <CardDescription className="text-white/70">
                              {verification.email}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center border-2 border-dashed border-white/20 overflow-hidden">
                              {verification.id_card_image_url ? (
                                <img 
                                  src={verification.id_card_image_url} 
                                  alt="ID Card" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <p className="text-white/50">No ID Card Image</p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-white/70 mb-1">Submitted</p>
                              <p className="text-white">{verification.submitted}</p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Badge className={verification.id_card_verified ? "bg-success" : "bg-warning"}>
                                  ID: {verification.id_card_verified ? 'Verified' : 'Pending'}
                                </Badge>
                                <Badge className={verification.email_verified ? "bg-success" : "bg-warning"}>
                                  Email: {verification.email_verified ? 'Verified' : 'Pending'}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 bg-success hover:bg-success/90"
                                  onClick={() => handleApproveVerification(verification.id)}
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;
