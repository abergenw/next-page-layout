import { makeLayout, wrapSwrInitialProps } from 'next-page-layout';
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

export const UseInitialPropsMainLayout = makeLayout(
  {
    useInitialProps: () => {
      return wrapSwrInitialProps(
        useSWR('useInitialProps:parent', async () => {
          await sleep(300);
          return { title: 'UseInitialProps' };
        })
      );
    },
  },
  {
    useParentProps: (props) => ({}),
    component: (props: MainLayoutProps) => {
      return (
        <MainLayoutComponent
          title={props.title}
          description={
            <>
              <p>
                If you don&apos;t want to use server-side rendering and want to
                avoid a &quot;waterfall&quot; effect when fetching data, you can
                use <b>useInitialProps</b> similarly to how getInitialProps
                would be used.
              </p>

              <p>
                Note that the waterfall effect can also be avoided by having
                each page explicitly pass the required parameters to the
                layouts. This approach, however, tends to lead to repeated code
                and showing loading spinners in the layout hierarchy can be
                tricky.
              </p>

              <p>
                This example is essentially a copy of the{' '}
                <Link href="getinitialprops">getInitialProps</Link> example but
                instead using <b>useInitialProps</b>.
              </p>

              <p>
                In this example we&apos;re using{' '}
                <a href="https://swr.vercel.app/">useSWR</a> to simulate the
                data fetching but The API is simple and flexible and works well
                with other data fetching solutions as well (e.g.{' '}
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
  }
);

interface SubLayoutProps {
  defaultSubtitle: string;
  subtitle: string;
  children: ReactNode;
}

export const UseInitialPropsSubLayout = makeLayout(
  {
    useInitialProps: () => {
      return wrapSwrInitialProps(
        useSWR('useInitialProps:child', async () => {
          await sleep(300);
          return { defaultSubtitle: 'UseInitialProps' };
        })
      );
    },
  },
  {
    parent: UseInitialPropsMainLayout,
    useParentProps: (props) =>
      props.requireProps(({ initialProps, layoutProps }) => ({
        title: `${initialProps.defaultSubtitle}: ${layoutProps.subtitle}`,
      })),
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
  }
);

export const UseInitialPropsSubLayout2 = makeLayout(undefined, {
  parent: UseInitialPropsSubLayout,
  useParentProps: (props) =>
    props.requireProps(({ initialProps, layoutProps }) => ({
      ...layoutProps,
    })),
  component: (props: Omit<SubLayoutProps, 'defaultSubtitle'>) => {
    return <>{props.children}</>;
  },
});
