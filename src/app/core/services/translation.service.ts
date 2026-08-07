import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  
  // Endpoint gratuito sin clave (usar con precaución para no saturar)
  private readonly baseUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=';

  /**
   * Traduce un string de Inglés a Español
   */
  translateText(text: string): Observable<string> {
    if (!text) return of('');
    
    // Decodificar entidades HTML básicas que a veces vienen de OpenTDB
    const decodedText = this.decodeHtmlEntities(text);
    const url = `${this.baseUrl}${encodeURIComponent(decodedText)}`;
    
    return this.http.get<any[]>(url).pipe(
      map(response => {
        // La API devuelve un array anidado donde el texto traducido está en las primeras posiciones
        let translatedText = '';
        if (response && response[0]) {
          response[0].forEach((item: any) => {
            if (item[0]) translatedText += item[0];
          });
        }
        return translatedText || text;
      })
    );
  }

  /**
   * Traduce un array de strings (ej: opciones de respuesta)
   */
  translateArray(texts: string[]): Observable<string[]> {
    if (!texts || texts.length === 0) return of([]);
    
    const observables = texts.map(t => this.translateText(t));
    return forkJoin(observables);
  }

  private decodeHtmlEntities(text: string): string {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }
}
