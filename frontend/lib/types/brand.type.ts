export interface IBrand {
  workspaceId?: string;
  brand_name: string;
  mentions: number;
  lastRank: number;

  // Legacy fields (keep for backward compatibility)
  averageSentiment?: string;
  prominence_score?: number;
  context?: string;
  associated_links?: {
    url: string;
    is_direct_brand_link: boolean;
    citation_type: string;
  }[];

  // Comprehensive Brand Analysis
  found?: boolean;
  mention_context?: string;
  sentiment?: string;
  sentiment_score?: number;
  sentiment_text?: string;
  rank_position?: number | null;
  funnel_stage?: string;
  attribute_mapping?: string[];
  recommendation_strength?: string;

  // Domain & URL Citations
  associated_domain?: Array<{
    domain_citation: string;
    domain_citation_source: boolean;
    domain_citation_type: string;
    associated_url: Array<{
      url_citation: string;
      url_anchor_text: string;
      url_citation_source: boolean;
      url_citation_type: string;
      url_placement: string;
    }>;
  }>;

  alignment_analysis?: string;
}
