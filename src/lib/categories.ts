// Client-safe copy of the testimony categories (the collection file pulls in server-only Payload code).
export const categoryLabels: Record<string, string> = {
  healing: 'Healing & Miracles',
  family: 'Fruitfulness & Family',
  financial: 'Financial Breakthrough',
  destiny: 'Destiny Encounters',
  deliverance: 'Deliverance & Freedom',
  career: 'Career & Business',
  academic: 'Academic Excellence',
  spiritual: 'Spiritual Transformation',
  other: 'Other Testimonies',
}

/** Hue pairs for artwork placeholders when a testimony has no photo yet. */
export const categoryTints: Record<string, [string, string]> = {
  healing: ['#1d6b5f', '#0a2a3a'],
  family: ['#8a3b5c', '#2a0f2e'],
  financial: ['#9c7426', '#2a1d07'],
  destiny: ['#2b3590', '#0a0f2e'],
  deliverance: ['#8c2b22', '#260a08'],
  career: ['#2f5d8a', '#0b1a2e'],
  academic: ['#5a3f91', '#160d2e'],
  spiritual: ['#b98a2e', '#1a1446'],
  other: ['#3b4a6b', '#0a0f2e'],
}
