import { motion } from "framer-motion";
import { Navbar } from "@/components/Layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Clock, TrendingUp, Download, Share2 } from "lucide-react";
import { useParams } from "react-router-dom";
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

const Results = () => {
  const { id } = useParams();

  const voteData = {
    title: "Class Representative Election 2025",
    status: "Ended",
    totalVotes: 342,
    winner: {
      name: "Sarah Johnson",
      votes: 156,
      percentage: 45.6,
    },
    results: [
      { name: "Sarah Johnson", votes: 156, percentage: 45.6, color: "#10b981" },
      { name: "Mike Chen", votes: 112, percentage: 32.7, color: "#8b5cf6" },
      { name: "Emily Davis", votes: 74, percentage: 21.7, color: "#ec4899" },
    ],
    stats: {
      totalParticipants: 450,
      turnout: 76,
      duration: "3 days",
      peakTime: "2:00 PM - 4:00 PM",
    },
    timeline: [
      { time: "9 AM", votes: 23 },
      { time: "12 PM", votes: 67 },
      { time: "3 PM", votes: 142 },
      { time: "6 PM", votes: 234 },
      { time: "9 PM", votes: 298 },
      { time: "Final", votes: 342 },
    ],
    userVote: "Sarah Johnson",
  };

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
                <h1 className="text-4xl font-bold text-white mb-2">{voteData.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-muted text-white">{voteData.status}</Badge>
                  <span className="text-white/70">
                    {voteData.totalVotes} total votes cast
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Winner Announcement */}
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
                {voteData.winner.name}
              </p>
              <p className="text-2xl text-white/90">
                {voteData.winner.votes} votes ({voteData.winner.percentage}%)
              </p>
            </div>
          </motion.div>

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
                  {voteData.stats.totalParticipants}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Turnout
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">
                  {voteData.stats.turnout}%
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
                  {voteData.stats.duration}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                  Peak Voting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-white">
                  {voteData.stats.peakTime}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Vote Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={voteData.results}>
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
                      {voteData.results.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="space-y-3 mt-6">
                  {voteData.results.map((result, index) => (
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
                      data={voteData.results}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="votes"
                    >
                      {voteData.results.map((entry, index) => (
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

                <div className="flex justify-center gap-6 mt-4">
                  {voteData.results.map((result, index) => (
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

          {/* Timeline */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Voting Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={voteData.timeline}>
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

          {/* Your Vote */}
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
                    {voteData.userVote}
                  </p>
                  <p className="text-sm text-white/70">
                    Cast on January 15, 2025 at 2:34 PM
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
