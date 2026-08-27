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

type TestState = {
  currentQuestionIndex: number;
  userAnswers: number[]; // stores selected option index for each question
  timeLeft: number; // in seconds
  isTestOver: boolean;
  showResults: boolean;
};

export default async function FormationTestPage({
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

  // Fetch questions for this formation (mock data for now)
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
      {
        id: "3",
        texte: "Quelle est la durée du mandat du président du Faso selon la constitution burkinabè ?",
        options: [
          { id: "a", texte: "5 ans, renouvelable une fois" },
          { id: "b", texte: "7 ans, non renouvelable" },
          { id: "c", texte: "5 ans, renouvelable deux fois" },
          { id: "d", texte: "6 ans, renouvelable une fois" },
        ],
        reponseCorrecte: 0, // A
        explication: "Selon la constitution du Burkina Faso, le mandat du président du Faso est de cinq ans, renouvelable une seule fois.",
        reference: "Constitution du Burkina Faso, article 37",
      },
      {
        id: "4",
        texte: "Quel est le principal objectif du ministère de l'Administration Territoire et de la Mobilité (MATM) ?",
        options: [
          { id: "a", texte: "Gérer les ressources hydrauliques du pays" },
          { id: "b", texte: "Administrer le territoire et assurer la mobilité" },
          { id: "c", texte: "Promouvoir l'industrie et le commerce" },
          { id: "d", texte: "Assurer la santé de la population" },
        ],
        reponseCorrecte: 1, // B
        explication: "Le MATM est chargé de l'administration du territoire, de la décentralisation, de la voirie rurale et de la mobilité.",
        reference: "Décret portant attributions du MATM",
      },
      {
        id: "5",
        texte: "En matière de droit pénal burkinabè, quelle est la peine maximale pour un crime ?",
        options: [
          { id: "a", texte: "10 ans d'emprisonnement" },
          { id: "b", texte: "20 ans d'emprisonnement" },
          { id: "c", texte: "Perpétuité" },
          { id: "d", texte: "Peine de mort" },
        ],
        reponseCorrecte: 2, // C
        explication: "Au Burkina Faso, la peine maximale pour un crime est la réclusion criminelle à perpétuité.",
        reference: "Code pénal burkinabè, article 120",
      },
    ];
    setQuestions(mockQuestions);
    setLoading(false);
  }, []);

  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    userAnswers: Array(questions.length).fill(-1), // -1 means not answered
    timeLeft: 90 * 60, // 90 minutes in seconds
    isTestOver: false,
    showResults: false,
  });

  // Timer effect
  useEffect(() => {
    if (testState.timeLeft > 0 && !testState.isTestOver) {
      const timer = setInterval(() => {
        setTestState((prev) => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
      return () => clearInterval(timer);
    } else if (testState.timeLeft <= 0 && !testState.isTestOver) {
      // Time's up, end the test
      setTestState((prev) => ({
        ...prev,
        isTestOver: true,
        showResults: true,
      }));
    }
  }, [testState.timeLeft, testState.isTestOver]);

  const handleAnswerSelect = (optionIndex: number) => {
    // Only allow answering if test is not over
    if (!testState.isTestOver) {
      const newAnswers = [...testState.userAnswers];
      newAnswers[testState.currentQuestionIndex] = optionIndex;
      setTestState((prev) => ({
        ...prev,
        userAnswers: newAnswers,
      }));
    }
  };

  const handlePreviousQuestion = () => {
    if (testState.currentQuestionIndex > 0) {
      setTestState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  const handleNextQuestion = () => {
    if (testState.currentQuestionIndex < questions.length - 1) {
      setTestState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  };

  const handleEndTest = () => {
    if (window.confirm("Voulez-vous vraiment terminer le test maintenant ?")) {
      setTestState((prev) => ({
        ...prev,
        isTestOver: true,
        showResults: true,
      }));
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (testState.userAnswers[index] === q.reponseCorrecte) {
        score++;
      }
    });
    return score;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <section className="min-h-screen flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink mb-4">Chargement du test...</h2>
            <p className="text-lg text-ink/60">
              Préparation de votre test pour la formation {
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

  const currentQuestion = questions[testState.currentQuestionIndex];
  const score = calculateScore();

  return (
    <>
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-12">
        {/* Test Header with Timer and Progress */}
        <div className="mb-8 pb-4 border-b border-ink/10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-ink">
                Test : {formation?.nom}
              </h2>
              <p className="text-sm text-ink/50">
                {questions.length} questions • {
                  testState.currentQuestionIndex + 1
                }/{questions.length}
              </p>
              <p className="text-sm text-ink/50">
                Temps restant : {formatTime(testState.timeLeft)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-ink/10 rounded-full mb-6">
            <div
              className={`h-full bg-gold-dark rounded-full transition-all duration-500 w-${(((
                testState.currentQuestionIndex + 1
              ) /
                questions.length) *
                100).toFixed(0)}%`}
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
                testState.userAnswers[testState.currentQuestionIndex] === index;

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={testState.isTestOver || testState.showResults}
                  className={`w-full text-left px-5 py-4 border border-ink/20 rounded-lg
                   ${isSelected ? 'bg-ink/5' : 'hover:bg-ink/5 transition-colors'}
                   ${testState.isTestOver || testState.showResults ? 'opacity-70' : ''}
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

          {/* Navigation Controls */}
          {!testState.isTestOver && !testState.showResults && (
            <div className="mt-8 pt-4 border-t border-ink/10 flex justify-between">
              {/* Previous button (disabled on first question) */}
              {testState.currentQuestionIndex > 0 && (
                <button
                  onClick={handlePreviousQuestion}
                  className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink transition"
                >
                  ← Question précédente
                </button>
              )}
              {/* Next/End button */}
              <div className="flex space-x-3">
                <button
                  onClick={handleNextQuestion}
                  disabled={testState.currentQuestionIndex >= questions.length - 1}
                  className="px-4 py-2 text-sm font-medium bg-ink text-paper rounded-full hover:bg-ink-light"
                >
                  {testState.currentQuestionIndex < questions.length - 1
                    ? "Question suivante"
                    : "Terminer le test"}
                </button>
                {testState.currentQuestionIndex === questions.length - 1 && (
                  <button
                    onClick={handleEndTest}
                    className="px-4 py-2 text-sm font-medium bg-gold-dark text-paper rounded-full hover:bg-gold-light"
                  >
                    Terminer le test
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Test Results (when test is over) */}
          {testState.isTestOver && testState.showResults && (
            <div className="mt-6 p-6 bg-ink/5 rounded-xl border border-ink/10">
              <h3 className="font-display text-lg text-ink mb-4">
                Résultats du test
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-ink/60">Score:</span>
                  <span className="font-bold text-2xl text-gold-dark">
                    {score}/{questions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-ink/60">Pourcentage:</span>
                  <span className="font-bold text-2xl text-gold-dark">
                    {(((score / questions.length) * 100) || 0).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-4">
                  {
                    score === questions.length
                      ? (
                        <p className="text-validated font-medium">
                          Excellent ! Vous avez maîtrisé toutes les questions de ce test.
                        </p>
                      )
                      : score >= questions.length * 0.7
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
                    onClick={() =>
                      setTestState((prev) => ({
                        ...prev,
                        currentQuestionIndex: 0,
                        userAnswers: Array(questions.length).fill(-1),
                        timeLeft: 90 * 60,
                        isTestOver: false,
                        showResults: false,
                      }))
                    }
                    className="px-4 py-2 text-sm font-medium bg-ink text-paper rounded-full hover:bg-ink-light"
                  >
                    Refaire le test
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}