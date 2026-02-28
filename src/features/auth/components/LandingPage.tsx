import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LogoSvg from "@/assets/logo.svg?react";
import { Sparkles, BookOpen, Trophy, Brain } from "lucide-react";

/**
 * Landing page shown to unauthenticated users.
 * Provides entry points to sign up or log in.
 */
export function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-primary/5 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Logo and Title */}
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="w-24 h-24 md:w-32 md:h-32">
              <LogoSvg className="w-full h-full" />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-linear-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  PassAI
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                Upload your study materials. Take AI-generated quizzes.
                <br />
                See your estimated passing chance.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/signup">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Started Free
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-8"
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Materials</h3>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, DOCX, or presentations. Our AI extracts key
                concepts and generates quiz questions automatically.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Take Quizzes</h3>
              <p className="text-sm text-muted-foreground">
                Test your understanding with intelligent questions tailored to
                your study materials. Take as many as you want.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Know Your Passing Chance
              </h3>
              <p className="text-sm text-muted-foreground">
                Get an estimated passing probability powered by Bayesian
                Knowledge Tracing. The more you practice, the more accurate it
                gets.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-12 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              Free to get started • No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
