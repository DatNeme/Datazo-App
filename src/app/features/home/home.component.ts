import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { QuestionProvider } from '../../core/interfaces/question-provider.interface';
import { TranslationService } from '../../core/services/translation.service';
import { Category } from '../../core/interfaces/question.interface';
import { toTitleCase } from '../../core/utils/text-format.util';

// Valor centinela para "Cualquier categoría" (no se envía a la API)
const ANY_CATEGORY_VALUE = -1;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private questionProvider = inject(QuestionProvider);
  private translator = inject(TranslationService);
  i18n = inject(I18nService);

  isLoading = signal<boolean>(true);

  /** Categorías en inglés (directas de OpenTDB, sin traducción) */
  private categoriesEn = signal<Category[]>([]);
  /** Categorías en español (traducidas y cacheadas en el componente) */
  private categoriesEs = signal<Category[]>([]);
  private translatingToEs = signal<boolean>(false);

  /**
   * Categorías para mostrar según el idioma actual.
   * Siempre formateadas (Title Case) y ordenadas A-Z.
   */
  sortedCategories = computed(() => {
    const lang = this.i18n.currentLang();
    const source = lang === 'es' ? this.categoriesEs() : this.categoriesEn();

    return source
      .map(c => ({ ...c, name: toTitleCase(c.name) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  });

  // Estado del formulario — null = nada seleccionado (botón disabled)
  selectedCategory: number | null = null;
  readonly ANY_CATEGORY = ANY_CATEGORY_VALUE;
  selectedDifficulty = 'medium';
  questionAmount = 10;

  constructor() {
    // Cuando el idioma cambia a 'es' y aún no tenemos la traducción, traducir
    effect(() => {
      const lang = this.i18n.currentLang();
      if (lang === 'es' && this.categoriesEs().length === 0 && this.categoriesEn().length > 0) {
        this.translateCategoriesToEs();
      }
    });
  }

  ngOnInit() {
    // OpenTDB siempre devuelve categorías en inglés — las guardamos como fuente base
    this.questionProvider.getCategories().subscribe({
      next: (data) => {
        this.categoriesEn.set(data);
        this.isLoading.set(false);
        // Si el idioma inicial es español, traducir ya
        if (this.i18n.currentLang() === 'es') {
          this.translateCategoriesToEs();
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  private translateCategoriesToEs() {
    if (this.translatingToEs()) return; // Evitar llamadas duplicadas
    this.translatingToEs.set(true);
    const names = this.categoriesEn().map(c => c.name);
    this.translator.translateArray(names).subscribe({
      next: (translated) => {
        const translated_cats = this.categoriesEn().map((c, i) => ({ ...c, name: translated[i] }));
        this.categoriesEs.set(translated_cats);
        this.translatingToEs.set(false);
      },
      error: () => {
        // Fallback: usar inglés si falla la traducción
        this.categoriesEs.set(this.categoriesEn());
        this.translatingToEs.set(false);
      }
    });
  }

  startGame() {
    if (this.selectedCategory === null) return;
    this.router.navigate(['/game'], {
      queryParams: {
        // Si eligió "Cualquier Categoría" (-1), no se envía categoryId
        category: this.selectedCategory === ANY_CATEGORY_VALUE ? undefined : this.selectedCategory,
        difficulty: this.selectedDifficulty,
        amount: this.questionAmount
      }
    });
  }
}
