// backend/types/google-trends-api.d.ts
declare module 'google-trends-api' {
  interface TrendOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    property?: string;
  }

  interface InterestOverTimeOptions extends TrendOptions {
    granularTimeResolution?: boolean;
  }
  interface RelatedQueriesOptions extends TrendOptions {}
  interface RelatedTopicsOptions extends TrendOptions {}

  function interestOverTime(options: InterestOverTimeOptions): Promise<string>;
  function relatedQueries(options: RelatedQueriesOptions): Promise<string>;
  function relatedTopics(options: RelatedTopicsOptions): Promise<string>;
  function autoComplete(options: { keyword: string }): Promise<string>;

  const googleTrends: {
    interestOverTime: typeof interestOverTime;
    relatedQueries: typeof relatedQueries;
    relatedTopics: typeof relatedTopics;
    autoComplete: typeof autoComplete;
  };

  export default googleTrends;
}