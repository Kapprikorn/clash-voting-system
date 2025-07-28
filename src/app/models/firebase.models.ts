export interface Settings {
  id?: string;

  [key: string]: any; // Flexible settings object
}

export interface VotingSession {
  id?: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  endDate?: Date;
  maxVotesPerUser?: number;
}

export interface FirebaseChampion {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  votes: string[]; // Array of user IDs who voted
}

export interface VoteRequest {
  sessionId: string;
  championId: string;
  userId: string;
}
