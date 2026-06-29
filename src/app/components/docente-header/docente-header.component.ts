import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocenteSessionService } from '../../services/docente-session.service';

@Component({
  selector: 'app-docente-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docente-header.component.html',
  styleUrl: './docente-header.component.css'
})
export class DocenteHeaderComponent implements OnInit {

  nombreDelDocente: string = '';

  constructor(private docenteSessionService: DocenteSessionService) {}

  ngOnInit(): void {
    this.nombreDelDocente = this.docenteSessionService.getNombreDocente() || '';
  }
}