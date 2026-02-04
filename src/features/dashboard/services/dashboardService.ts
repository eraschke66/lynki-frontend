import { supabase } from "@/lib/supabase";
import type { DashboardData, MaterialSummary, ReviewItem } from "../types";

/**
 * Fetch all dashboard data for a user
 */
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // Fetch all user's documents
  const { data: documents, error: docsError } = await supabase
    .from("documents")
    .select("id, title, file_type, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (docsError) {
    console.error("Error fetching documents:", docsError);
    throw docsError;
  }

  // For completed documents, fetch progress data
  const completedDocs = documents?.filter((d) => d.status === "completed") || [];
  const docIds = completedDocs.map((d) => d.id);

  // Fetch topics and concepts for completed documents
  const { data: topics } = docIds.length > 0
    ? await supabase
        .from("topics")
        .select(`
          id,
          document_id,
          concepts (id)
        `)
        .in("document_id", docIds)
    : { data: [] };

  // Build concept count per document
  const conceptCountByDoc = new Map<string, number>();
  topics?.forEach((topic) => {
    const docId = topic.document_id;
    const count = (topic.concepts as { id: string }[])?.length || 0;
    conceptCountByDoc.set(docId, (conceptCountByDoc.get(docId) || 0) + count);
  });

  // Get all concept IDs
  const allConceptIds = topics?.flatMap(
    (t) => (t.concepts as { id: string }[])?.map((c) => c.id) || []
  ) || [];

  // Fetch user's mastery data
  const { data: masteryData } = allConceptIds.length > 0
    ? await supabase
        .from("user_concept_mastery")
        .select("*")
        .eq("user_id", userId)
        .in("concept_id", allConceptIds)
    : { data: [] };

  // Build mastery map by document
  const masteryByDoc = new Map<string, { mastered: number; total: number; dueForReview: number }>();
  const conceptToDoc = new Map<string, string>();

  topics?.forEach((topic) => {
    const concepts = (topic.concepts as { id: string }[]) || [];
    concepts.forEach((c) => {
      conceptToDoc.set(c.id, topic.document_id);
    });

    if (!masteryByDoc.has(topic.document_id)) {
      masteryByDoc.set(topic.document_id, { mastered: 0, total: 0, dueForReview: 0 });
    }
    const entry = masteryByDoc.get(topic.document_id)!;
    entry.total += concepts.length;
  });

  const now = new Date().toISOString();
  const reviewsDue: ReviewItem[] = [];

  masteryData?.forEach((m) => {
    const docId = conceptToDoc.get(m.concept_id);
    if (docId) {
      const entry = masteryByDoc.get(docId);
      if (entry) {
        if (m.status === "mastered") {
          entry.mastered += 1;
          if (m.next_review_at && m.next_review_at <= now) {
            entry.dueForReview += 1;
            // Add to reviews list
            const doc = documents?.find((d) => d.id === docId);
            reviewsDue.push({
              conceptId: m.concept_id,
              conceptName: "", // Will fill in below
              documentId: docId,
              documentTitle: doc?.title || "Unknown",
              dueAt: m.next_review_at,
              reviewCount: m.review_count || 0,
            });
          }
        }
      }
    }
  });

  // Fetch concept names for reviews
  if (reviewsDue.length > 0) {
    const reviewConceptIds = reviewsDue.map((r) => r.conceptId);
    const { data: concepts } = await supabase
      .from("concepts")
      .select("id, name")
      .in("id", reviewConceptIds);

    const conceptNameMap = new Map(concepts?.map((c) => [c.id, c.name]) || []);
    reviewsDue.forEach((r) => {
      r.conceptName = conceptNameMap.get(r.conceptId) || "Unknown";
    });
  }

  // Check for quizzes
  const { data: quizzes } = docIds.length > 0
    ? await supabase
        .from("quizzes")
        .select("document_id, generation_status")
        .in("document_id", docIds)
    : { data: [] };

  const quizByDoc = new Map(
    quizzes?.map((q) => [q.document_id, q.generation_status === "completed"]) || []
  );

  // Build materials list
  const materials: MaterialSummary[] = (documents || []).map((doc) => {
    const masteryInfo = masteryByDoc.get(doc.id);
    const totalConcepts = masteryInfo?.total || 0;
    const masteredConcepts = masteryInfo?.mastered || 0;

    return {
      id: doc.id,
      title: doc.title,
      fileType: doc.file_type,
      status: doc.status as MaterialSummary["status"],
      createdAt: doc.created_at,
      totalConcepts,
      masteredConcepts,
      progressPercent: totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 0,
      conceptsDueForReview: masteryInfo?.dueForReview || 0,
      hasQuiz: quizByDoc.get(doc.id) || false,
    };
  });

  // Calculate totals
  const totalConceptsMastered = Array.from(masteryByDoc.values()).reduce(
    (sum, m) => sum + m.mastered,
    0
  );
  const totalConcepts = Array.from(masteryByDoc.values()).reduce(
    (sum, m) => sum + m.total,
    0
  );

  // Determine next study item
  let nextStudyItem: DashboardData["nextStudyItem"] = null;

  // Priority: in-progress concepts, then new material, then reviews
  const inProgressMastery = masteryData?.find((m) => m.status === "in_progress");
  if (inProgressMastery) {
    const docId = conceptToDoc.get(inProgressMastery.concept_id);
    const doc = documents?.find((d) => d.id === docId);
    const { data: concept } = await supabase
      .from("concepts")
      .select("name")
      .eq("id", inProgressMastery.concept_id)
      .single();

    if (doc && concept) {
      nextStudyItem = {
        documentId: docId!,
        documentTitle: doc.title,
        conceptId: inProgressMastery.concept_id,
        conceptName: concept.name,
        reason: "continue",
      };
    }
  }

  // If no in-progress, find material with unstarted concepts
  if (!nextStudyItem) {
    for (const material of materials) {
      if (
        material.status === "completed" &&
        material.totalConcepts > 0 &&
        material.masteredConcepts < material.totalConcepts
      ) {
        nextStudyItem = {
          documentId: material.id,
          documentTitle: material.title,
          conceptId: null,
          conceptName: null,
          reason: "new",
        };
        break;
      }
    }
  }

  // If all concepts started, suggest review
  if (!nextStudyItem && reviewsDue.length > 0) {
    const review = reviewsDue[0];
    nextStudyItem = {
      documentId: review.documentId,
      documentTitle: review.documentTitle,
      conceptId: review.conceptId,
      conceptName: review.conceptName,
      reason: "review",
    };
  }

  return {
    materials,
    reviewsDue: reviewsDue.slice(0, 10), // Limit to 10
    totalMaterials: materials.length,
    totalConceptsMastered,
    totalConcepts,
    overallProgress: totalConcepts > 0 ? Math.round((totalConceptsMastered / totalConcepts) * 100) : 0,
    nextStudyItem,
  };
}
