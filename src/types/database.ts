/**
 * Database types for Supabase schema.
 * This provides type safety for all database operations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string;
          document_id: string | null;
          user_id: string | null;
          generation_status: "pending" | "generating" | "completed" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          document_id?: string | null;
          user_id?: string | null;
          generation_status?: "pending" | "generating" | "completed" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          document_id?: string | null;
          user_id?: string | null;
          generation_status?: "pending" | "generating" | "completed" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quizzes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          options: Json;
          correct_answer: number;
          explanation: string;
          order_index: number;
          concept_id: string | null;
          hint: string | null;
          difficulty_level: "easy" | "medium" | "hard";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          options: Json;
          correct_answer: number;
          explanation: string;
          order_index?: number;
          concept_id?: string | null;
          hint?: string | null;
          difficulty_level?: "easy" | "medium" | "hard";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question?: string;
          options?: Json;
          correct_answer?: number;
          explanation?: string;
          order_index?: number;
          concept_id?: string | null;
          hint?: string | null;
          difficulty_level?: "easy" | "medium" | "hard";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey";
            columns: ["quiz_id"];
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_concept_id_fkey";
            columns: ["concept_id"];
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
        ];
      };
      user_quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total_questions: number;
          answers: Json;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score: number;
          total_questions: number;
          answers: Json;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string;
          score?: number;
          total_questions?: number;
          answers?: Json;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_quiz_attempts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          option_text: string;
          option_index: number;
          is_correct: boolean;
          explanation: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_text: string;
          option_index: number;
          is_correct?: boolean;
          explanation: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_text?: string;
          option_index?: number;
          is_correct?: boolean;
          explanation?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      topics: {
        Row: {
          id: string;
          document_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      concepts: {
        Row: {
          id: string;
          topic_id: string;
          name: string;
          explanation: string;
          source_text: string | null;
          complexity_level: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          name: string;
          explanation: string;
          source_text?: string | null;
          complexity_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          name?: string;
          explanation?: string;
          source_text?: string | null;
          complexity_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "concepts_topic_id_fkey";
            columns: ["topic_id"];
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          file_path: string;
          file_type: string;
          file_size: number;
          status: "pending" | "processing" | "completed" | "failed";
          extracted_text: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          file_path: string;
          file_type: string;
          file_size: number;
          status?: "pending" | "processing" | "completed" | "failed";
          extracted_text?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          status?: "pending" | "processing" | "completed" | "failed";
          extracted_text?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_concept_mastery: {
        Row: {
          id: string;
          user_id: string;
          concept_id: string;
          status: "not_started" | "in_progress" | "mastered";
          correct_count: number;
          attempt_count: number;
          current_streak: number;
          mastered_at: string | null;
          next_review_at: string | null;
          review_interval_days: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          concept_id: string;
          status?: "not_started" | "in_progress" | "mastered";
          correct_count?: number;
          attempt_count?: number;
          current_streak?: number;
          mastered_at?: string | null;
          next_review_at?: string | null;
          review_interval_days?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          concept_id?: string;
          status?: "not_started" | "in_progress" | "mastered";
          correct_count?: number;
          attempt_count?: number;
          current_streak?: number;
          mastered_at?: string | null;
          next_review_at?: string | null;
          review_interval_days?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_concept_mastery_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_concept_mastery_concept_id_fkey";
            columns: ["concept_id"];
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
        ];
      };
      user_question_attempts: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          concept_id: string | null;
          selected_option: number;
          is_correct: boolean;
          time_spent_ms: number | null;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          concept_id?: string | null;
          selected_option: number;
          is_correct: boolean;
          time_spent_ms?: number | null;
          session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          concept_id?: string | null;
          selected_option?: number;
          is_correct?: boolean;
          time_spent_ms?: number | null;
          session_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_question_attempts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_question_attempts_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_question_attempts_concept_id_fkey";
            columns: ["concept_id"];
            referencedRelation: "concepts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
