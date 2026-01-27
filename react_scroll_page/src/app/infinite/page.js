'use client';

import React, { useEffect } from 'react';
import { useInfiniteQuery } from 'react-query'; // react-query v3 기준
import { useInView } from 'react-intersection-observer';

export default function InfiniteScrollPage() {
  const { ref, inView } = useInView();
  const LIMIT = 4; // 한 번에 가져올 데이터 개수

  // 1. fetch 함수: 로컬 data.json을 읽고 직접 페이징 처리
  const fetchProjects = async ({ pageParam = 1 }) => {
    // public/data.json 파일을 가져옵니다.
    const res = await fetch('/data.json');
    const allData = await res.json();

    // 현재 페이지에 해당하는 데이터 범위를 계산 (예: 1페이지면 0~5번)
    const start = (pageParam - 1) * LIMIT;
    const end = start + LIMIT;
    const pagedData = allData.slice(start, end);

    console.log(`📂 [로컬 페이징] ${pageParam}페이지 요청됨`);

    return {
      result: pagedData,
      nextPage: pageParam + 1,
      // 자른 데이터가 LIMIT보다 적거나, 전체 길이를 넘어서면 마지막 페이지로 간주
      isLast: end >= allData.length 
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery(
    ['infinite-posts'], // 캐시 키 (서브 페이지와 공유 가능)
    fetchProjects,
    {
      getNextPageParam: (lastPage) => !lastPage.isLast ? lastPage.nextPage : undefined,
      staleTime: 1000 * 60 * 5, // 5분 캐시
    }
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === 'loading') return <p>로딩 중...</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>로컬 데이터 무한 스크롤</h1>
      
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.result.map((post) => (
            <div key={post.id} style={{
              padding: '20px',
              margin: '10px 0',
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <small style={{ color: '#888' }}>No. {post.id}</small>
              <h3 style={{ margin: '10px 0 0' }}>{post.title}</h3>
            </div>
          ))}
        </React.Fragment>
      ))}

      <div ref={ref} style={{ padding: '30px', textAlign: 'center', borderTop: '1px dashed #ccc', marginTop: '20px' }}>
        {isFetchingNextPage
          ? '🔄 로컬 파일 읽는 중...'
          : hasNextPage
            ? '⬇️ 스크롤을 내리면 더 표시합니다'
            : '✅ 모든 데이터를 표시했습니다'}
      </div>
    </div>
  );
}