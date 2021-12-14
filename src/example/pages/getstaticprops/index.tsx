import { makeLayoutPage } from 'next-page-layout';
import { sleep } from '../../components/utils';
import React from 'react';
import { GetStaticPropsSubLayout } from '../../components/getstaticprops/getstaticprops-layouts';

const Page = makeLayoutPage(
  {
    getStaticProps: async (context) => {
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
    layout: GetStaticPropsSubLayout,
    useLayoutProps: (props) => ({
      subtitle: 'Index',
    }),
  }
);

export default Page;

export const getStaticProps = Page._getStaticProps;
