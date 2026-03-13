export interface Profile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  requester?: Profile;
  addressee?: Profile;
}
