import React from 'react';
import { AppProps } from 'next/app';
import { LayoutPageRenderer } from 'next-page-layout';
import ErrorComponent from '../components/ErrorComponent';
import Link from '../components/Link';
import LoadingComponent from '../components/LoadingComponent';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 20 }}>
        <Link href="/nolayout" style={{ marginRight: 20 }}>
          No layout
        </Link>
        <Link href="/simple" style={{ marginRight: 20 }}>
          Simple
        </Link>
        <Link href="/getinitialprops" style={{ marginRight: 20 }}>
          GetInitialProps
        </Link>
        <Link href="/useinitialprops" style={{ marginRight: 20 }}>
          UseInitialProps
        </Link>
      </div>
      <LayoutPageRenderer
        page={Component}
        initialProps={pageProps}
        errorComponent={ErrorComponent}
        loadingComponent={LoadingComponent}
      />
    </div>
  );
}
