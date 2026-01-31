import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { fetchUserQuizzes } from "../services/quizService";
import type { QuizListItem } from "@/types/quiz";
import { quizQueryKeys } from "@/lib/queryKeys";

export function QuizList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch quizzes with React Query (cached, no refetch on focus)
  const {
    data: quizzes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: quizQueryKeys.list(user?.id ?? ""),
    queryFn: () => fetchUserQuizzes(user!.id),
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        );
      case "generating":
        return (
          <Badge className="bg-blue-500">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Generating
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStartQuiz = (quizId: string) => {
    navigate(`/quiz/${quizId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="text-destructive">Failed to load quizzes. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No quizzes yet</h3>
              <p className="text-sm text-muted-foreground">
                Upload documents to generate quizzes automatically.
              </p>
            </div>
            <Button onClick={() => navigate("/documents")}>
              Go to Documents
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Quizzes</h2>
        <p className="text-sm text-muted-foreground">
          {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"} available
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz: QuizListItem) => (
          <Card
            key={quiz.id}
            className="hover:shadow-lg transition-all hover:border-primary/50"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
                  {quiz.documentTitle && (
                    <CardDescription className="mt-1">
                      From: {quiz.documentTitle}
                    </CardDescription>
                  )}
                </div>
                {getStatusBadge(quiz.generationStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {quiz.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {quiz.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{quiz.questionCount} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>~{Math.ceil(quiz.questionCount * 1.5)} min</span>
                </div>
              </div>

              <Button
                onClick={() => handleStartQuiz(quiz.id)}
                disabled={quiz.generationStatus !== "completed"}
                className="w-full"
              >
                {quiz.generationStatus === "completed"
                  ? "Start Quiz"
                  : quiz.generationStatus === "generating"
                    ? "Generating..."
                    : "Unavailable"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
