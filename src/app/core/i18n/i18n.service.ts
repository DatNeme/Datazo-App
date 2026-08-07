import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private http = inject(HttpClient);
  
  currentLang = signal<string>('es');
  private translations: Record<string, any> = {};

  constructor() {
    this.loadTranslations('es');
  }

  use(lang: string) {
    this.currentLang.set(lang);
    this.loadTranslations(lang);
  }

  private loadTranslations(lang: string) {
    this.http.get(`./i18n/${lang}.json`).subscribe(data => {
      this.translations = data;
    });
  }

  translate(key: string, params?: any): string {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Fallback al key
      }
    }
    
    let text = value as unknown as string;
    if (params && typeof text === 'string') {
      Object.keys(params).forEach(p => {
        text = text.replace(`{{${p}}}`, params[p]);
      });
    }
    return text;
  }
}
