import "@/styles/globals.css";
import Head from 'next/head';
import Link from 'next/link';
import EmailIcon from '@mui/icons-material/Email';
import {AccountBox} from '@mui/icons-material';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Email Drafter</title>
        <meta name="description" content="AI-powered email drafting application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="sidebar">
        <Link href="/">
          <EmailIcon />
        </Link>
        <Link href="/leads">
          <AccountBox />
        </Link>
      </div>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
