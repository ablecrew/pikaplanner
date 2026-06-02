export const SORT_OPTIONS: { value: string; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'alpha', label: 'A → Z' },
    { value: 'nearest', label: 'Nearest' },
  ]
  
  export const CATEGORY_OPTIONS = [
    'All', 'Healthy', 'Indian', 'Salads', 'Asian', 'Burgers', 'Japanese',
    'Mexican', 'Italian', 'Fast Food', 'Kenyan', 'Swahili',
  ]
  
  export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    nairobi: { lat: -1.286389, lng: 36.817223 },
    mombasa: { lat: -4.043740, lng: 39.668865 },
    kisumu: { lat: -0.091703, lng: 34.767956 },
    nakuru: { lat: -0.303099, lng: 36.080025 },
    eldoret: { lat: 0.520361, lng: 35.269779 },
    thika: { lat: -1.033260, lng: 37.069330 },
    nyeri: { lat: -0.420130, lng: 36.947590 },
  }
  
  export const PAGE_SIZE = 24
  export const CACHE_TTL = 60