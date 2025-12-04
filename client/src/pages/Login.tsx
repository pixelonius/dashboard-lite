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

  const demoUsers = [
    { email: "admin@demo.com", password: "password123", role: "ADMIN" },
    { email: "sales@demo.com", password: "password123", role: "SALES" },
    { email: "marketing@demo.com", password: "password123", role: "MARKETING" },
    { email: "csm@demo.com", password: "password123", role: "CSM" },
  ];

  if (user) {
    // Redirect to role-appropriate dashboard
    const defaultRoute = 
      user.role === 'SALES' ? '/sales' :
      user.role === 'MARKETING' ? '/marketing' :
      user.role === 'CSM' ? '/csm' :
      '/sales'; // ADMIN default
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

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);

    try {
      await login(demoEmail, demoPassword);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
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

      // Auto-login after signup
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-soft-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/ast-logo.png" alt="Company" width={24} height={24} className="shrink-0" />
          {/* <Package className="w-8 h-8 text-primary" /> */}
          <h1 className="text-2xl font-bold">AST Portal</h1>
        </div>

        {!isSignupMode ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-login" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignupMode(true)}
                className="text-sm text-primary hover:underline"
                data-testid="button-toggle-signup"
                disabled={isLoading}
              >
                Don't have an account? Sign up
              </button>
            </div>

            {/* <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">Demo Accounts (Quick Login):</p>
              <div className="space-y-2">
                {demoUsers.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => handleDemoLogin(user.email, user.password)}
                    className="w-full text-left px-3 py-2 rounded-md hover-elevate border text-sm"
                    data-testid={`button-demo-${user.role.toLowerCase()}`}
                    disabled={isLoading}
                  >
                    <div className="font-medium">{user.email}</div>
                    <div className="text-xs text-muted-foreground">Role: {user.role} • Password: password123</div>
                  </button>
                ))}
              </div>
            </div> */}
          </>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-signup-email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Enter your password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-signup-password"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="signup-role">Role</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="CSM">Customer Success Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="signup-secret">Signup Key</Label>
                <Input
                  id="signup-secret"
                  type="password"
                  placeholder="Enter the provided signup key"
                  value={signupKey}
                  onChange={(e) => setSignupKey(e.target.value)}
                  data-testid="input-signup-secret"
                  required
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-signup" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignupMode(false)}
                className="text-sm text-primary hover:underline"
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
