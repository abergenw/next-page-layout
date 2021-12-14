import { makeLayoutPage } from 'next-page-layout';
import { sleep } from '../../components/utils';
import React from 'react';
import { GetServerSidePropsSubLayout } from '../../components/getserversideprops/getserversideprops-layouts';

const Page = makeLayoutPage(
  {
    getServerSideProps: async (context) => {
      await sleep(300);
      return {
        content: 'Index',
      };
    },
  },
  {
    component: (props) => {
      return <>{props.content}</>;
    },
    layout: GetServerSidePropsSubLayout,
    useLayoutProps: (props) => ({
      subtitle: 'Index',
    }),
  }
);

export default Page;

export const getServerSideProps = Page._getServerSideProps;
