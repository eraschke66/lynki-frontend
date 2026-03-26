const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface TopicQuizOption {
  index: number;
  text: string;
  explanation: string;
}

export interface TopicQuizQuestion {
  id: string;
  question: string;
  concept_id: string;
  concept_name: string;
  difficulty: "easy" | "medium" | "hard";
  hint: string | null;
  options: TopicQuizOption[];
}

export interface TopicQuizSession {
  id: string;
  topic_id: string;
  topic_name: string;
  status: "in_progress" | "completed";
  current_index: number;
  total_questions: number;
  correct_count: number;
  questions: TopicQuizQuestion[];
  created_at: string;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_option_index: number;
  correct_option_text: string;
  selected_explanation: string;
  correct_explanation: string;
  hint: string | null;
}

export async function fetchTopicQuizSession(
  userId: string,
  courseId: string,
  topicId: string,
): Promise<TopicQuizSession> {
  const res = await fetch(
    `${API_URL}/topic-quiz/session/${userId}/${courseId}/${topicId}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Failed to load topic quiz (${res.status})`);
  }
  return res.json();
}

export async function submitTopicQuizAnswer(
  sessionId: string,
  questionIndex: number,
  selectedOption: number,
): Promise<AnswerResult> {
  const res = await fetch(`${API_URL}/topic-quiz/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      question_index: questionIndex,
      selected_option: selectedOption,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Failed to submit answer");
  }
  return res.json();
}

export async function completeTopicQuiz(sessionId: string): Promise<void> {
  await fetch(`${API_URL}/topic-quiz/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
}
