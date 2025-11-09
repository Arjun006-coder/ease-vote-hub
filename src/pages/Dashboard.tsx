import { useState } from "react";
import { Navbar } from "@/components/Layout/Navbar";
import { Home, Vote, History, User, LogOut, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");

  const stats = [
    { label: "Votes Cast Today", value: "3", color: "text-success" },
    { label: "Active Sessions", value: "12", color: "text-primary" },
    { label: "Vote History", value: "47", color: "text-warning" },
    { label: "Pending Verifications", value: "0", color: "text-muted-foreground" },
  ];

  const activeVotes = [
    {
      id: 1,
      title: "Class Representative Election 2025",
      description: "Vote for your class representative for the academic year",
      timeRemaining: "2h 34m",
      eligible: true,
      participants: 234,
      criteria: ["Class 10A", "CS Department"],
    },
    {
      id: 2,
      title: "Best Teacher Award",
      description: "Vote for the most inspiring teacher of the semester",
      timeRemaining: "5h 12m",
      eligible: true,
      participants: 567,
      criteria: ["All Students"],
    },
    {
      id: 3,
      title: "Club President Selection",
      description: "Choose the next president for the Computer Science Club",
      timeRemaining: "1d 4h",
      eligible: false,
      participants: 89,
      criteria: ["CS Department", "Year 2-4"],
      ineligibleReason: "Not enrolled in CS Department",
    },
  ];

  const voteHistory = [
    {
      id: 1,
      title: "Student Union President",
      date: "2025-01-05",
      selected: "Sarah Johnson",
      winner: "Sarah Johnson",
      totalVotes: 892,
    },
    {
      id: 2,
      title: "Sports Captain",
      date: "2024-12-20",
      selected: "Mike Chen",
      winner: "Mike Chen",
      totalVotes: 456,
    },
  ];

  const recentActivity = [
    { action: "Voted in Class Rep Election", time: "2 hours ago" },
    { action: "Profile verified", time: "1 day ago" },
    { action: "Voted in Best Teacher Award", time: "3 days ago" },
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
                onClick={() => navigate("/")}
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
                  Welcome back, John! 👋
                </h1>
                <p className="text-white/70">Here's your voting overview</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="glass-card border-white/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-white/70">
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Active Voting Sessions */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Active Voting Sessions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeVotes.slice(0, 2).map((vote) => (
                    <Card
                      key={vote.id}
                      className="glass-card border-white/20 hover-scale hover-glow cursor-pointer"
                      onClick={() => navigate(`/vote/${vote.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-white">{vote.title}</CardTitle>
                            <CardDescription className="text-white/70 mt-2">
                              {vote.description}
                            </CardDescription>
                          </div>
                          {vote.eligible ? (
                            <Badge className="bg-success text-white">Eligible</Badge>
                          ) : (
                            <Badge variant="destructive">Not Eligible</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/70">Time Remaining:</span>
                            <span className="text-warning font-semibold">
                              {vote.timeRemaining}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/70">Participants:</span>
                            <span className="text-white font-semibold">
                              {vote.participants}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {vote.criteria.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-white/30 text-white/90"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
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
                {activeVotes.map((vote) => (
                  <Card
                    key={vote.id}
                    className="glass-card border-white/20 hover-scale cursor-pointer"
                    onClick={() => navigate(`/vote/${vote.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white mb-2">{vote.title}</CardTitle>
                          <CardDescription className="text-white/70">
                            {vote.description}
                          </CardDescription>
                        </div>
                        {vote.eligible ? (
                          <Badge className="bg-success text-white ml-4">✓ Eligible</Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-4">✗ Not Eligible</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-white/70 mb-1">Time Remaining</p>
                          <p className="text-warning font-semibold text-lg">
                            {vote.timeRemaining}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/70 mb-1">Participants</p>
                          <p className="text-white font-semibold text-lg">
                            {vote.participants}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/70 mb-1">Criteria</p>
                          <div className="flex flex-wrap gap-2">
                            {vote.criteria.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-white/30 text-white/90 text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      {!vote.eligible && vote.ineligibleReason && (
                        <div className="mt-4 p-3 rounded-lg bg-destructive/20 border border-destructive/30">
                          <p className="text-sm text-white/90">
                            <strong>Reason:</strong> {vote.ineligibleReason}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
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
                        <Badge className="bg-primary text-white">Completed</Badge>
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
                          onClick={() => navigate(`/results/${vote.id}`)}
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
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold text-xl">John Doe</p>
                      <p className="text-white/70">john.doe@university.edu</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <Label className="text-white/70 text-sm">Full Name</Label>
                      <Input
                        defaultValue="John Doe"
                        className="mt-1 bg-white/10 border-white/30 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Email</Label>
                      <Input
                        defaultValue="john.doe@university.edu"
                        className="mt-1 bg-white/10 border-white/30 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Phone</Label>
                      <Input
                        defaultValue="+1 (555) 123-4567"
                        className="mt-1 bg-white/10 border-white/30 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Student ID</Label>
                      <Input
                        defaultValue="STU-2024-1234"
                        className="mt-1 bg-white/10 border-white/30 text-white"
                      />
                    </div>
                  </div>

                  <Button className="bg-primary hover:bg-primary/90">
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">ID Verification Status</CardTitle>
                    <Badge className="bg-success text-white">✓ Verified</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70">
                    Your ID has been verified. You can participate in all voting sessions.
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

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}

export default Dashboard;
