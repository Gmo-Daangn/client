export type Seller = {
  name: string;
  profileImageUrl: string;
  mannerTemperature: number;
};

export type Product = {
  id: string;
  title: string;
  price: number;
  location: string;
  createdAt: string;
  imageUrl: string;
  likeCount: number;
  chatCount: number;
  viewCount: number;
  category: string;
  description: string;
  seller: Seller;
};
