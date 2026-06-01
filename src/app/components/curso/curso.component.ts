import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoService } from '../../services/curso.service';
import { Curso } from '../../models/curso.model';
import { DocenteC } from '../../models/docenteC.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-curso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './curso.component.html',
  styleUrls: ['./curso.component.css']
})

export class CursoComponent implements OnInit {
  //cursos: Curso[] = [];
  docentesC: DocenteC[] = [];

  constructor(private cursoService: CursoService,private router: Router) {}

  ngOnInit(): void {
    this.cursoService.listarDocentes().subscribe(data => {
      this.docentesC = data;
    });
  }

  ingresarDocente(idDocente: number): void {
    this.router.navigate(['/docente', idDocente]);
  }



}
