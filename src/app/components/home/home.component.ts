import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // <-- ¡Importa RouterLink!

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink], // <-- ¡Añádelo aquí!
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
