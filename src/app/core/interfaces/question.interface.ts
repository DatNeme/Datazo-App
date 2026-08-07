export interface Question {
  /** ID determinístico basado en hash del texto original. Sirve como doc ID en Firestore. */
  id?: string;
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  correctAnswer: string;
  incorrectAnswers: string[];

}

export interface Category {
  id: number;
  name: string;
}
