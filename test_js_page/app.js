// app.js

// [1] 전역 상태 및 캐시 저장소 (QueryClient 역할)
const cache = new Map(); 
let currentPage = 1;
const LIMIT = 2;

const listEl = document.getElementById('list');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfo = document.getElementById('page-info');
const statusEl = document.getElementById('status');

// [2] 데이터 페칭 함수 (캐싱 로직 포함)
async function fetchPage(page) {
  const cacheKey = `posts-page-${page}`;

  // 캐시 확인: 이미 주머니(Map)에 있다면 바로 반환
  if (cache.has(cacheKey)) {
    statusEl.innerText = "✅ 캐시된 데이터를 즉시 표시합니다.";
    return cache.get(cacheKey);
  }

  // 캐시가 없으면 로컬 파일에서 가져옴
  statusEl.innerText = "📡 서버(data.json)에서 데이터를 가져왔습니다.";
  const res = await fetch('./data.json');
  const allData = await res.json();

  const start = (page - 1) * LIMIT;
  const pagedData = {
    result: allData.slice(start, start + LIMIT),
    hasMore: start + LIMIT < allData.length
  };

  // 결과물을 주머니에 저장 (Caching)
  cache.set(cacheKey, pagedData);
  return pagedData;
}

// [3] 화면 렌더링 함수 (UI 업데이트)
async function render() {
  // 새 데이터를 가져오는 동안 기존 화면을 흐리게 (keepPreviousData 느낌)
  listEl.style.opacity = '0.5';
  
  const data = await fetchPage(currentPage);
  
  // 리스트 초기화 후 새로 그리기
  listEl.innerHTML = '';
  data.result.forEach(post => {
    const div = document.createElement('div');
    div.style = "padding: 15px; border: 1px solid #ddd; margin: 10px 0; border-radius: 5px;";
    div.innerHTML = `<strong>${post.id}.</strong> ${post.title} <div style="font-size: 0.9rem; color: #666;">${post.body}</div>`;
    listEl.appendChild(div);
  });

  // 버튼 및 정보 업데이트
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = !data.hasMore;
  pageInfo.innerText = `현재 페이지: ${currentPage}`;
  
  // 렌더링 완료 후 다시 선명하게
  listEl.style.opacity = '1';
}

// [4] 이벤트 리스너
prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    render();
  }
});

nextBtn.addEventListener('click', () => {
  currentPage++;
  render();
});

// 시작!
render();