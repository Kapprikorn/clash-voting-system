import {Component, inject, Input, OnInit} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FirebaseService} from '../../../services/http/firebase.service';
import {combineLatest, map, Observable, startWith} from 'rxjs';
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

  protected successMessage: string = '';
  protected errorMessage: string = '';
  protected championControl = new FormControl();
  protected filteredChampions: Observable<any[]> = new Observable();

  // Combined observables for template usage
  protected user$ = this.firebaseService.getCurrentUser();
  protected isAdmin$ = this.firebaseService.isAdmin();

  ngOnInit() {
    this.filteredChampions = combineLatest([
      this.championControl.valueChanges.pipe(startWith('')),
      this.sessionService.champions$
    ]).pipe(
      map(([value, currentChampions]) => {
        const name = typeof value === 'string' ? value : value?.name;
        const searchTerm = name || '';

        // Get champions that are already in the session
        const existingChampionNames = currentChampions.map(champion =>
          champion.name.toLowerCase()
        );

        // Filter out champions that are already in the session
        const availableForSelection = this.availableChampions.filter(champion =>
          !existingChampionNames.includes(champion.name.toLowerCase())
        );

        // Apply search filter
        return searchTerm
          ? this._filter(searchTerm, availableForSelection)
          : availableForSelection.slice();
      })
    );
  }

  protected addChampion() {
    const championValue = this.championControl.value;
    const championName = typeof championValue === 'string' ? championValue : championValue?.name;

    if (!championName?.trim()) {
      this.errorMessage = 'Please enter a champion name';
      this.successMessage = '';
      return;
    }

    // Check if champion is already in session
    const currentChampions = this.sessionService.getCurrentChampions();
    const championExists = currentChampions.some(champion =>
      champion.name.toLowerCase() === championName.trim().toLowerCase()
    );

    if (championExists) {
      this.errorMessage = `Champion "${championName}" is already in this session`;
      this.successMessage = '';
      return;
    }

    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    const currentSessionId = this.sessionService.getCurrentSessionId();
    this.firebaseService.createChampion(currentSessionId, {
      name: championName.trim()
    }).subscribe({
      next: () => {
        this.successMessage = `Champion "${championName}" added successfully!`;
        this.championControl.setValue(''); // Clear the form control
        this.championControl.markAsUntouched(); // Reset touched state
        this.championControl.markAsPristine(); // Reset dirty state

        // Clear any validation errors
        this.championControl.setErrors(null);

        // Clear error message in case there was one before
        this.errorMessage = '';
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

  private _filter(name: string, championsToFilter: any[]): any[] {
    const filterValue = name.toLowerCase();
    return championsToFilter.filter(champion => {
      const championName = champion.name.toLowerCase();
      return this._isSubsequence(filterValue, championName);
    });
  }

  private _isSubsequence(filter: string, championName: string): boolean {
    let filterIndex = 0;
    let championIndex = 0;

    while (filterIndex < filter.length && championIndex < championName.length) {
      if (filter[filterIndex] === championName[championIndex]) {
        filterIndex++;
      }
      championIndex++;
    }

    // Return true if we've matched all characters in the filter
    return filterIndex === filter.length;
  }
}
