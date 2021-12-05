import { makeLayout } from 'next-page-layout';
import React, { ReactNode } from 'react';
import MainLayoutComponent from '../MainLayoutComponent';
import { sleep } from '../utils';
import SubLayoutComponent from '../SubLayoutComponent';
import useSWR from 'swr';
import Link from '../Link';

interface MainLayoutProps {
  title: string;
  children: ReactNode;
}

export const UseInitialPropsMainLayout = makeLayout({
  component: (props: MainLayoutProps) => {
    return (
      <MainLayoutComponent
        title={props.title}
        description={
          <>
            <p>
              If you don&apos;t want to use server-side rendering and want to
              avoid a &quot;waterfall&quot; effect when fetching data, you can
              use <b>useInitialProps</b> similarly to how getInitialProps would
              be used.
            </p>

            <p>
              Note that the waterfall effect can also be avoided by having each
              page explicitly pass the required parameters to the layouts. This
              approach, however, tends to lead to repeated code and showing
              loading spinners in the layout hierarchy can be tricky.
            </p>

            <p>
              This example is essentially a copy of the{' '}
              <Link href="getinitialprops">getInitialProps</Link> example but
              instead using <b>useInitialProps</b>.
            </p>

            <p>
              In this example we&apos;re using{' '}
              <a href="https://swr.vercel.app/">useSWR</a> to simulate the data
              fetching but The API is simple and flexible and works well with
              other data fetching solutions as well (e.g.{' '}
              <a href="https://www.apollographql.com/docs/react/data/queries/">
                useQuery
              </a>{' '}
              in Apollo GraphQL).
            </p>
          </>
        }
      >
        {props.children}
      </MainLayoutComponent>
    );
  },
  useInitialProps: () => {
    const result = useSWR('useInitialProps:parent', async () => {
      await sleep(300);
      return 'UseInitialProps';
    });

    return {
      data: {
        title: result.data,
      },
      loading: !result.data,
    };
  },
});

interface SubLayoutProps {
  defaultSubtitle: string;
  subtitle: string;
  children: ReactNode;
}

export const UseInitialPropsSubLayout = makeLayout({
  component: (props: SubLayoutProps) => {
    return (
      <SubLayoutComponent
        subtitle={`${props.defaultSubtitle}: ${props.subtitle}`}
        linkPrefix="useinitialprops/"
      >
        {props.children}
      </SubLayoutComponent>
    );
  },
  useInitialProps: () => {
    const result = useSWR('useInitialProps:child', async () => {
      await sleep(300);
      return 'UseInitialProps';
    });

    return {
      data: {
        defaultSubtitle: result.data,
      },
      loading: !result.data,
    };
  },
  parent: UseInitialPropsMainLayout,
});
