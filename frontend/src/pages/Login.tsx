import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPasswordState] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (isSignup) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }

      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || error.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4 pt-32 pb-12 selection:bg-primary/30">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:scale-105 transition-transform duration-300">
            <h1 className="text-3xl font-bold tracking-widest text-[#D4AF37] font-display">
              VANCA INTERIO
            </h1>
            <p className="text-xs tracking-[0.4em] text-zinc-400 mt-2 uppercase">Patina</p>
          </Link>
        </div>

        {/* Glass card */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-zinc-100 tracking-wide">
                {isSignup ? "Create Account" : "Access Portal"}
              </h2>
              <p className="text-sm text-zinc-400 mt-2 font-light">
                {isSignup
                  ? "Join the world of premium finishes"
                  : "Authenticate to continue"}
              </p>
              {errorMsg && (
                <p className="text-sm text-red-400 mt-3 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                  {errorMsg}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="name" className="text-zinc-300 text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-2 h-12 bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white placeholder:text-zinc-600 transition-all focus:bg-white/10"
                  />
                </motion.div>
              )}

              <div>
                <Label htmlFor="email" className="text-zinc-300 text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-11 h-12 bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white placeholder:text-zinc-600 transition-all focus:bg-white/10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPasswordState(e.target.value)}
                    placeholder="••••••••"
                    className="pl-11 pr-11 h-12 bg-white/5 border-white/10 focus:border-[#D4AF37]/50 text-white placeholder:text-zinc-600 transition-all focus:bg-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {!isSignup && (
                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#D4AF37] hover:text-[#f3d368] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-4 bg-gradient-to-r from-[#D4AF37] to-[#aa8b2b] text-black font-semibold hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#D4AF37]/20 border-0"
              >
                {isLoading ? "Processing..." : (isSignup ? "Create Account" : "Access Securely")}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            {/* Toggle signup/login */}
            <p className="text-center text-sm text-zinc-400 mt-8">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => { setIsSignup(!isSignup); setErrorMsg(""); }}
                className="text-[#D4AF37] hover:text-[#f3d368] font-semibold transition-colors uppercase tracking-wider text-xs ml-1"
              >
                {isSignup ? "Login Instead" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
