import {Component, inject, Input, OnInit} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FirebaseService} from '../../../services/http/firebase.service';
import {map, Observable, startWith} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {SessionService} from '../../../services/session.service';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-add-champion-section',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
  ],
  templateUrl: './add-champion-section.html',
  styleUrl: './add-champion-section.scss'
})
export class AddChampionSection implements OnInit {
  @Input({required: true}) isLoading!: boolean;
  @Input({required: true}) availableChampions: any[] = [];

  private firebaseService = inject(FirebaseService);
  private sessionService = inject(SessionService);

  protected championName: string = '';
  protected successMessage: string = '';
  protected errorMessage: string = '';
  protected championControl = new FormControl();
  protected filteredChampions: Observable<any[]> = new Observable();

  // Combined observables for template usage
  protected user$ = this.firebaseService.getCurrentUser();
  protected isAdmin$ = this.firebaseService.isAdmin();

  ngOnInit() {
    this.filteredChampions = this.championControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name;
        console.log('this.availableChampions', this.availableChampions);
        return name ? this._filter(name as string) : this.availableChampions.slice();
      })
    );
  }

  protected addChampion() {
    if (!this.championName.trim()) {
      this.errorMessage = 'Please enter a champion name';
      this.successMessage = '';
      return;
    }

    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    const currentSessionId = this.sessionService.getCurrentSessionId();
    this.firebaseService.createChampion(currentSessionId, {
      name: this.championName.trim()
    }).subscribe({
      next: () => {
        this.successMessage = `Champion "${this.championName}" added successfully!`;
        this.championName = '';
      },
      error: (error) => {
        console.error('Error adding champion:', error);
        this.errorMessage = 'Error adding champion. Please try again.';
      }
    });
  }

  protected displayChampionName(champion: any): string {
    return champion && champion.name ? champion.name : '';
  }

  private _filter(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.availableChampions.filter(champion =>
      champion.name.toLowerCase().includes(filterValue)
    );
  }
}
