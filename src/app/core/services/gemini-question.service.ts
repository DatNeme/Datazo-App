import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { QuestionProvider } from '../interfaces/question-provider.interface';
import { Question, Category } from '../interfaces/question.interface';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserService } from './user.service';
import { OpenTdbService } from './open-tdb.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiQuestionService implements QuestionProvider {
  private userService = inject(UserService);
  private openTdbService = inject(OpenTdbService);
  
  private categories: Category[] = [];

  getCategories(): Observable<Category[]> {
    return this.openTdbService.getCategories();
  }

  getQuestions(amount: number, categoryId?: number, difficulty?: string): Observable<Question[]> {
    return from(this.generateQuestions(amount, categoryId, difficulty));
  }

  private async generateQuestions(amount: number, categoryId?: number, difficulty?: string): Promise<Question[]> {
    const profile = this.userService.userProfile();
    const apiKey = profile?.preferences?.geminiApiKey;
    
    if (!apiKey) {
      throw new Error('MISSING_API_KEY');
    }

    let categoryName = 'Conocimiento General';
    if (categoryId) {
      if (this.categories.length === 0) {
        try {
          // Await first value of observable
          this.categories = await new Promise<Category[]>((resolve) => {
            const sub = this.openTdbService.getCategories().subscribe(cats => {
              resolve(cats);
              sub.unsubscribe();
            });
          });
        } catch (e) {
          // ignore
        }
      }
      const cat = this.categories.find(c => c.id === categoryId);
      if (cat) categoryName = cat.name;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const diffStr = difficulty === 'hard' ? 'difícil' : difficulty === 'medium' ? 'intermedia' : difficulty === 'easy' ? 'fácil' : 'aleatoria';

    const prompt = `
Actúa como un creador experto de trivias. Necesito que generes exactamente ${amount} preguntas de trivia en ESPAÑOL.
Categoría: ${categoryName}
Dificultad: ${diffStr}

Reglas estrictas:
1. Las preguntas deben ser interesantes, precisas y no repetitivas.
2. Cada pregunta debe tener exactamente 1 respuesta correcta y 3 respuestas incorrectas plausibles.
3. El formato de respuesta DEBE ser estrictamente un arreglo JSON válido, sin Markdown extra ni comillas invertidas.

El JSON debe tener exactamente esta estructura:
[
  {
    "category": "${categoryName}",
    "type": "multiple",
    "difficulty": "${difficulty || 'medium'}",
    "questionText": "Aquí va la pregunta en español",
    "correctAnswer": "Respuesta Correcta",
    "incorrectAnswers": ["Incorrecta 1", "Incorrecta 2", "Incorrecta 3"]
  }
]
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let jsonString = text.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7);
      }
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3);
      }
      if (jsonString.endsWith('```')) {
        jsonString = jsonString.substring(0, jsonString.length - 3);
      }
      jsonString = jsonString.trim();

      try {
        const parsed = JSON.parse(jsonString) as Question[];
        return parsed;
      } catch (e) {
        console.error("Failed to parse Gemini response", text);
        throw new Error("API_PARSE_ERROR");
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('503') || e.message.includes('UNAVAILABLE'))) {
        throw new Error('API_UNAVAILABLE');
      }
      if (e.message && (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED'))) {
        throw new Error('API_QUOTA_EXCEEDED');
      }
      throw e;
    }
  }
}
