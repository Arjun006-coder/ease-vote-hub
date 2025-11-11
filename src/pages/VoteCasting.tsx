import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Clock, Users, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const VoteCasting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState("");
  const [gpsGranted, setGpsGranted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voteSession, setVoteSession] = useState<any>(null);
  const [voteOptions, setVoteOptions] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<any>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [comments, setComments] = useState<any[]>([]);

  // Fetch voting session data
  useEffect(() => {
    if (id) {
      fetchVoteSession();
    }
  }, [id]);

  // Check user vote after session is loaded
  useEffect(() => {
    if (id && user?.id && voteSession && voteSession.status === 'active') {
      checkUserVote();
    }
  }, [id, user, voteSession]);

  const fetchVoteSession = async () => {
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

      // If session is ended, redirect to results page
      if (session.status === 'ended') {
        navigate(`/results/${id}`);
        return;
      }

      // If session is not active (draft/cancelled), show error
      if (session.status !== 'active') {
        toast({
          title: 'Voting Session Not Active',
          description: 'This voting session is not currently active.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setVoteSession(session);

      // Fetch voting options
      const { data: options, error: optionsError } = await supabase
        .from('voting_options')
        .select('*')
        .eq('session_id', id)
        .order('option_order', { ascending: true });

      if (optionsError) throw optionsError;
      setVoteOptions(options || []);

      // Fetch total votes count
      const { count, error: votesError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', id)
        .eq('is_valid', true);

      if (!votesError) {
        setTotalVotes(count || 0);
      }

      // Check if GPS is required (don't request automatically, let user grant permission)
      if (!session.require_gps) {
        setGpsGranted(true); // No GPS required
      }
    } catch (error: any) {
      console.error('Error fetching vote session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load voting session',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const checkUserVote = async () => {
    if (!id || !user?.id || !voteSession) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          *,
          voting_options (id, option_text)
        `)
        .eq('session_id', id)
        .eq('user_id', user.id)
        .eq('is_valid', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking user vote:', error);
      } else if (data) {
        setUserVote(data);
        setSelectedOption(data.option_id);
        // If user already voted and multiple votes not allowed, redirect to results
        if (!voteSession.allow_multiple_votes) {
          navigate(`/results/${id}`);
        }
      }
    } catch (error) {
      console.error('Error checking user vote:', error);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location Not Supported',
        description: 'Your browser does not support location services',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsGranted(true);
        toast({
          title: 'Location Verified ✓',
          description: 'You can now cast your vote',
        });
      },
      (error) => {
        console.error('Location error:', error);
        toast({
          title: 'Location Access Denied',
          description: 'Please enable location access to vote',
          variant: 'destructive',
        });
      }
    );
  };

  const handleGrantGPS = () => {
    requestLocation();
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast({
        title: 'Please select an option',
        description: 'You must select a voting option before submitting',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to cast your vote',
        variant: 'destructive',
      });
      return;
    }

    if (voteSession?.require_gps && !gpsGranted) {
      toast({
        title: 'Location Required',
        description: 'Please grant location access to cast your vote',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already voted (if multiple votes not allowed)
      if (!voteSession?.allow_multiple_votes && userVote) {
        toast({
          title: 'Already Voted',
          description: 'You have already cast your vote for this session',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare vote data
      const voteData: any = {
        session_id: id,
        option_id: selectedOption,
        user_id: user.id,
        is_valid: true,
      };

      // Add GPS location if required and available
      if (voteSession?.require_gps && userLocation) {
        voteData.gps_location = {
          lat: userLocation.lat,
          lng: userLocation.lng,
          accuracy: 10, // Default accuracy
        };
      }

      // Add device fingerprint and user agent
      voteData.user_agent = navigator.userAgent;
      voteData.ip_address = null; // Will be set by backend if needed

      // Insert vote
      const { data: vote, error: voteError } = await supabase
        .from('votes')
        .insert(voteData)
        .select()
        .single();

      if (voteError) {
        // Check if it's a duplicate vote error
        if (voteError.code === '23505') { // Unique constraint violation
          throw new Error('You have already voted in this session');
        }
        throw voteError;
      }

      toast({
        title: "🎉 Vote Cast Successfully!",
        description: "Your vote has been recorded",
      });

      // Redirect to results after a short delay
      setTimeout(() => {
        navigate(`/results/${id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Error casting vote:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cast vote',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!voteSession?.scheduled_end) return 'N/A';
    const endDate = new Date(voteSession.scheduled_end);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
          <motion.div 
            className="glass-card p-8 border-white/20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-start justify-between mb-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h1 className="text-4xl font-bold text-white mb-2">{voteSession.title}</h1>
                <p className="text-white/70 leading-relaxed">{voteSession.description || 'No description'}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Badge className="bg-success text-white text-lg px-4 py-2 animate-pulse-slow">
                  <Clock className="w-4 h-4 mr-2" />
                  {getTimeRemaining()}
                </Badge>
              </motion.div>
            </div>

            <div className="flex items-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
              </div>
            </div>
          </motion.div>

          {/* Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Select Your Choice</h2>
            {voteOptions.length === 0 ? (
              <Card className="glass-card border-white/20">
                <CardContent className="p-8 text-center">
                  <p className="text-white/70">No voting options available</p>
                </CardContent>
              </Card>
            ) : (
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {voteOptions.map((option, index) => {
                    const optionText = option.option_text;
                    const initials = optionText.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                    const details = option.additional_data?.details || '';
                    
                    return (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.4 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative"
                      >
                        <Card
                          className={`glass-card border-2 cursor-pointer transition-all ${
                            selectedOption === option.id
                              ? "border-white/40 glow-shadow shadow-lg"
                              : "border-white/20 hover:border-white/30"
                          }`}
                          onClick={() => setSelectedOption(option.id)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {option.option_image_url ? (
                                    <img 
                                      src={option.option_image_url} 
                                      alt={optionText}
                                      className="w-16 h-16 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                                      {initials}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="text-xl font-bold text-white">
                                      {optionText}
                                    </h3>
                                    {details && (
                                      <p className="text-sm text-white/70">{details}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <RadioGroupItem
                                value={option.id}
                                className="border-white/30 text-primary"
                              />
                            </div>
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
                    );
                  })}
                </div>
              </RadioGroup>
            )}
          </motion.div>

          {/* GPS Verification */}
          {voteSession.require_gps && (
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
                        {gpsGranted && userLocation
                          ? `Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                          : "Grant location access to cast your vote"}
                      </p>
                    </div>
                  </div>
                  {!gpsGranted && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button onClick={handleGrantGPS} className="bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300">
                        Grant Permission
                      </Button>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discussion Section - Coming Soon */}
          {voteSession.show_live_results && (
            <Card className="glass-card border-white/20">
              <CardContent className="p-6">
                <div className="text-center text-white/70">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Discussion feature coming soon</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-lg py-6 disabled:opacity-50"
            disabled={!selectedOption || (voteSession.require_gps && !gpsGranted) || isSubmitting || (userVote && !voteSession.allow_multiple_votes)}
            onClick={handleSubmit}
          >
            {isSubmitting 
              ? "Casting your vote..." 
              : (userVote && !voteSession.allow_multiple_votes) 
                ? "Already Voted" 
                : "Cast Vote"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default VoteCasting;
