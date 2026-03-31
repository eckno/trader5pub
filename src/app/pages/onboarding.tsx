import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Bitcoin,
  Check,
  AlertCircle,
  Copy,
  Info,
  Shield,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";

type OnboardingStep = "deposit" | "strategy" | "confirmation";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [copied, setCopied] = useState(false);

  // Mock BTC wallet address
  const btcWalletAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

  const strategies = [
    {
      id: "conservative",
      name: "Conservative (Free)",
      price: "Free",
      description: "Low-risk strategy perfect for beginners",
      features: ["5-10% monthly returns", "BTC pairs only", "Risk-managed trades"],
      icon: Shield,
      badge: "Recommended",
    },
  ];

  const steps = [
    { id: "deposit", label: "Fund Account", progress: 33 },
    { id: "strategy", label: "Select Strategy", progress: 66 },
    { id: "confirmation", label: "Confirmation", progress: 100 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progressValue = steps[currentStepIndex].progress;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(btcWalletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNext = () => {
    if (currentStep === "deposit" && parseFloat(depositAmount) >= 50) {
      setCurrentStep("strategy");
    } else if (currentStep === "strategy" && selectedStrategy) {
      setCurrentStep("confirmation");
    }
  };

  const handleBack = () => {
    if (currentStep === "strategy") {
      setCurrentStep("deposit");
    } else if (currentStep === "confirmation") {
      setCurrentStep("strategy");
    }
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  const canProceed = () => {
    if (currentStep === "deposit") {
      return parseFloat(depositAmount) >= 50;
    }
    if (currentStep === "strategy") {
      return !!selectedStrategy;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <TrendingUp className="size-8 text-emerald-500" />
            <span className="text-2xl font-bold text-white">
              trader<span className="text-emerald-500">5</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Account Setup</h1>
          <p className="text-slate-400">Let's get your AI trading account ready</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  index <= currentStepIndex ? "text-emerald-500" : "text-slate-500"
                }`}
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center border-2 ${
                    index < currentStepIndex
                      ? "bg-emerald-500 border-emerald-500"
                      : index === currentStepIndex
                      ? "border-emerald-500"
                      : "border-slate-700"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="size-4 text-white" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <span className="text-sm hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === "deposit" && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="size-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <Bitcoin className="size-6 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-2xl">Fund Your Account</CardTitle>
                      <CardDescription className="text-slate-400">
                        Minimum deposit: $50 in BTC
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Deposit Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-white">
                      Deposit Amount (USD equivalent)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="50"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="pl-8 bg-slate-800/50 border-slate-700 text-white"
                        min="50"
                      />
                    </div>
                    {parseFloat(depositAmount) > 0 && parseFloat(depositAmount) < 50 && (
                      <div className="flex items-center gap-1 text-amber-500 text-sm">
                        <AlertCircle className="size-4" />
                        <span>Minimum deposit is $50</span>
                      </div>
                    )}
                  </div>

                  {/* BTC Address */}
                  <div className="space-y-2">
                    <Label className="text-white">Send BTC to this address:</Label>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-emerald-500 text-sm break-all">{btcWalletAddress}</code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyAddress}
                          className="shrink-0 border-slate-700"
                        >
                          {copied ? (
                            <>
                              <Check className="size-4 mr-2" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-blue-400 font-medium">Important Information</p>
                        <ul className="text-sm text-slate-300 space-y-1">
                          <li>• Send only BTC to this address</li>
                          <li>• Network confirmations typically take 10-30 minutes</li>
                          <li>• Your account will be activated once the deposit is confirmed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === "strategy" && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Select Your AI Strategy</CardTitle>
                  <CardDescription className="text-slate-400">
                    Start with our free Conservative strategy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedStrategy} onValueChange={setSelectedStrategy}>
                    <div className="space-y-4">
                      {strategies.map((strategy) => (
                        <div
                          key={strategy.id}
                          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedStrategy === strategy.id
                              ? "border-emerald-500 bg-emerald-500/5"
                              : "border-slate-700 hover:border-slate-600"
                          }`}
                          onClick={() => setSelectedStrategy(strategy.id)}
                        >
                          {strategy.badge && (
                            <Badge className="absolute -top-2 right-4 bg-emerald-600">
                              {strategy.badge}
                            </Badge>
                          )}
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value={strategy.id} id={strategy.id} className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <strategy.icon className="size-6 text-emerald-500" />
                                <div>
                                  <Label htmlFor={strategy.id} className="text-white text-lg cursor-pointer">
                                    {strategy.name}
                                  </Label>
                                  <div className="text-emerald-500 font-semibold">{strategy.price}</div>
                                </div>
                              </div>
                              <p className="text-slate-400 text-sm mb-3">{strategy.description}</p>
                              <ul className="space-y-1">
                                {strategy.features.map((feature) => (
                                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                                    <Check className="size-4 text-emerald-500" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <p className="text-sm text-slate-300">
                      <strong className="text-white">Note:</strong> The Conservative plan is completely free
                      and perfect for getting started with AI trading. Test the platform risk-free!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === "confirmation" && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="text-center">
                    <div className="size-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="size-8 text-emerald-500" />
                    </div>
                    <CardTitle className="text-white text-2xl">Ready to Launch!</CardTitle>
                    <CardDescription className="text-slate-400">
                      Review your setup and activate your AI trader
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400">Deposit Amount</span>
                        <span className="text-white font-semibold">${depositAmount} (BTC)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Selected Strategy</span>
                        <span className="text-white font-semibold">
                          {strategies.find((s) => s.id === selectedStrategy)?.name}
                        </span>
                      </div>
                    </div>

                    {selectedStrategy !== "conservative" && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="size-5 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-amber-400 font-medium mb-1">Subscription Required</p>
                            <p className="text-sm text-slate-300">
                              Your {strategies.find((s) => s.id === selectedStrategy)?.name} subscription
                              will be activated once your deposit is confirmed.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Info className="size-5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-emerald-400 font-medium mb-1">What happens next?</p>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>1. Your deposit will be confirmed (10-30 min)</li>
                            <li>2. AI will be automatically activated</li>
                            <li>3. Trading begins based on your selected strategy</li>
                            <li>4. Monitor progress from your dashboard</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleFinish}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="lg"
                  >
                    Activate AI Trader
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {currentStep !== "confirmation" && (
          <div className="flex gap-4 mt-6">
            {currentStep !== "deposit" && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 border-slate-700 text-white hover:bg-slate-800"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              Continue
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}