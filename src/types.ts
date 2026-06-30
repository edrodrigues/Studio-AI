export interface TryOnRequest {
  personImage: string; // base64 data url
  clothesImage: string; // base64 data url
}

export interface TryOnResponse {
  shareId: string;
  images: string[]; // array of 3 base64 data urls
}

export interface ShareData {
  id: string;
  images: string[];
  createdAt: number;
}
