// public/store.js
const cache = new Map();

export const fetchWithCache = async (page) => {
  const cacheKey = `my-data-page-${page}`;
  const limit = 3; // 한 번에 3개씩 가져오기로 설정

  // 1. 캐시 확인
  if (cache.has(cacheKey)) {
    console.log("🎯 로컬 캐시 사용:", cacheKey);
    return cache.get(cacheKey);
  }

  // 2. 로컬 JSON 파일 가져오기
  console.log("📂 로컬 파일에서 읽어오는 중...");
  const res = await fetch('./data.json');
  const allData = await res.json();

  // 3. 페이징 직접 계산 (예: 1페이지는 0~3번 데이터)
  const startIndex = (page - 1) * limit;
  const pagedData = allData.slice(startIndex, startIndex + limit);

  // 4. 캐시 저장
  cache.set(cacheKey, pagedData);
  return pagedData;
};