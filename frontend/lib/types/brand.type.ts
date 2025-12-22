export interface IBrand {
  brand_name: string;
  mentions: number;
  averageSentiment: string;
  lastRank: number;
  prominence_score: number;
  context: string;
  associated_links: {
    url: string;
    is_direct_brand_link: boolean;
    citation_type: string;
  }[];
}
