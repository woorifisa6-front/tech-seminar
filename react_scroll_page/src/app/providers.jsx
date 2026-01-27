'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { useState } from 'react';


export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // ✅ 캐싱 확인을 위한 '철벽' 설정
        staleTime: Infinity,           // 데이터를 영원히 신선하게 유지 (새로고침 전까지)
        refetchOnWindowFocus: false,   // 다른 창 갔다와도 페치 금지
        refetchOnMount: false,         // 페이지 다시 들어와도 페치 금지
        refetchOnReconnect: false,     // 네트워크 재연결 시 페치 금지
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}



/* 'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    // Next.js 최상위 레이아웃은 반드시 이 태그들을 포함해야 합니다!
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
  );
} */