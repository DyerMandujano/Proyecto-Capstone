import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true // 🔹 ESTO ES CRUCIAL
})
export class SafeUrlPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;

    let finalUrl = url;

    // Convertir link normal de YouTube a link 'embed' (para que funcione en iframes)
    if (url.includes('youtube.com/watch?v=')) {
      finalUrl = url.replace('youtube.com/watch?v=', 'youtube.com/embed/');
      finalUrl = finalUrl.split('&')[0]; // Limpia parámetros extra de YouTube
    } else if (url.includes('youtu.be/')) {
      finalUrl = url.replace('youtu.be/', 'youtube.com/embed/');
    }

    // Le decimos a Angular que confíe en esta URL
    return this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  }
}