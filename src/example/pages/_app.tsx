import React from 'react';
import { AppProps } from 'next/app';
import { LayoutPageRenderer } from 'next-page-layout';
import ErrorComponent from '../components/ErrorComponent';
import Link from '../components/Link';
import LoadingComponent from '../components/LoadingComponent';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        body,
        html {
          margin: 0;
          padding: 0;
          background-color: #f8f8f8;
        }
      `}</style>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', marginBottom: 20 }}>
          <Link href="/nolayout" block style={{ marginRight: 20 }}>
            No layout
          </Link>
          <Link href="/simple" block style={{ marginRight: 20 }}>
            Simple
          </Link>
          <Link href="/getinitialprops" block style={{ marginRight: 20 }}>
            GetInitialProps
          </Link>
          <Link href="/getserversideprops" block style={{ marginRight: 20 }}>
            GetServerSideProps
          </Link>
          <Link href="/getstaticprops" block style={{ marginRight: 20 }}>
            GetStaticProps
          </Link>
          <Link href="/useinitialprops" block style={{ marginRight: 20 }}>
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
    </>
  );
}
