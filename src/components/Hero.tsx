import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Vote, CheckCircle, BarChart3 } from "lucide-react";

export const Hero = ({ onAuthOpen }: { onAuthOpen: () => void }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Floating Vote Icons Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/5"
            initial={{ y: 0 }}
            animate={{ y: [-20, 20, -20] }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + i * 10}%`,
            }}
          >
            <Vote size={80 + i * 10} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-pink-200">
            VoteEase
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 mb-4">
            Secure Digital Voting Platform
          </p>
          <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Transparent, Secure, and Easy voting for educational institutions
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 hover-glow"
              onClick={onAuthOpen}
            >
              Start Voting
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 backdrop-blur-sm"
            >
              View Results
            </Button>
          </div>

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
              <div className="text-3xl font-bold text-white mb-1">10,234</div>
              <div className="text-sm text-white/70">Total Votes Cast</div>
            </div>
            <div className="glass-card p-6 hover-scale">
              <div className="flex items-center justify-center mb-2">
                <Vote className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">47</div>
              <div className="text-sm text-white/70">Active Sessions</div>
            </div>
            <div className="glass-card p-6 hover-scale">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-8 h-8 text-warning" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">2,891</div>
              <div className="text-sm text-white/70">Total Users</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
