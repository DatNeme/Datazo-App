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
import { Category } from '../../core/interfaces/question.interface';
import { toTitleCase } from '../../core/utils/text-format.util';
import { CATEGORY_TRANSLATIONS } from '../../core/constants/categories.const';

export const ANY_CATEGORY_VALUE = -1;

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
  i18n = inject(I18nService);

  isLoading = signal<boolean>(true);

  private categoriesEn = signal<Category[]>([]);
  private categoriesEs = signal<Category[]>([]);

  sortedCategories = computed(() => {
    const lang = this.i18n.currentLang();
    const source = lang === 'es' ? this.categoriesEs() : this.categoriesEn();

    return source
      .map(c => ({ ...c, name: toTitleCase(c.name) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  });

  selectedCategory: number | null = null;
  readonly ANY_CATEGORY = ANY_CATEGORY_VALUE;
  selectedDifficulty = 'medium';
  questionAmount = 10;

  ngOnInit() {
    this.questionProvider.getCategories().subscribe({
      next: (data) => {
        this.categoriesEn.set(data);
        
        const translated = data.map(c => ({
          ...c,
          name: CATEGORY_TRANSLATIONS[c.name] || c.name
        }));
        this.categoriesEs.set(translated);
        
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  startGame() {
    if (this.selectedCategory === null) return;
    this.router.navigate(['/game'], {
      queryParams: {
        category: this.selectedCategory === ANY_CATEGORY_VALUE ? undefined : this.selectedCategory,
        difficulty: this.selectedDifficulty,
        amount: this.questionAmount
      }
    });
  }
}
