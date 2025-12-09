import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle, XCircle, Award } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { usePoints } from "@/hooks/usePoints";
import { useAchievements } from "@/hooks/useAchievements";

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  reward_points: number;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: any;
  correct_answer: number;
  explanation: string;
  order_num: number;
}

interface QuizzesTabProps {
  userId: string;
}

export const QuizzesTab = ({ userId }: QuizzesTabProps) => {
  const { t } = useTranslation();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addPoints } = usePoints();
  const { checkAndUnlockAchievements } = useAchievements();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error(t('discover.failedToLoadQuizzes'));
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("order_num", { ascending: true });

      if (error) throw error;

      setSelectedQuiz(quiz);
      setQuestions(data || []);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setQuizCompleted(false);
      setScore(0);
    } catch (error) {
      console.error("Error loading quiz questions:", error);
      toast.error(t('discover.failedToLoadQuiz'));
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;

    setShowExplanation(true);
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);

    if (selectedAnswer === questions[currentQuestionIndex].correct_answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    setQuizCompleted(true);

    try {
      const finalScore = selectedAnswer === questions[currentQuestionIndex].correct_answer ? score + 1 : score;
      
      await supabase.from("quiz_attempts").insert({
        user_id: userId,
        quiz_id: selectedQuiz!.id,
        score: finalScore,
        total_questions: questions.length,
        answers: userAnswers,
      });

      // Award points
      const pointsEarned = selectedQuiz?.reward_points 
        ? Math.round((finalScore / questions.length) * selectedQuiz.reward_points)
        : Math.round((finalScore / questions.length) * 50);
      
      addPoints(pointsEarned);

      // Check for quiz achievements
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", userId);
      
      const completedCount = (attempts?.length || 0) + 1;
      await checkAndUnlockAchievements("quizzes_completed", completedCount);

      // Perfect score achievement
      if (finalScore === questions.length) {
        await checkAndUnlockAchievements("perfect_quiz_scores", 1);
      }

      toast.success(`${t('discover.quizCompleted')} ${t('discover.youScored')} ${finalScore}/${questions.length}!`);
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
    }
  };

  const backToQuizList = () => {
    setSelectedQuiz(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setUserAnswers([]);
    setQuizCompleted(false);
    setScore(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-success/10 text-success border-success/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "hard":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedQuiz) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{t('discover.knowledgeQuizzes')}</h2>
        </div>

        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{quiz.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{quiz.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(quiz.difficulty)}>
                      {quiz.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      <Award className="w-3 h-3 mr-1" />
                      {quiz.reward_points} {t('common.points')}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button onClick={() => startQuiz(quiz)} size="sm" className="w-full mt-3">
                {t('discover.startQuiz')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (quizCompleted) {
    const finalScore = score;
    const percentage = (finalScore / questions.length) * 100;

    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-center">{t('discover.quizCompleted')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl font-bold text-primary">{finalScore}/{questions.length}</div>
          <p className="text-lg text-muted-foreground">
            {t('discover.youScored')} {percentage.toFixed(0)}%
          </p>
          {percentage >= 80 && (
            <Badge className="bg-success text-white">{t('discover.excellent')}</Badge>
          )}
          {percentage >= 50 && percentage < 80 && (
            <Badge className="bg-warning text-white">{t('discover.goodJob')}</Badge>
          )}
          {percentage < 50 && (
            <Badge variant="secondary">{t('discover.keepLearning')}</Badge>
          )}
          <Button onClick={backToQuizList} className="w-full">
            {t('discover.backToQuizzes')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;
  const questionOptions = Array.isArray(currentQuestion.options) 
    ? currentQuestion.options 
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={backToQuizList}>
          ← {t('common.back')}
        </Button>
        <Badge variant="outline">
          {t('discover.question')} {currentQuestionIndex + 1} {t('discover.of')} {questions.length}
        </Badge>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-base">{currentQuestion.question_text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questionOptions.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showExplanation}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                selectedAnswer === index
                  ? showExplanation
                    ? isCorrect
                      ? "border-success bg-success/10"
                      : "border-destructive bg-destructive/10"
                    : "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showExplanation && index === currentQuestion.correct_answer && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
                {showExplanation && selectedAnswer === index && !isCorrect && (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            </button>
          ))}

          {showExplanation && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-foreground">{currentQuestion.explanation}</p>
            </div>
          )}

          {!showExplanation ? (
            <Button
              onClick={submitAnswer}
              disabled={selectedAnswer === null}
              className="w-full mt-4"
            >
              {t('discover.submitAnswer')}
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="w-full mt-4">
              {currentQuestionIndex < questions.length - 1 ? t('discover.nextQuestion') : t('discover.finishQuiz')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};