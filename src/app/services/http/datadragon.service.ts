import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, map, BehaviorSubject} from 'rxjs';

export interface DataDragonChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tags: string[];
  partype: string;
  stats: any;
}

export interface DataDragonChampionResponse {
  type: string;
  format: string;
  version: string;
  data: { [key: string]: DataDragonChampion };
}

@Injectable({
  providedIn: 'root'
})
export class DatadragonService {
  private readonly baseUrl = 'https://ddragon.leagueoflegends.com/cdn/15.14.1/data/en_US';
  public readonly imageBaseUrl = 'https://ddragon.leagueoflegends.com/cdn/15.14.1/img/champion/';

  private championsCache$ = new BehaviorSubject<DataDragonChampion[] | null>(null);
  private isLoading = false;

  constructor(private http: HttpClient) {
  }

  /**
   * Fetches all champions from the Data Dragon API
   */
  getAllChampions(): Observable<DataDragonChampion[]> {
    if (this.championsCache$.value === null && !this.isLoading) {
      this.loadChampions();
    }

    // Return the cached data, filtering out null values
    return this.championsCache$.pipe(
      map(champions => champions || [])
    );
  }

  private loadChampions(): void {
    this.isLoading = true;

    this.http.get<DataDragonChampionResponse>(`${this.baseUrl}/champion.json`)
      .subscribe({
        next: (response) => {
          const champions = Object.values(response.data);
          this.championsCache$.next(champions);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load champions:', error);
          this.championsCache$.next([]);
          this.isLoading = false;
        }
      });
  }

  /**
   * Force refresh the champions cache
   */
  refreshChampions(): void {
    this.championsCache$.next(null);
    this.loadChampions();
  }



  /**
   * Gets vote-details names only as an array of strings
   */
  getChampionNames(): Observable<string[]> {
    return this.getAllChampions().pipe(
      map(champions => champions.map(champion => champion.name))
    );
  }

  /**
   * Gets a specific vote-details by name
   */
  getChampionByName(name: string): Observable<DataDragonChampion | undefined> {
    return this.getAllChampions().pipe(
      map(champions => champions.find(champion =>
        champion.name.toLowerCase() === name.toLowerCase()
      ))
    );
  }

  getChampionImageUrlByName(name: string): Observable<string> {
    return this.getChampionByName(name).pipe(
      map(champion => champion ? this.imageBaseUrl + champion.image.full : '')
    );
  }
}
