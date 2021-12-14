import { makeLayout } from 'next-page-layout';
import React, { ReactNode } from 'react';
import MainLayoutComponent from '../MainLayoutComponent';
import { sleep } from '../utils';
import SubLayoutComponent from '../SubLayoutComponent';

interface MainLayoutProps {
  title: string;
  children: ReactNode;
}

export const GetStaticPropsMainLayout = makeLayout(
  {
    getStaticProps: async (context) => {
      await sleep(300);
      return {
        title: 'GetStaticProps',
      };
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
                This illustrates how you can use getStaticProps similarly to
                getInitialProps.
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

export const GetStaticPropsSubLayout = makeLayout(
  {
    getStaticProps: async (context) => {
      await sleep(300);
      return {
        defaultSubtitle: 'GetStaticProps',
      };
    },
  },
  {
    parent: GetStaticPropsMainLayout,
    useParentProps: (props) =>
      props.requireProps(({ initialProps, layoutProps }) => ({
        title: `${initialProps.defaultSubtitle}: ${layoutProps.subtitle}`,
      })),
    component: (props: SubLayoutProps) => {
      return (
        <SubLayoutComponent
          subtitle={`${props.defaultSubtitle}: ${props.subtitle}`}
          linkPrefix="getstaticprops/"
        >
          {props.children}
        </SubLayoutComponent>
      );
    },
  }
);
