import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Clock, Users, MessageSquare, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const VoteCasting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState("");
  const [gpsGranted, setGpsGranted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vote = {
    title: "Class Representative Election 2025",
    description:
      "Vote for your class representative for the academic year 2025. The representative will be responsible for coordinating between students and faculty, organizing events, and addressing student concerns.",
    timeRemaining: "2h 34m",
    totalVotes: 234,
    options: [
      {
        id: "1",
        name: "Sarah Johnson",
        image: "",
        details: "Class 10A | Roll No: 101",
        bio: "Passionate about student welfare and event organization",
      },
      {
        id: "2",
        name: "Mike Chen",
        image: "",
        details: "Class 10A | Roll No: 105",
        bio: "Experienced leader with strong communication skills",
      },
      {
        id: "3",
        name: "Emily Davis",
        image: "",
        details: "Class 10A | Roll No: 112",
        bio: "Creative thinker focused on innovative solutions",
      },
    ],
  };

  const comments = [
    {
      id: 1,
      user: "Alex Thompson",
      comment: "Great candidates! Excited to see the results.",
      time: "2 hours ago",
      likes: 12,
    },
    {
      id: 2,
      user: "Jessica Lee",
      comment: "Sarah has been amazing in organizing past events!",
      time: "4 hours ago",
      likes: 8,
    },
  ];

  const handleGrantGPS = () => {
    setGpsGranted(true);
    toast({
      title: "Location Verified ✓",
      description: "You can now cast your vote",
    });
  };

  const handleSubmit = async () => {
    if (!selectedOption || !gpsGranted) return;

    setIsSubmitting(true);
    
    // Simulate vote submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: "🎉 Vote Cast Successfully!",
      description: "Your vote has been recorded",
    });

    setTimeout(() => {
      navigate(`/results/${id}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="glass-card p-8 border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{vote.title}</h1>
                <p className="text-white/70 leading-relaxed">{vote.description}</p>
              </div>
              <Badge className="bg-warning text-white text-lg px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                {vote.timeRemaining}
              </Badge>
            </div>

            <div className="flex items-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{vote.totalVotes} participants</span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Select Your Choice</h2>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vote.options.map((option) => (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    className="relative"
                  >
                    <Card
                      className={`glass-card border-2 cursor-pointer transition-all ${
                        selectedOption === option.id
                          ? "border-primary glow-shadow"
                          : "border-white/20 hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedOption(option.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                                {option.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">
                                  {option.name}
                                </h3>
                                <p className="text-sm text-white/70">{option.details}</p>
                              </div>
                            </div>
                          </div>
                          <RadioGroupItem
                            value={option.id}
                            className="border-white/30 text-primary"
                          />
                        </div>
                        <p className="text-white/70 text-sm">{option.bio}</p>
                        {selectedOption === option.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-success flex items-center justify-center"
                          >
                            <CheckCircle className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* GPS Verification */}
          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <MapPin className={`w-8 h-8 ${gpsGranted ? "text-success" : "text-white/50"}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {gpsGranted ? "Location Verified ✓" : "Location Verification Required"}
                    </h3>
                    <p className="text-sm text-white/70">
                      {gpsGranted
                        ? "University Campus, Building A"
                        : "Grant location access to cast your vote"}
                    </p>
                  </div>
                </div>
                {!gpsGranted && (
                  <Button onClick={handleGrantGPS} className="bg-primary hover:bg-primary/90">
                    Grant Permission
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Discussion Section */}
          <Card className="glass-card border-white/20">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                className="w-full justify-between text-white hover:bg-white/10 mb-4"
                onClick={() => setShowComments(!showComments)}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Discussion ({comments.length} comments)</span>
                </div>
                <span>{showComments ? "−" : "+"}</span>
              </Button>

              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <Textarea
                    placeholder="Share your thoughts..."
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  />
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Post Comment
                  </Button>

                  <div className="space-y-3 pt-4 border-t border-white/20">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 rounded-lg bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white">{comment.user}</span>
                          <span className="text-xs text-white/50">{comment.time}</span>
                        </div>
                        <p className="text-white/70 text-sm mb-2">{comment.comment}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/70 hover:text-white hover:bg-white/10 h-auto p-1"
                        >
                          👍 {comment.likes}
                        </Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-lg py-6 disabled:opacity-50"
            disabled={!selectedOption || !gpsGranted || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Casting your vote..." : "Cast Vote"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default VoteCasting;
