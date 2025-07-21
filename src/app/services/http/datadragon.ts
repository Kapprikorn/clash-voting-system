import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Champion {
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

export interface ChampionResponse {
  type: string;
  format: string;
  version: string;
  data: { [key: string]: Champion };
}

@Injectable({
  providedIn: 'root'
})
export class Datadragon {
  private readonly baseUrl = 'https://ddragon.leagueoflegends.com/cdn/15.14.1/data/en_US';
  public readonly imageBaseUrl = 'https://ddragon.leagueoflegends.com/cdn/15.14.1/img/champion/';

  constructor(private http: HttpClient) {}

  /**
   * Fetches all champions from the Data Dragon API
   */
  getAllChampions(): Observable<Champion[]> {
    return this.http.get<ChampionResponse>(`${this.baseUrl}/champion.json`)
      .pipe(
        map(response => Object.values(response.data))
      );
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
  getChampionByName(name: string): Observable<Champion | undefined> {
    return this.getAllChampions().pipe(
      map(champions => champions.find(champion =>
        champion.name.toLowerCase() === name.toLowerCase()
      ))
    );
  }


}
