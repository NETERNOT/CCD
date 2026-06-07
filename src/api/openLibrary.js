const BASE = 'https://openlibrary.org'

export async function searchBooks(query) {
  if (!query.trim()) return []
  const url = `${BASE}/search.json?q=${encodeURIComponent(query)}&subject=romance&fields=title,author_name,key&limit=8`
  const res = await fetch(url)
  const data = await res.json()
  return (data.docs ?? []).map(doc => ({
  title: doc.title,
  author: doc.author_name?.[0] ?? 'Unknown',
  key: doc.key,
}))
}