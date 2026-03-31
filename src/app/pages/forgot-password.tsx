import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { TrendingUp, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // In production, send password reset email
      setSubmitted(true);
    }
  };

  const handleChange = (value: string) => {
    setEmail(value);
    if (error) {
      setError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 group"
          >
            <TrendingUp className="size-10 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-3xl font-bold text-white">
              trader<span className="text-emerald-500">5</span>
            </span>
          </button>
          <p className="text-slate-400 mt-2">Reset your password</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Forgot Password</CardTitle>
            <CardDescription className="text-slate-400">
              {submitted
                ? "Check your email for reset instructions"
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => handleChange(e.target.value)}
                      className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${
                        error ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="size-3" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  Send Reset Link
                </Button>

                {/* Back to Sign In */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/signin")}
                  className="w-full text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Sign In
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="size-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="size-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Email Sent!</h3>
                    <p className="text-slate-400 text-sm">
                      We've sent a password reset link to <strong className="text-white">{email}</strong>
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">What to do next:</strong>
                  </p>
                  <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                    <li>Check your email inbox</li>
                    <li>Click the reset link (valid for 1 hour)</li>
                    <li>Create your new password</li>
                  </ul>
                </div>

                {/* Resend */}
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-2">Didn't receive the email?</p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className="border-slate-700 text-white hover:bg-slate-800"
                  >
                    Try Again
                  </Button>
                </div>

                {/* Back to Sign In */}
                <Button
                  variant="ghost"
                  onClick={() => navigate("/signin")}
                  className="w-full text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Need help?{" "}
            <a href="#" className="text-emerald-500 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
