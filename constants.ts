import { PestDetection, ChartData } from './types';

export const MOCK_DETECTIONS: PestDetection[] = [
  {
    id: 'd1',
    timestamp: '2023-10-27 10:15:30',
    species: 'Aphid',
    count: 12,
    confidence: 0.92,
    latitude: 34.0522,
    longitude: -118.2437,
    imageUrl: 'https://picsum.photos/300/200?random=1',
  },
  {
    id: 'd2',
    timestamp: '2023-10-27 10:18:45',
    species: 'Whitefly',
    count: 5,
    confidence: 0.88,
    latitude: 34.0525,
    longitude: -118.2440,
    imageUrl: 'https://picsum.photos/300/200?random=2',
  },
  {
    id: 'd3',
    timestamp: '2023-10-27 10:22:10',
    species: 'Fall Armyworm',
    count: 2,
    confidence: 0.95,
    latitude: 34.0528,
    longitude: -118.2435,
    imageUrl: 'https://picsum.photos/300/200?random=3',
  },
  {
    id: 'd4',
    timestamp: '2023-10-27 10:45:00',
    species: 'Aphid',
    count: 28,
    confidence: 0.85,
    latitude: 34.0530,
    longitude: -118.2432,
    imageUrl: 'https://picsum.photos/300/200?random=4',
  },
    {
    id: 'd5',
    timestamp: '2023-10-27 11:05:30',
    species: 'Thrip',
    count: 8,
    confidence: 0.76,
    latitude: 34.0520,
    longitude: -118.2445,
    imageUrl: 'https://picsum.photos/300/200?random=5',
  },
];

export const PEST_DISTRIBUTION: ChartData[] = [
  { name: 'Aphid', value: 45 },
  { name: 'Whitefly', value: 25 },
  { name: 'Fall Armyworm', value: 20 },
  { name: 'Thrip', value: 10 },
];

export const HOURLY_TRENDS = [
  { name: '8am', value: 5 },
  { name: '9am', value: 12 },
  { name: '10am', value: 25 },
  { name: '11am', value: 18 },
  { name: '12pm', value: 30 },
  { name: '1pm', value: 22 },
];
