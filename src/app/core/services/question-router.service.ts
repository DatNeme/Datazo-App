import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { QuestionProvider } from '../interfaces/question-provider.interface';
import { Question, Category } from '../interfaces/question.interface';
import { OpenTdbService } from './open-tdb.service';
import { GeminiQuestionService } from './gemini-question.service';
import { I18nService } from '../i18n/i18n.service';

@Injectable({
  providedIn: 'root'
})
export class QuestionRouterService implements QuestionProvider {
  private openTdbService = inject(OpenTdbService);
  private geminiService = inject(GeminiQuestionService);
  private i18n = inject(I18nService);

  getCategories(): Observable<Category[]> {
    // Categories are always requested from OpenTDB to keep the selector unified
    return this.openTdbService.getCategories();
  }

  getQuestions(amount: number, categoryId?: number, difficulty?: string): Observable<Question[]> {
    const lang = this.i18n.currentLang();
    
    if (lang === 'es') {
      return this.geminiService.getQuestions(amount, categoryId, difficulty);
    } else {
      return this.openTdbService.getQuestions(amount, categoryId, difficulty);
    }
  }
}
