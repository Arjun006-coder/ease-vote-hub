import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Vote, CheckCircle, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Hero = ({ 
  onAuthOpen, 
  onRegister 
}: { 
  onAuthOpen: () => void;
  onRegister: () => void;
}) => {
  const [stats, setStats] = useState({
    totalVotes: 0,
    activeSessions: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total votes
      const { count: votesCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('is_valid', true);

      // Fetch active sessions
      const { count: sessionsCount } = await supabase
        .from('voting_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalVotes: votesCount || 0,
        activeSessions: sessionsCount || 0,
        totalUsers: usersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating Vote Icons */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`vote-${i}`}
            className="absolute text-white/3"
            initial={{ y: 0, x: 0, rotate: 0 }}
            animate={{ 
              y: [-30, 30, -30],
              x: [-10, 10, -10],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
            style={{
              left: `${10 + i * 12}%`,
              top: `${5 + i * 8}%`,
            }}
          >
            <Vote size={60 + i * 8} />
          </motion.div>
        ))}
        
        {/* Animated Circles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full border border-white/5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.05, 0.1]
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8,
            }}
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              left: `${20 + i * 15}%`,
              top: `${15 + i * 12}%`,
            }}
          />
        ))}
        
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-white animate-pulse-slow">
              VoteEase
            </span>
          </motion.h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-4">
            Secure Digital Voting Platform
          </p>
          <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Transparent, Secure, and Easy voting for educational institutions
          </p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6 shadow-2xl hover:shadow-white/20 transition-all duration-300"
                onClick={onRegister}
              >
                Register Now
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 text-lg px-8 py-6 backdrop-blur-sm transition-all duration-300"
                onClick={onAuthOpen}
              >
                Sign In
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="glass-card p-6 hover-scale">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats.totalVotes.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/70">Total Votes Cast</div>
                </>
              )}
            </div>
            <div className="glass-card p-6 hover-scale">
              <div className="flex items-center justify-center mb-2">
                <Vote className="w-8 h-8 text-primary" />
              </div>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats.activeSessions}
                  </div>
                  <div className="text-sm text-white/70">Active Sessions</div>
                </>
              )}
            </div>
            <div className="glass-card p-6 hover-scale">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-8 h-8 text-warning" />
              </div>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/70">Total Users</div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
