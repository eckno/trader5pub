import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { SEOHead } from "../components/SEOHead";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ?? 'https://ai.traderfive.com';

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [referralValid, setReferralValid] = useState<string | null>(null);
  const [referralChecking, setReferralChecking] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: searchParams.get('ref')?.toUpperCase() ?? "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate referral code as user types (debounced)
  useEffect(() => {
    const code = formData.referralCode.trim();
    if (!code) { setReferralValid(null); return; }
    const timer = setTimeout(async () => {
      setReferralChecking(true);
      try {
        const res  = await fetch(`${API_BASE}/api/referral/${encodeURIComponent(code)}/validate`);
        const data = await res.json();
        setReferralValid(data.success ? data.referredBy : null);
        if (!data.success) setErrors(prev => ({ ...prev, referralCode: 'Invalid referral code.' }));
        else setErrors(prev => { const e = { ...prev }; delete e.referralCode; return e; });
      } catch { setReferralValid(null); }
      finally { setReferralChecking(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.referralCode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        fullName: formData.fullName.trim(),
        email:    formData.email.trim().toLowerCase(),
        password: formData.password,
      };
      if (formData.referralCode.trim() && referralValid) {
        body.referred_by = formData.referralCode.trim().toUpperCase();
      }

      const res = await fetch(`${API_BASE}/api/users/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(data.message ?? 'Registration failed. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate('/signin'), 2500);
    } catch {
      setServerError('Could not connect to the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (serverError) setServerError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <SEOHead
        title="Create Account"
        description="Join trader5 and start growing your capital with AI trading strategies. Free Conservative strategy available."
        canonical="/signup"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 group">
            <TrendingUp className="size-10 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-3xl font-bold text-white">
              trader<span className="text-emerald-500">5</span>
            </span>
          </button>
          <p className="text-slate-400 mt-2">Start your passive income journey</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Create Your Account</CardTitle>
            <CardDescription className="text-slate-400">
              Join thousands earning passive income with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {success ? (
                /* ── Success state ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 flex flex-col items-center gap-4 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </motion.div>
                  <div>
                    <p className="text-white font-semibold text-lg">Account Created!</p>
                    <p className="text-slate-400 text-sm mt-1">
                      Welcome aboard, {formData.fullName.split(' ')[0]}. Redirecting you to sign in…
                    </p>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* ── Form state ── */
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  exit={{ opacity: 0 }}
                >
                  {/* Server error banner */}
                  <AnimatePresence>
                    {serverError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                      >
                        <AlertCircle className="size-4 flex-shrink-0" />
                        <span>{serverError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${errors.fullName ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.fullName && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="size-3" /><span>{errors.fullName}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${errors.email ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.email && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="size-3" /><span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className={`pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${errors.password ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="size-3" /><span>{errors.password}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        className={`pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${errors.confirmPassword ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="size-3" /><span>{errors.confirmPassword}</span>
                      </div>
                    )}
                  </div>

                  {/* Referral Code (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-white">
                      Referral Code <span className="text-slate-500 font-normal text-xs">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="referralCode"
                        type="text"
                        placeholder="e.g. JOHN123"
                        value={formData.referralCode}
                        onChange={(e) => handleChange("referralCode", e.target.value.toUpperCase())}
                        className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 font-mono tracking-widest ${
                          errors.referralCode ? "border-red-500" : referralValid ? "border-emerald-500/50" : ""
                        }`}
                      />
                      {referralChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        </div>
                      )}
                    </div>
                    {referralValid && (
                      <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Referred by {referralValid}
                      </p>
                    )}
                    {errors.referralCode && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="size-3" /><span>{errors.referralCode}</span>
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleChange("agreeToTerms", checked as boolean)}
                      className={errors.agreeToTerms ? "border-red-500" : ""}
                    />
                    <label htmlFor="terms" className="text-sm text-slate-300 leading-tight cursor-pointer">
                      I agree to the{" "}
                      <a href="#" className="text-emerald-500 hover:underline">Terms of Service</a>{" "}
                      and{" "}
                      <a href="#" className="text-emerald-500 hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="size-3" /><span>{errors.agreeToTerms}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-70 transition-all"
                    size="lg"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Creating your account…
                      </span>
                    ) : 'Create Account'}
                  </Button>

                  <div className="text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signin")}
                      className="text-emerald-500 hover:underline"
                    >
                      Sign In
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Risk Disclaimer */}
        <div className="mt-6 p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            <strong className="text-slate-300">Risk Warning:</strong> Trading involves substantial risk.
            Past performance is not indicative of future results. Only invest what you can afford to lose.
          </p>
        </div>
      </motion.div>
    </div>
  );
}