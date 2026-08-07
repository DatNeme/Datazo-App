import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { QuestionProvider } from '../interfaces/question-provider.interface';
import { Question, Category } from '../interfaces/question.interface';

@Injectable({
  providedIn: 'root'
})
export class OpenTdbService implements QuestionProvider {
  private http = inject(HttpClient);

  private baseUrl = 'https://opentdb.com';

  getCategories(): Observable<Category[]> {
    return this.http.get<{ trivia_categories: Category[] }>(`${this.baseUrl}/api_category.php`).pipe(
      map(res => res.trivia_categories)
    );
  }

  getQuestions(amount: number, categoryId?: number, difficulty?: string): Observable<Question[]> {
    let url = `${this.baseUrl}/api.php?amount=${amount}`;
    if (categoryId) url += `&category=${categoryId}`;
    if (difficulty) url += `&difficulty=${difficulty}`;

    return this.http.get<{ results: any[] }>(url).pipe(
      map(res => res.results.map(q => ({
        category: q.category,
        type: q.type === 'multiple' ? 'multiple' : 'boolean',
        difficulty: q.difficulty,
        questionText: q.question,
        correctAnswer: q.correct_answer,
        incorrectAnswers: q.incorrect_answers
      } as Question)))
    );
  }
}
