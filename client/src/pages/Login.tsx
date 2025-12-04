import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SALES" | "MARKETING" | "CSM">("SALES");
  const [signupKey, setSignupKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    const defaultRoute =
      user.role === 'SALES' ? '/sales' :
        user.role === 'MARKETING' ? '/marketing' :
          user.role === 'CSM' ? '/csm' :
            '/sales';
    return <Redirect to={defaultRoute} />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/v1/auth/signup", {
        name,
        email,
        password,
        role,
        secretKey: signupKey,
      });

      toast({
        title: "Account Created",
        description: "Welcome to AST Portal!",
      });

      await login(email, password);
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[128px] animate-pulse delay-1000" />

      <Card className="w-full max-w-md p-8 relative z-10 border-white/5 bg-card/30 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <img src="/ast-logo.png" alt="Company" width={40} height={40} className="invert brightness-0 opacity-90" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">AST Portal</h1>
            <p className="text-muted-foreground text-sm">Sign in to access your dashboard</p>
          </div>
        </div>

        {!isSignupMode ? (
          <>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  required
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground/80">Password</Label>
                  <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  required
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 transition-all h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-opacity text-white font-medium shadow-lg shadow-primary/20"
                data-testid="button-login"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  onClick={() => setIsSignupMode(true)}
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                  data-testid="button-toggle-signup"
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-foreground/80">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-name"
                  required
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-foreground/80">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-signup-email"
                  required
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-foreground/80">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-signup-password"
                  required
                  minLength={6}
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-role" className="text-foreground/80">Role</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger data-testid="select-role" className="bg-white/5 border-white/10 text-foreground h-10">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-foreground">
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="CSM">Customer Success Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-secret" className="text-foreground/80">Signup Key</Label>
                <Input
                  id="signup-secret"
                  type="password"
                  placeholder="Enter key"
                  value={signupKey}
                  onChange={(e) => setSignupKey(e.target.value)}
                  data-testid="input-signup-secret"
                  required
                  className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground h-10"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-opacity text-white font-medium mt-2"
                data-testid="button-signup"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignupMode(false)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
                data-testid="button-toggle-login"
                disabled={isLoading}
              >
                Already have an account? Login
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
