import { Observable } from 'rxjs';
import { Question, Category } from './question.interface';

export abstract class QuestionProvider {
  /**
   * Obtiene una lista de categorías disponibles
   */
  abstract getCategories(): Observable<Category[]>;

  /**
   * Obtiene un conjunto de preguntas
   * @param amount Cantidad de preguntas a traer
   * @param categoryId ID de la categoría (opcional)
   * @param difficulty Nivel de dificultad (opcional)
   */
  abstract getQuestions(amount: number, categoryId?: number, difficulty?: string): Observable<Question[]>;
}
