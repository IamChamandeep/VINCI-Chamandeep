import { Subtitle } from '../types';

const timeToSeconds = (timeStr: string): number => {
  // Standard SRT format is HH:MM:SS,mmm
  // We handle both , and . as decimal separators just in case
  const normalized = timeStr.trim().replace(',', '.');
  const parts = normalized.split(':');
  
  if (parts.length !== 3) return 0;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);

  return (hours * 3600) + (minutes * 60) + seconds;
};

export const parseSRT = (content: string): Subtitle[] => {
  // Normalize line endings and split by double newline
  const blocks = content.replace(/\r/g, '').trim().split(/\n\n+/);
  
  return blocks.map((block, index) => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;

    // The second line contains the timestamps
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,. ]\d{2,3}) --> (\d{2}:\d{2}:\d{2}[,. ]\d{2,3})/);
    
    if (!timeMatch) return null;

    const startTime = timeToSeconds(timeMatch[1]);
    const endTime = timeToSeconds(timeMatch[2]);
    const text = lines.slice(2).join('\n').trim();

    return {
      id: index,
      startTime,
      endTime,
      text,
    };
  }).filter((s): s is Subtitle => s !== null);
};