import { makeLayoutPage } from 'next-page-layout';
import { sleep } from '../../components/utils';
import React from 'react';
import { GetServerSidePropsSubLayout } from '../../components/getserversideprops/getserversideprops-layouts';

const Page = makeLayoutPage(
  {
    getServerSideProps: async (context) => {
      await sleep(300);
      return {
        content: context.query.page as string,
      };
    },
  },
  {
    component: (props) => {
      return <>{props.content}</>;
    },
    layout: GetServerSidePropsSubLayout,
    useLayoutProps: (props) =>
      props.requireInitialProps((initialProps) => ({
        subtitle: initialProps.content,
      })),
  }
);

export default Page;

export const getServerSideProps = Page._getServerSideProps;
