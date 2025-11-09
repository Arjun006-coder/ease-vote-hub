import { useState } from "react";
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

const Admin = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("overview");

  const stats = [
    { label: "Total Users", value: "2,891", change: "+12%", color: "text-primary" },
    { label: "Active Sessions", value: "47", change: "+8%", color: "text-success" },
    { label: "Total Votes Cast", value: "10,234", change: "+23%", color: "text-warning" },
    { label: "Pending Verifications", value: "12", change: "-5%", color: "text-error" },
  ];

  const chartData = [
    { day: "Mon", votes: 245 },
    { day: "Tue", votes: 389 },
    { day: "Wed", votes: 567 },
    { day: "Thu", votes: 423 },
    { day: "Fri", votes: 678 },
    { day: "Sat", votes: 534 },
    { day: "Sun", votes: 298 },
  ];

  const recentVotes = [
    {
      id: 1,
      title: "Class Representative Election",
      status: "Active",
      created: "2025-01-10",
      participants: 234,
      votes: 156,
    },
    {
      id: 2,
      title: "Best Teacher Award",
      status: "Active",
      created: "2025-01-12",
      participants: 567,
      votes: 342,
    },
    {
      id: 3,
      title: "Student Union President",
      status: "Ended",
      created: "2025-01-05",
      participants: 892,
      votes: 892,
    },
  ];

  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@university.edu",
      phone: "+1 555-0101",
      registered: "2024-12-15",
      verified: true,
      totalVotes: 23,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@university.edu",
      phone: "+1 555-0102",
      registered: "2024-12-18",
      verified: true,
      totalVotes: 18,
    },
    {
      id: 3,
      name: "Alice Johnson",
      email: "alice.j@university.edu",
      phone: "+1 555-0103",
      registered: "2025-01-03",
      verified: false,
      totalVotes: 5,
    },
  ];

  const verifications = [
    {
      id: 1,
      name: "Michael Brown",
      email: "michael.b@university.edu",
      submitted: "2025-01-15 10:30 AM",
      status: "pending",
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah.w@university.edu",
      submitted: "2025-01-15 11:45 AM",
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

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
              onClick={() => setActiveView("create-vote")}
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
                {stats.map((stat, index) => (
                  <Card key={index} className="glass-card border-white/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-white/70">
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                        {stat.value}
                      </div>
                      <p className="text-sm text-success">{stat.change} from last week</p>
                    </CardContent>
                  </Card>
                ))}
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
                      {recentVotes.map((vote) => (
                        <TableRow key={vote.id} className="border-white/20">
                          <TableCell className="text-white font-medium">{vote.title}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                vote.status === "Active"
                                  ? "bg-success text-white"
                                  : "bg-muted text-white"
                              }
                            >
                              {vote.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white/70">{vote.created}</TableCell>
                          <TableCell className="text-white/70">{vote.participants}</TableCell>
                          <TableCell className="text-white/70">{vote.votes}</TableCell>
                        </TableRow>
                      ))}
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
                <Button className="bg-primary hover:bg-primary/90">
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
                          {recentVotes
                            .filter((v) => v.status === "Active")
                            .map((vote) => (
                              <TableRow key={vote.id} className="border-white/20">
                                <TableCell className="text-white font-medium">
                                  {vote.title}
                                </TableCell>
                                <TableCell className="text-white/70">{vote.created}</TableCell>
                                <TableCell className="text-white/70">2025-01-20</TableCell>
                                <TableCell className="text-white/70">
                                  {vote.participants}
                                </TableCell>
                                <TableCell className="text-white/70">{vote.votes}</TableCell>
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
                                      <DropdownMenuItem>View Details</DropdownMenuItem>
                                      <DropdownMenuItem>Edit</DropdownMenuItem>
                                      <DropdownMenuItem>End Vote</DropdownMenuItem>
                                      <DropdownMenuItem className="text-error">
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
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
                      {users.map((user) => (
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
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Block User</DropdownMenuItem>
                                <DropdownMenuItem className="text-error">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                    {verifications.map((verification) => (
                      <Card key={verification.id} className="glass-card border-white/20">
                        <CardHeader>
                          <CardTitle className="text-white">{verification.name}</CardTitle>
                          <CardDescription className="text-white/70">
                            {verification.email}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center border-2 border-dashed border-white/20">
                            <p className="text-white/50">ID Card Image</p>
                          </div>
                          <div>
                            <p className="text-sm text-white/70 mb-1">Submitted</p>
                            <p className="text-white">{verification.submitted}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button className="flex-1 bg-success hover:bg-success/90">
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                            >
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
