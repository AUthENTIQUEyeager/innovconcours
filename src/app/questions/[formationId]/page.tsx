'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createServerSupabase } from "@/lib/supabase/server";

type Question = {
  id: string;
  texte: string;
  options: Array<{ id: string; texte: string }>;
  reponseCorrecte: number; // index of correct option
  explication?: string;
  reference?: string;
};

type QuizState = {
  currentQuestionIndex: number;
  score: number;
  userAnswers: number[]; // stores selected option index for each question
  isSubmitted: boolean;
  showExplanation: boolean;
};

export default async function FormationQuestionsPage({
  params,
}: {
  params: { formationId: string };
}) {
  const supabase = createServerSupabase();
  const formationId = params.formationId;

  // Fetch formation details
  const { data: formation } = await supabase
    .from("formations")
    .select("nom, type_concours")
    .eq("id", formationId)
    .single();

  // Fetch questions for this formation (assuming we have a questions table)
  // For now, we'll use mock data - in real implementation, replace with actual fetch
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual supabase query
    const mockQuestions: Question[] = [
      {
        id: "1",
        texte: "Quel est le rôle principal du ministère de l'Économie et des Finances (MEF) dans la gestion publique ?",
        options: [
          { id: "a", texte: "Gérer les ressources humaines de l'État" },
          { id: "b", texte: "Élaborer et exécuter le budget de l'État" },
          { id: "c", texte: "Contrôler les activités des entreprises privées" },
          { id: "d", texte: "Organiser les élections nationales" },
        ],
        reponseCorrecte: 1, // B
        explication: "Le MEF est principalement responsable de l'élaboration, de l'exécution et du contrôle du budget de l'État, ainsi que de la gestion des finances publiques.",
        reference: "Code des finances publiques, article 1",
      },
      {
        id: "2",
        texte: "Dans la fonction publique burkinabè, quel est le principe d'égalité d'accès aux emplois publics ?",
        options: [
          { id: "a", texte: "L'accès est réservé aux candidats provenant de certaines régions" },
          { id: "b", texte: "L'accès se fait exclusivement par nomination présidentielle" },
          { id: "c", texte: "Tous les citoyens remplissant les conditions requises peuvent accéder aux emplois publics sans discrimination" },
          { id: "d", texte: "L'accès est déterminé par l'appartenance à un parti politique spécifique" },
        ],
        reponseCorrecte: 2, // C
        explication: "Le principe d'égalité d'accès aux emplois publics signifie que tout citoyen remplissant les conditions requises (diplômes, âge, etc.) peut concourir pour un emploi public, sans discrimination d'origine, de sexe, de religion ou d'opinions politiques.",
        reference: "Statut général de la fonction publique, article 5",
      },
      // Add more mock questions as needed
    ];
    setQuestions(mockQuestions);
    setLoading(false);
  }, []);

  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    score: 0,
    userAnswers: [],
    isSubmitted: false,
    showExplanation: false,
  });

  const handleAnswerSelect = (optionIndex: number) => {
    // Only allow answering if not yet submitted for this question
    if (!quizState.isSubmitted && !quizState.showExplanation) {
      const newAnswers = [...quizState.userAnswers];
      newAnswers[quizState.currentQuestionIndex] = optionIndex;
      setQuizState((prev) => ({
        ...prev,
        userAnswers: newAnswers,
        showExplanation: true, // Show explanation after answer
      }));
    }
  };

  const handleNextQuestion = () => {
    if (quizState.showExplanation) {
      // Move to next question or finish
      if (quizState.currentQuestionIndex < questions.length - 1) {
        setQuizState((prev) => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          isSubmitted: false,
          showExplanation: false,
        }));
      } else {
        // Calculate score and submit
        let score = 0;
        questions.forEach((q, index) => {
          if (quizState.userAnswers[index] === q.reponseCorrecte) {
            score++;
          }
        });
        setQuizState((prev) => ({
          ...prev,
          score,
          isSubmitted: true,
          showExplanation: false,
        }));
      }
    }
  };

  const resetQuiz = () => {
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      userAnswers: [],
      isSubmitted: false,
      showExplanation: false,
    });
  };

  const currentQuestion = questions[quizState.currentQuestionIndex];

  if (loading) {
    return (
      <>
        <Header />
        <section className="min-h-screen flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink mb-4">Chargement des questions...</h2>
            <p className="text-lg text-ink/60">
              Préparation de votre session d'entraînement pour la formation {
                formation?.nom
              }
            </p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <Header />
        <section className="min-h-screen flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink mb-4">
              Aucune question disponible
            </h2>
            <p className="text-lg text-ink/60">
              Aucune question n'est actuellement disponible pour la formation {
                formation?.nom
              }. Veuillez consulter un administrateur.
            </p>
            <Link
              href="/tableau-de-bord"
              className="mt-6 inline-flex items-center px-4 py-2 bg-ink text-paper rounded-full hover:bg-ink-light"
            >
              Retour au tableau de bord
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        {/* Quiz Header */}
        <div className="mb-8 pb-4 border-b border-ink/10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-ink">
                Formation : {formation?.nom}
              </h2>
              <p className="text-sm text-ink/50">
                {questions.length} questions • {
                  quizState.currentQuestionIndex + 1
                }/{questions.length}
              </p>
            </div>
            {/* Timer placeholder */}
            <div className="text-sm font-mono text-ink/60">
              {/* 00:15 */}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-ink/10 rounded-full mb-6">
            <div
              className={`h-full bg-gold-dark rounded-full transition-all duration-500 w-${(((quizState.currentQuestionIndex + 1) / questions.length) * 100).toFixed(
                0
              )}%`}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-ink/10">
          {/* Question Text */}
          <div className="mb-6">
            <p className="text-xl font-display text-ink leading-relaxed">
              {currentQuestion.texte}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected =
                quizState.userAnswers[quizState.currentQuestionIndex] === index;
              const isCorrect =
                quizState.isSubmitted &&
                index === currentQuestion.reponseCorrecte;
              const isWrong =
                quizState.isSubmitted &&
                isSelected &&
                index !== currentQuestion.reponseCorrecte;

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={quizState.isSubmitted || quizState.showExplanation}
                  className={`w-full text-left px-5 py-4 border border-ink/20 rounded-lg
                   ${isSelected
                     ? isCorrect
                       ? 'bg-validated/20 text-validated border-validated'
                       : isWrong
                       ? 'bg-seal/20 text-seal border-seal'
                       : 'bg-ink/5'
                     : 'hover:bg-ink/5 transition-colors'}
                   ${quizState.isSubmitted && !isSelected && !isCorrect ? 'opacity-50' : ''}
                   `}
                >
                  <div className="flex items-start space-x-3">
                    <span className="font-mono text-ink/80 w-8">{option.id.toUpperCase()}.</span>
                    <span className="text-base text-ink">{option.texte}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation (shown after answer) */}
          {quizState.showExplanation && !quizState.isSubmitted && (
            <div className="mt-6 p-5 border-l-4
                   ${currentQuestion.reponseCorrecte ===
                   quizState.userAnswers[quizState.currentQuestionIndex]
                     ? 'border-validated bg-validated/5'
                     : 'border-seal bg-seal/5'}"
            >
              <div className="flex items-start space-x-3 mb-3">
                <span className="flex h-8 w-8 items-center justify-center
                       ${currentQuestion.reponseCorrecte ===
                       quizState.userAnswers[quizState.currentQuestionIndex]
                         ? 'bg-validated/20 text-validated rounded-full'
                         : 'bg-seal/20 text-seal rounded-rounded'}"
                >
                  {currentQuestion.reponseCorrecte ===
                  quizState.userAnswers[quizState.currentQuestionIndex]
                    ? "✓"
                    : "✗"}
                </span>
                <div>
                  <p className="font-display text-lg text-ink mb-1">
                    {
                      currentQuestion.reponseCorrecte ===
                      quizState.userAnswers[quizState.currentQuestionIndex]
                        ? "Correct !"
                        : "Incorrect"
                    }
                  </p>
                  <p className="text-sm text-ink/60 leading-relaxed">
                    {currentQuestion.explication}
                    {currentQuestion.reference && (
                      <>
                        <span className="block mt-1 text-xs font-mono text-ink/40">
                          Voir : {currentQuestion.reference}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Results (when submitted) */}
          {quizState.isSubmitted && (
            <div className="mt-6 p-6 bg-ink/5 rounded-xl border border-ink/10">
              <h3 className="font-display text-lg text-ink mb-4">
                Résultats du quiz
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-ink/60">Score:</span>
                  <span className="font-bold text-2xl text-gold-dark">
                    {quizState.score}/{questions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-ink/60">Pourcentage:</span>
                  <span className="font-bold text-2xl text-gold-dark">
                    {(((quizState.score / questions.length) * 100) || 0).toFixed(
                      0
                    )}%
                  </span>
                </div>
                <div className="mt-4">
                  {
                    quizState.score === questions.length
                      ? (
                        <p className="text-validated font-medium">
                          Excellent ! Vous avez maîtrisé toutes les questions de cette formation.
                        </p>
                      )
                      : quizState.score >= questions.length * 0.7
                      ? (
                        <p className="text-gold-dark font-medium">
                          Très bon résultat ! Continuez vos efforts pour atteindre l'excellence.
                        </p>
                      )
                      : (
                        <p className="text-seal font-medium">
                          Vous pouvez améliorer votre score en révisant les topics où vous avez eu des difficultés.
                        </p>
                      )
                  }
                </div>
                <div className="mt-6 flex justify-between">
                  <Link
                    href="/tableau-de-bord"
                    className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink transition"
                  >
                    Retour au tableau de bord
                  </Link>
                  <button
                    onClick={resetQuiz}
                    className="px-4 py-2 text-sm font-medium bg-ink text-paper rounded-full hover:bg-ink-light"
                  >
                    Refaire le quiz
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {!quizState.isSubmitted && (
            <div className="mt-8 pt-4 border-t border-ink/10 flex justify-between">
              {/* Previous button (disabled on first question) */}
              {quizState.currentQuestionIndex > 0 && (
                <button
                  onClick={() =>
                    setQuizState((prev) => ({
                      ...prev,
                      currentQuestionIndex: prev.currentQuestionIndex - 1,
                      isSubmitted: false,
                      showExplanation: false,
                    }))
                  }
                  className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink transition"
                >
                  ← Question précédente
                </button>
              )}
              {/* Next/Submit button */}
              <button
                onClick={handleNextQuestion}
                disabled={
                  !quizState.showExplanation &&
                  quizState.userAnswers[quizState.currentQuestionIndex] === undefined
                }
                className={`px-6 py-3 font-semibold
                 ${quizState.showExplanation
                   ? 'bg-gold-dark text-paper'
                   : 'bg-ink text-paper'}
                 rounded-full hover:${quizState.showExplanation
                   ? 'bg-gold-light'
                   : 'bg-ink-light'}
                 transition`}
              >
                {quizState.showExplanation
                  ? quizState.currentQuestionIndex < questions.length - 1
                    ? "Question suivante"
                    : "Terminer et voir le résultat"
                  : quizState.userAnswers[quizState.currentQuestionIndex] === undefined
                  ? "Sélectionnez une réponse"
                  : "Valider la réponse"}
              </button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}