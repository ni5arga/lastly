import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('https://github.com/arshnah/lastly');
  }, [router]);

  return null;
}
