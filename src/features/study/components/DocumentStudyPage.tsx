import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  CheckCircle,
  Circle,
  Loader2,
  AlertCircle,
  Play,
  Trophy,
  Target,
  Clock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  fetchDocumentProgress,
  getNextConceptToStudy,
} from "../services/studyService";
import { StudySession } from "./StudySession";
import type { ConceptMastery } from "../types";

const studyQueryKeys = {
  documentProgress: (documentId: string, userId: string) =>
    ["study", "progress", documentId, userId] as const,
};

export function DocumentStudyPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [studyingConceptId, setStudyingConceptId] = useState<string | null>(
    null,
  );

  const {
    data: progress,
    isLoading,
    error,
  } = useQuery({
    queryKey: studyQueryKeys.documentProgress(documentId ?? "", user?.id ?? ""),
    queryFn: () => fetchDocumentProgress(documentId!, user!.id),
    enabled: !!documentId && !!user,
  });

  const handleStartStudying = async () => {
    if (!documentId || !user) return;

    const nextConcept = await getNextConceptToStudy(documentId, user.id);
    if (nextConcept) {
      setStudyingConceptId(nextConcept);
    }
  };

  const handleStudyConcept = (conceptId: string) => {
    setStudyingConceptId(conceptId);
  };

  const handleSessionComplete = () => {
    setStudyingConceptId(null);
    // Invalidate to refresh progress
    queryClient.invalidateQueries({
      queryKey: studyQueryKeys.documentProgress(documentId!, user!.id),
    });
  };

  const handleExitSession = () => {
    setStudyingConceptId(null);
    queryClient.invalidateQueries({
      queryKey: studyQueryKeys.documentProgress(documentId!, user!.id),
    });
  };

  const getStatusIcon = (status: ConceptMastery["status"]) => {
    switch (status) {
      case "mastered":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "in_progress":
        return <Target className="w-5 h-5 text-amber-500" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (concept: ConceptMastery) => {
    switch (concept.status) {
      case "mastered":
        return (
          <span className="text-emerald-600 dark:text-emerald-400 text-sm">
            Mastered
          </span>
        );
      case "in_progress":
        return (
          <span className="text-amber-600 dark:text-amber-400 text-sm">
            {concept.correctCount}/3 correct
          </span>
        );
      default:
        return (
          <span className="text-muted-foreground text-sm">Not started</span>
        );
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  // Show study session if actively studying
  if (studyingConceptId && documentId) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
          <div className="max-w-4xl mx-auto">
            <StudySession
              conceptId={studyingConceptId}
              documentId={documentId}
              onComplete={handleSessionComplete}
              onExit={handleExitSession}
            />
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
          <div className="flex items-center justify-center min-h-100">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading progress...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !progress) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">
                  Failed to load document progress
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/documents")}
                >
                  Back to Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const allMastered = progress.overallProgress === 100;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background p-6 md:p-12 pt-28">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back button */}
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => navigate("/documents")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </Button>

          {/* Document header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{progress.documentTitle}</h1>
                <p className="text-muted-foreground">
                  {progress.totalConcepts} concepts to master
                </p>
              </div>

              {allMastered ? (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Trophy className="w-6 h-6" />
                  <span className="font-semibold">All Mastered!</span>
                </div>
              ) : (
                <Button onClick={handleStartStudying} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Start Studying
                </Button>
              )}
            </div>

            {/* Overall progress */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Overall Progress
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {progress.masteredConcepts}/{progress.totalConcepts}{" "}
                      concepts mastered
                    </span>
                  </div>
                  <Progress value={progress.overallProgress} className="h-3" />

                  {progress.conceptsDueForReview > 0 && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {progress.conceptsDueForReview} concept
                        {progress.conceptsDueForReview > 1 ? "s" : ""} due for
                        review
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topics and Concepts */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Concepts by Topic
            </h2>

            <Accordion type="multiple" className="space-y-2">
              {progress.topics.map((topic) => (
                <AccordionItem
                  key={topic.topicId}
                  value={topic.topicId}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="font-medium">{topic.topicName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {topic.masteredConcepts}/{topic.totalConcepts}
                        </span>
                        <Progress
                          value={topic.overallProgress}
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="space-y-2 pt-2 pb-4">
                      {topic.concepts.map((concept) => (
                        <div
                          key={concept.conceptId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(concept.status)}
                            <div>
                              <p className="font-medium">
                                {concept.conceptName}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {concept.conceptExplanation}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {getStatusText(concept)}

                            {concept.questionCount > 0 && (
                              <Button
                                size="sm"
                                variant={
                                  concept.status === "mastered"
                                    ? "outline"
                                    : "default"
                                }
                                onClick={() =>
                                  handleStudyConcept(concept.conceptId)
                                }
                              >
                                {concept.status === "mastered" ? (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    Review
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 mr-1" />
                                    Study
                                  </>
                                )}
                              </Button>
                            )}

                            {concept.questionCount === 0 && (
                              <span className="text-xs text-muted-foreground">
                                No questions
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </>
  );
}
