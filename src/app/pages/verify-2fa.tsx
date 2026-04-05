import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { saveSession } from "../hooks/useAuth";

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ?? 'https://ai.traderfive.com';

export function Verify2FAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email      = location.state?.email as string | undefined;
  const rememberMe = location.state?.rememberMe as boolean | undefined;
  const token      = location.state?.token as string | undefined;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect back to sign in if no email in state
  useEffect(() => {
    if (!email) navigate('/signin', { replace: true });
  }, [email, navigate]);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(d => d !== "") && index === 5) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newCode = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, i) => { newCode[i] = char; });
    setCode(newCode);

    const nextEmpty = newCode.findIndex(d => d === "");
    if (nextEmpty !== -1) {
      inputRefs.current[nextEmpty]?.focus();
    } else {
      inputRefs.current[5]?.focus();
      handleVerify(newCode.join(""));
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (!email) return;
    setIsVerifying(true);
    setError("");

    try {
      const res  = await fetch(`${API_BASE}/api/users/${encodeURIComponent(email)}/verify-code`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message ?? 'Invalid verification code. Please try again.');
        resetCode();
        return;
      }

      // Code verified — save session and route based on role
      const verifiedUser = { ...data.user, token };
      saveSession(verifiedUser, rememberMe ?? false);

      const destination = verifiedUser.role === 'ai_admin' ? '/admin' : '/dashboard';
      navigate(destination, { replace: true });

    } catch {
      setError("Could not connect to the server. Please try again.");
      resetCode();
    } finally {
      setIsVerifying(false);
    }
  };

  const resetCode = () => {
    setCode(["", "", "", "", "", ""]);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const joined = code.join("");
    if (joined.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    handleVerify(joined);
  };

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    setError("");
    resetCode();

    try {
      const res  = await fetch(`${API_BASE}/api/users/${encodeURIComponent(email.trim().toLowerCase())}/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!data.success) {
        setError('Could not resend code. Please go back and sign in again.');
      } else {
        setResendCooldown(60);
      }
    } catch {
      setError('Could not resend code. Please try again.');
    } finally {
      setIsResending(false);
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
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 group">
            <TrendingUp className="size-10 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-3xl font-bold text-white">
              trader<span className="text-emerald-500">5</span>
            </span>
          </button>
          <p className="text-slate-400 mt-2">Verify your email to continue</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Mail className="size-8 text-emerald-500" />
              </div>
            </div>
            <CardTitle className="text-white text-2xl text-center">Email Verification</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              We've sent a 6-digit code to<br />
              <span className="text-emerald-500 font-medium">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Code inputs */}
              <div className="space-y-3">
                <div className="flex gap-2 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      disabled={isVerifying}
                      className={`size-12 text-center text-xl font-semibold bg-slate-800/50 border-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50 ${
                        error
                          ? "border-red-500"
                          : digit
                          ? "border-emerald-500"
                          : "border-slate-700"
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-center gap-1 text-red-500 text-sm"
                    >
                      <AlertCircle className="size-4" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Verify button */}
              <Button
                type="submit"
                disabled={isVerifying || code.some(d => d === "")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 transition-all"
                size="lg"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Verifying…
                  </span>
                ) : 'Verify & Continue'}
              </Button>

              {/* Resend */}
              <div className="text-center text-sm text-slate-400">
                Didn't receive the code?{" "}
                {isResending ? (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Loader2 className="size-3 animate-spin" /> Sending…
                  </span>
                ) : resendCooldown > 0 ? (
                  <span className="text-slate-500">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-emerald-500 hover:underline font-medium"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {/* Back */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/signin")}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-slate-900/30 border border-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            <strong className="text-slate-300">Security Notice:</strong> Never share your verification code with anyone.
            trader5 will never ask for your code via email or phone.
          </p>
        </div>
      </motion.div>
    </div>
  );
}