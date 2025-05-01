export interface Article {
    _id?: string;
    title: string;
    image: string;
    description: string;
    url: string;
    source: string;
    published_at: string | Date;
    is_summarized: boolean;
  }
  