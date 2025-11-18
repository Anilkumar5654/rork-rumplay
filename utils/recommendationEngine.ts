import { Video, User } from '../types';

export interface RecommendationScore {
  videoId: string;
  score: number;
  reasons: string[];
}

export class RecommendationEngine {
  private static calculateCategoryScore(video: Video, user: User): number {
    const watchHistory = user.watchHistoryDetailed || [];
    const categoryCount: Record<string, number> = {};
    
    watchHistory.forEach((item) => {
      const historyVideo = item.videoId;
      categoryCount[historyVideo] = (categoryCount[historyVideo] || 0) + 1;
    });
    
    const categoryPreference = categoryCount[video.category] || 0;
    return Math.min(categoryPreference / Math.max(watchHistory.length, 1), 1) * 30;
  }

  private static calculateEngagementScore(video: Video): number {
    const engagementRate = (video.likes + video.views * 0.1) / Math.max(video.views, 1);
    const likeRatio = video.likes / Math.max(video.likes + video.dislikes, 1);
    const commentEngagement = (video.comments?.length || 0) / Math.max(video.views, 1);
    
    return (engagementRate * 20 + likeRatio * 25 + commentEngagement * 10);
  }

  private static calculateFreshnessScore(video: Video): number {
    const uploadDate = new Date(video.uploadDate);
    const now = new Date();
    const daysSinceUpload = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpload < 1) return 25;
    if (daysSinceUpload < 7) return 20;
    if (daysSinceUpload < 30) return 15;
    if (daysSinceUpload < 90) return 10;
    return 5;
  }

  private static calculatePopularityScore(video: Video): number {
    const viewScore = Math.min(video.views / 100000, 1) * 15;
    const likeScore = Math.min(video.likes / 10000, 1) * 10;
    return viewScore + likeScore;
  }

  private static calculateSubscriptionBonus(video: Video, user: User): number {
    const isSubscribed = user.subscriptions.some(sub => sub.channelId === video.channelId);
    return isSubscribed ? 30 : 0;
  }

  private static calculateDiversityPenalty(video: Video, recentRecommendations: string[]): number {
    const isDuplicate = recentRecommendations.includes(video.id);
    return isDuplicate ? -50 : 0;
  }

  private static calculateWatchTimeScore(video: Video, user: User): number {
    const watchItem = user.watchHistoryDetailed?.find(w => w.videoId === video.id);
    if (!watchItem) return 0;
    
    const completionRate = watchItem.duration > 0 ? watchItem.position / watchItem.duration : 0;
    
    if (completionRate > 0 && completionRate < 0.9) {
      return 20;
    }
    
    return 0;
  }

  public static getRecommendations(
    videos: Video[],
    user: User,
    excludeIds: string[] = [],
    limit: number = 20
  ): Video[] {
    const recentRecommendations = user.watchHistory.slice(0, 10);
    
    const scoredVideos: RecommendationScore[] = videos
      .filter(v => !excludeIds.includes(v.id) && !v.isShort)
      .map(video => {
        const reasons: string[] = [];
        let totalScore = 0;

        const categoryScore = this.calculateCategoryScore(video, user);
        if (categoryScore > 5) {
          totalScore += categoryScore;
          reasons.push('Matches your interests');
        }

        const engagementScore = this.calculateEngagementScore(video);
        totalScore += engagementScore;

        const freshnessScore = this.calculateFreshnessScore(video);
        if (freshnessScore > 15) {
          reasons.push('Recently uploaded');
        }
        totalScore += freshnessScore;

        const popularityScore = this.calculatePopularityScore(video);
        if (popularityScore > 10) {
          reasons.push('Popular video');
        }
        totalScore += popularityScore;

        const subscriptionBonus = this.calculateSubscriptionBonus(video, user);
        if (subscriptionBonus > 0) {
          reasons.push('From subscribed channel');
        }
        totalScore += subscriptionBonus;

        const diversityPenalty = this.calculateDiversityPenalty(video, recentRecommendations);
        totalScore += diversityPenalty;

        const watchTimeScore = this.calculateWatchTimeScore(video, user);
        if (watchTimeScore > 0) {
          reasons.push('Continue watching');
        }
        totalScore += watchTimeScore;

        const randomFactor = Math.random() * 5;
        totalScore += randomFactor;

        return { videoId: video.id, score: totalScore, reasons };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredVideos
      .map(scored => videos.find(v => v.id === scored.videoId))
      .filter((v): v is Video => v !== undefined);
  }

  public static getTrendingVideos(videos: Video[], timeframe: 'day' | 'week' | 'month' = 'week'): Video[] {
    const now = new Date();
    const cutoffDays = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000);

    return videos
      .filter(v => !v.isShort && new Date(v.uploadDate) >= cutoffDate)
      .map(video => {
        const daysSinceUpload = (now.getTime() - new Date(video.uploadDate).getTime()) / (1000 * 60 * 60 * 24);
        const viewVelocity = video.views / Math.max(daysSinceUpload, 0.1);
        const engagementRate = (video.likes + (video.comments?.length || 0) * 2) / Math.max(video.views, 1);
        const trendingScore = viewVelocity * engagementRate * 1000;

        return { video, score: trendingScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(item => item.video);
  }

  public static getSimilarVideos(video: Video, allVideos: Video[], limit: number = 10): Video[] {
    return allVideos
      .filter(v => v.id !== video.id && !v.isShort)
      .map(v => {
        let score = 0;

        if (v.category === video.category) score += 40;
        
        const commonTags = v.tags.filter(tag => video.tags.includes(tag)).length;
        score += commonTags * 15;

        if (v.channelId === video.channelId) score += 30;

        const viewDiff = Math.abs(Math.log10(v.views + 1) - Math.log10(video.views + 1));
        score += Math.max(0, 10 - viewDiff * 2);

        return { video: v, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.video);
  }

  public static getPersonalizedShorts(videos: Video[], user: User, limit: number = 30): Video[] {
    const likedCategories = new Set<string>();
    
    user.likedVideos.forEach(videoId => {
      const video = videos.find(v => v.id === videoId);
      if (video) likedCategories.add(video.category);
    });

    return videos
      .filter(v => v.isShort)
      .map(short => {
        let score = Math.random() * 30;

        if (likedCategories.has(short.category)) score += 40;

        const isSubscribed = user.subscriptions.some(sub => sub.channelId === short.channelId);
        if (isSubscribed) score += 35;

        const engagementRate = short.likes / Math.max(short.views, 1);
        score += engagementRate * 25;

        return { short, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.short);
  }
}
