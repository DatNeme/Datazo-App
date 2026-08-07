export interface Question {
  /** ID determinístico basado en hash del texto original. Sirve como doc ID en Firestore. */
  id?: string;
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  correctAnswer: string;
  incorrectAnswers: string[];

  // Metadata de caché
  /** Texto original en inglés (antes de traducir). Se preserva para el hash y debug. */
  originalText?: string;
  /** Si la pregunta ya estaba en español y no requirió traducción. */
  wasTranslated?: boolean;
  /** Timestamp de cuando se guardó en el caché de Firestore. */
  cachedAt?: Date;
}

export interface Category {
  id: number;
  name: string;
}
