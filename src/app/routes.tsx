import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing";
import { SignupPage } from "./pages/signup";
import { SignInPage } from "./pages/signin";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { OnboardingPage } from "./pages/onboarding";
import { DashboardPage } from "./pages/dashboard";
import { Verify2FAPage } from "./pages/verify-2fa";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/signup",
    Component: SignupPage,
  },
  {
    path: "/signin",
    Component: SignInPage,
  },
  {
    path: "/verify-2fa",
    Component: Verify2FAPage,
  },
  {
    path: "/forgot-password",
    Component: ForgotPasswordPage,
  },
  {
    path: "/onboarding",
    Component: OnboardingPage,
  },
  {
    path: "/dashboard",
    Component: DashboardPage,
  },
]);