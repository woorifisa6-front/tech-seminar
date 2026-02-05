// public/app.js
import { fetchWithCache } from './store.js';

let currentPage = 1;
const listEl = document.getElementById('post-list');
const sentinel = document.getElementById('sentinel');

// 데이터를 화면에 그리는 함수
const render = (posts) => {
  posts.forEach(post => {
    const div = document.createElement('div');
    div.style = "padding: 20px; border-bottom: 1px solid #ccc;";
    div.innerHTML = `<h3>${post.id}. ${post.title}</h3>`;
    listEl.appendChild(div);
  });
};

// 무한 스크롤 관찰자 설정
const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting) {
    const data = await fetchWithCache(currentPage);
    if (data.length > 0) {
      render(data);
      currentPage++;
    } else {
      sentinel.innerText = "마지막 데이터입니다.";
      observer.unobserve(sentinel);
    }
  }
}, { threshold: 1.0 });

observer.observe(sentinel);