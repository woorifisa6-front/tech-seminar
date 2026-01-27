'use client';

import React, { useState } from 'react';
import { useQuery } from 'react-query';

const LIMIT = 5; // 한 페이지에 2개씩 표시 (테스트용)

export default function PaginationPage() {
  const [page, setPage] = useState(1);

  // 1. fetch 함수: 페이지 번호에 따라 데이터를 잘라서 가져옴
  const fetchPage = async (page) => {
    console.log(`📡 [${page}페이지] 요청 중...`);
    const res = await fetch('/data.json');
    const allData = await res.json();

    const start = (page - 1) * LIMIT;
    return {
      result: allData.slice(start, start + LIMIT),
      total: allData.length,
      hasMore: start + LIMIT < allData.length
    };
  };

  const { data, isLoading, isFetching, isPreviousData } = useQuery(
    ['posts', page], // 페이지 번호가 바뀔 때마다 새로운 캐시 키 생성
    () => fetchPage(page),
    {
      // [핵심] 새 데이터를 불러오는 동안 이전 데이터를 화면에 유지함
      keepPreviousData: true, 
      staleTime: 1000 * 60 * 3, // 3분간 캐시 유지
    }
  );

  if (isLoading) return <div>초기 로딩 중...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h1>React query 캐싱 실습</h1>

      {/* 2. 데이터 표시부: isFetching과 isPreviousData를 조합해 로딩 상태 표현 */}
      <div style={{ 
        minHeight: '200px', 
        opacity: isFetching ? 0.5 : 1, // 데이터를 가져오는 중엔 살짝 흐리게
        transition: 'opacity 0.2s'
      }}>
        {data?.result.map((post) => (
          <div key={post.id} style={{ 
            padding: '15px', border: '1px solid #ddd', margin: '10px 0', borderRadius: '5px' 
          }}>
            <strong>{post.id}.</strong> {post.title}
            <div>{post.body}</div>
          </div>
        ))}
      </div>

      {/* 3. 컨트롤 버튼 */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px' }}>
        <button 
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1}
        >
          이전 페이지
        </button>
        
        <span>현재 페이지: <strong>{page}</strong></span>

        <button 
          onClick={() => {
            if (!isPreviousData && data?.hasMore) {
              setPage((old) => old + 1);
            }
          }}
          disabled={isPreviousData || !data?.hasMore}
        >
          다음 페이지
        </button>
      </div>

      {isFetching ? <p style={{ color: 'blue' }}>🔄 업데이트 중...</p> : <p style={{ color: 'green' }}>✅ 캐시됨</p>}
    </div>
  );
}