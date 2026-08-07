import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Question } from '../interfaces/question.interface';
import { TranslationService } from './translation.service';
import { hashString } from '../utils/hash.util';
import { isSpanish } from '../utils/language-detector.util';

/**
 * QuestionCacheService
 *
 * Implementa el patrón Caché-First usando Firestore como almacenamiento.
 *
 * Flujo por pregunta:
 *  1. Generar ID determinístico (hash del texto original en inglés).
 *  2. Consultar Firestore por ese ID.
 *  3a. HIT  → Devolver la pregunta guardada. (0 llamadas de traducción)
 *  3b. MISS → Detectar idioma de la pregunta raw:
 *       - Ya es español → guardar tal cual (wasTranslated = false)
 *       - Es inglés     → traducir → guardar (wasTranslated = true)
 *  4. Devolver la pregunta (desde caché o recién procesada).
 */
@Injectable({ providedIn: 'root' })
export class QuestionCacheService {
  private firestore = inject(Firestore);
  private translator = inject(TranslationService);

  private readonly COLLECTION = 'questions';

  /**
   * Procesa un array de preguntas crudas (de OpenTDB) aplicando la lógica de caché.
   */
  processQuestions(rawQuestions: Question[]): Observable<Question[]> {
    if (!rawQuestions.length) return of([]);

    const streams$ = rawQuestions.map(q => this.processOne(q));
    return forkJoin(streams$);
  }

  private processOne(rawQuestion: Question): Observable<Question> {
    // El ID se genera a partir del texto ORIGINAL (antes de cualquier traducción).
    // Como OpenTDB devuelve texto en inglés consistentemente, el hash es siempre el mismo.
    const questionId = hashString(rawQuestion.questionText);

    return from(this.getFromCache(questionId)).pipe(
      switchMap(cached => {
        if (cached) {
          // ─── CACHE HIT ───
          return of(cached);
        }

        // ─── CACHE MISS: procesar y guardar ───
        return this.translateIfNeeded(rawQuestion).pipe(
          switchMap(processed => {
            const questionWithId: Question = { ...processed, id: questionId };
            return from(this.saveToCache(questionId, questionWithId)).pipe(
              map(() => questionWithId),
              catchError(() => of(questionWithId)) // Si falla el guardado, devolver igual
            );
          })
        );
      }),
      catchError(() => {
        // Si Firestore falla completamente, procesar sin caché como fallback
        return this.translateIfNeeded(rawQuestion).pipe(
          map(q => ({ ...q, id: hashString(rawQuestion.questionText) }))
        );
      })
    );
  }

  /**
   * Detecta si la pregunta ya está en español.
   * Si lo está, devuelve la pregunta sin modificar.
   * Si está en inglés, la traduce (pregunta, respuestas y categoría).
   */
  private translateIfNeeded(raw: Question): Observable<Question> {
    const alreadySpanish = isSpanish(raw.questionText);

    if (alreadySpanish) {
      return of({
        ...raw,
        originalText: raw.questionText,
        wasTranslated: false
      });
    }

    // La pregunta está en inglés: traducir todos los campos de texto
    return forkJoin({
      questionText: this.translator.translateText(raw.questionText),
      correctAnswer: this.translator.translateText(raw.correctAnswer),
      incorrectAnswers: this.translator.translateArray(raw.incorrectAnswers),
      category: this.translator.translateText(raw.category)
    }).pipe(
      map(translated => ({
        ...raw,
        questionText: translated.questionText,
        correctAnswer: translated.correctAnswer,
        incorrectAnswers: translated.incorrectAnswers,
        category: translated.category,
        originalText: raw.questionText,
        wasTranslated: true
      })),
      catchError(() => of({ ...raw, wasTranslated: false })) // Fallback en inglés
    );
  }

  // ─── Firestore helpers ───────────────────────────────────────────────────

  private async getFromCache(id: string): Promise<Question | null> {
    const ref = doc(this.firestore, this.COLLECTION, id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      ...data,
      id: snap.id,
      // Convertir Timestamp de Firestore a Date de JS
      cachedAt: data['cachedAt'] instanceof Timestamp
        ? data['cachedAt'].toDate()
        : undefined
    } as Question;
  }

  private async saveToCache(id: string, question: Question): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, id);
    // Guardamos todo el objeto de la pregunta, más el timestamp de guardado.
    await setDoc(ref, {
      ...question,
      cachedAt: Timestamp.now()
    }, { merge: false }); // merge: false → no sobreescribir si ya existe (evita race conditions)
  }
}
