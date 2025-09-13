import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface PlayerBracketIdResponse {
  bracket_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class LcuService {
  private readonly baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  /**
   * Get the Clash bracket ID for the currently logged-in player.
   * GET /api/clash/player-bracket-id
   */
  getClashPlayerBracketId(): Observable<PlayerBracketIdResponse> {
    return this.http.get<PlayerBracketIdResponse>(`${this.baseUrl}/api/clash/player-bracket-id`);
  }

  /**
   * Get information about a specific Clash bracket.
   * GET /api/clash/bracket/{bracket_id}
   */
  getClashBracket(bracketId: string): Observable<any> {
    const id = encodeURIComponent(bracketId);
    return this.http.get<any>(`${this.baseUrl}/api/clash/bracket/${id}`);
  }

  /**
   * Get formatted teams data from a specific Clash bracket.
   * GET /api/clash/bracket/{bracket_id}/teams
   */
  getClashBracketTeamsById(bracketId: string): Observable<any> {
    const id = encodeURIComponent(bracketId);
    return this.http.get<any>(`${this.baseUrl}/api/clash/bracket/${id}/teams`);
  }

  /**
   * Get all teams in the current player's Clash bracket.
   * GET /api/clash/teams
   */
  getAllClashBracketTeams(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/clash/teams`);
  }
}
