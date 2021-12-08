import { makeLayout } from 'next-page-layout';
import React, { ReactNode } from 'react';
import MainLayoutComponent from '../MainLayoutComponent';
import { sleep } from '../utils';
import SubLayoutComponent from '../SubLayoutComponent';

interface MainLayoutProps {
  title: string;
  children: ReactNode;
}

export const GetInitialPropsMainLayout = makeLayout(
  {
    getInitialProps: async (context) => {
      await sleep(300);
      return {
        title: 'GetInitialProps',
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
                This illustrates how you can use a layout hierarchy and utilize
                getInitialProps separately for each layout.
              </p>

              <p>
                In this example the main title, subtitle and page content are
                all produced from data fetched with <b>getInitialProps</b>. Note
                how you can pass &quot;layout props&quot; from downstream
                layouts (or the page) to a parent layout. In this example the
                subtitle is passed from the page.
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

export const GetInitialPropsSubLayout = makeLayout(
  {
    getInitialProps: async (context) => {
      await sleep(300);
      return {
        defaultSubtitle: 'GetInitialProps',
      };
    },
  },
  {
    parent: GetInitialPropsMainLayout,
    useParentProps: (props) => ({}),
    component: (props: SubLayoutProps) => {
      return (
        <SubLayoutComponent
          subtitle={`${props.defaultSubtitle}: ${props.subtitle}`}
          linkPrefix="getinitialprops/"
        >
          {props.children}
        </SubLayoutComponent>
      );
    },
  }
);
