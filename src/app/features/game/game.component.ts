import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { QuestionProvider } from '../../core/interfaces/question-provider.interface';
import { Question } from '../../core/interfaces/question.interface';
import { toSentenceCase, toTitleCase } from '../../core/utils/text-format.util';

import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { CATEGORY_TRANSLATIONS } from '../../core/constants/categories.const';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private questionProvider = inject(QuestionProvider);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  i18n = inject(I18nService);

  questions = signal<Question[]>([]);
  currentIndex = signal<number>(0);
  score = signal<number>(0);
  isLoading = signal<boolean>(true);
  isGameOver = signal<boolean>(false);
  selectedAnswer = signal<string | null>(null);

  currentQuestion = computed(() => {
    const qList = this.questions();
    const idx = this.currentIndex();
    return qList.length > 0 && idx < qList.length ? qList[idx] : null;
  });

  /** Respuestas mezcladas y formateadas en Sentence Case */
  shuffledAnswers = computed(() => {
    const q = this.currentQuestion();
    if (!q) return [];
    const all = [
      ...q.incorrectAnswers.map(a => toSentenceCase(a)),
      toSentenceCase(q.correctAnswer)
    ];
    return all.sort(() => Math.random() - 0.5);
  });

  /** Respuesta correcta formateada (para comparar con shuffledAnswers) */
  correctAnswerFormatted = computed(() => {
    const q = this.currentQuestion();
    return q ? toSentenceCase(q.correctAnswer) : '';
  });

  categoryFormatted = computed(() => {
    const q = this.currentQuestion();
    if (!q) return '';
    const lang = this.i18n.currentLang();
    let name = q.category;
    if (lang === 'es' && CATEGORY_TRANSLATIONS[name]) {
      name = CATEGORY_TRANSLATIONS[name];
    }
    return toTitleCase(name);
  });

  /** Dificultad formateada */
  difficultyFormatted = computed(() => {
    const q = this.currentQuestion();
    if (!q) return '';
    const lang = this.i18n.currentLang();
    const diff = q.difficulty.toLowerCase();
    
    if (lang === 'es') {
      if (diff === 'easy') return 'Fácil';
      if (diff === 'medium') return 'Medio';
      if (diff === 'hard') return 'Difícil';
    }
    
    return toTitleCase(diff);
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const amount = params['amount'] ? parseInt(params['amount']) : 10;
      const category = params['category'] ? parseInt(params['category']) : undefined;
      const difficulty = params['difficulty'];
      this.fetchQuestions(amount, category, difficulty);
    });
  }

  private fetchQuestions(amount: number, category?: number, difficulty?: string) {
    this.isLoading.set(true);
    this.questionProvider.getQuestions(amount, category, difficulty).subscribe({
      next: (data) => {
        this.questions.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        
        let msg = 'Ocurrió un error al cargar las preguntas. Intenta de nuevo.';
        if (err.message === 'MISSING_API_KEY') {
          msg = 'API Key faltante o inválida. Por favor, configúrala en tu Perfil.';
        } else if (err.message === 'API_UNAVAILABLE') {
          msg = 'Los servidores de IA están muy ocupados ahora (503). Por favor, intenta de nuevo.';
        } else if (err.message === 'API_QUOTA_EXCEEDED') {
          msg = 'Has excedido la cuota de la API (429) o la clave no tiene fondos. Revisa tu cuenta de Google.';
        } else if (err.message === 'API_PARSE_ERROR') {
          msg = 'La IA devolvió un formato incorrecto. Intenta de nuevo.';
        }

        this.snackBar.open(msg, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        
        this.router.navigate(['/']);
      }
    });
  }

  selectAnswer(answer: string) {
    if (this.selectedAnswer() !== null) return;
    this.selectedAnswer.set(answer);

    const isCorrect = answer === this.correctAnswerFormatted();
    if (isCorrect) {
      this.score.update(s => s + 10);
    }

    setTimeout(() => this.nextQuestion(), 1500);
  }

  private nextQuestion() {
    this.selectedAnswer.set(null);
    const nextIdx = this.currentIndex() + 1;

    if (nextIdx >= this.questions().length) {
      this.isGameOver.set(true);
      
      const user = this.auth.currentUser();
      if (user && !user.isAnonymous) {
        this.userService.addScore(user.uid, this.score());
      }
    } else {
      this.currentIndex.set(nextIdx);
    }
  }

  getButtonState(answer: string): 'correct' | 'incorrect' | 'dimmed' | 'idle' {
    const selected = this.selectedAnswer();
    const correct = this.correctAnswerFormatted();

    if (selected === null) return 'idle';
    if (answer === correct) return 'correct';
    if (answer === selected) return 'incorrect';
    return 'dimmed';
  }

  playAgain() {
    this.router.navigate(['/']);
  }
}
