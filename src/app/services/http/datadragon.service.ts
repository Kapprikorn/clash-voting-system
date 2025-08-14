import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, map, Observable, switchMap} from 'rxjs';

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
  private baseUrl$ = new BehaviorSubject<string>('https://ddragon.leagueoflegends.com/cdn/15.15.1/data/en_US');
  private imageBaseUrl$ = new BehaviorSubject<string>('https://ddragon.leagueoflegends.com/cdn/15.15.1/img/champion/');
  private readonly versionsUrl = 'https://ddragon.leagueoflegends.com/api/versions.json';

  private championsCache$ = new BehaviorSubject<DataDragonChampion[] | null>(null);
  private isLoading = false;
  private isVersionInitialized = false;

  constructor(private http: HttpClient) {
    this.initializeVersion();
  }

  /**
   * Initialize the version by fetching from the API
   */
  private initializeVersion(): void {
    this.http.get<string[]>(this.versionsUrl).subscribe({
      next: (versions) => {
        const latestVersion = versions[0];
        this.baseUrl$.next(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US`);
        this.imageBaseUrl$.next(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/`);
        this.isVersionInitialized = true;
      },
      error: (error) => {
        console.error('Failed to fetch version, using fallback:', error);
        // Fallback to hardcoded version
        this.baseUrl$.next('https://ddragon.leagueoflegends.com/cdn/15.15.1/data/en_US');
        this.imageBaseUrl$.next('https://ddragon.leagueoflegends.com/cdn/15.15.1/img/champion/');
        this.isVersionInitialized = true;
      }
    });
  }

  /**
   * Gets the current image base URL
   */
  get imageBaseUrl(): Observable<string> {
    return this.imageBaseUrl$.asObservable();
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

    this.baseUrl$.pipe(
      switchMap(baseUrl => this.http.get<DataDragonChampionResponse>(`${baseUrl}/champion.json`))
    ).subscribe({
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
   * Gets champion names only as an array of strings
   */
  getChampionNames(): Observable<string[]> {
    return this.getAllChampions().pipe(
      map(champions => champions.map(champion => champion.name))
    );
  }

  /**
   * Gets a specific champion by name
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
      switchMap(champion =>
        this.imageBaseUrl.pipe(
          map(baseUrl => champion ? baseUrl + champion.image.full : '')
        )
      )
    );
  }
}
