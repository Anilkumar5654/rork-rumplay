import { AVPlaybackStatus, Video } from 'expo-av';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useRef, useCallback } from 'react';

export const [PlayerProvider, usePlayer] = createContextHook(() => {
  const videoRef = useRef<Video | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  }, []);

  const play = useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.playAsync();
    }
  }, []);

  const pause = useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
    }
  }, []);

  const seek = useCallback(async (positionMillis: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(positionMillis);
    }
  }, []);

  const minimizePlayer = useCallback(() => {
    setIsMinimized(true);
    setShowMiniPlayer(true);
  }, []);

  const restorePlayer = useCallback(() => {
    setIsMinimized(false);
    setShowMiniPlayer(false);
  }, []);

  const closePlayer = useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.unloadAsync();
    }
    setCurrentVideoId(null);
    setIsMinimized(false);
    setShowMiniPlayer(false);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    setIsPlaying(false);
  }, []);

  return {
    videoRef,
    currentVideoId,
    setCurrentVideoId,
    playbackPosition,
    playbackDuration,
    isPlaying,
    isMinimized,
    showMiniPlayer,
    handlePlaybackStatusUpdate,
    play,
    pause,
    seek,
    minimizePlayer,
    restorePlayer,
    closePlayer,
  };
});
