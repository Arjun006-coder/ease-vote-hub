import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(signInEmail, signInPassword);

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in",
      });

      onOpenChange(false);
      
      // Wait a bit for profile to load, then navigate
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-white/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Welcome to VoteEase
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Sign in to your account to start voting
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-white">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="text-center mt-4">
                  <p className="text-sm text-white/70">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        navigate('/register');
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Register here
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
