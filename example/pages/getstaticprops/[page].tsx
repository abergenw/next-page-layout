import { makeLayoutPage } from 'next-page-layout';
import { sleep } from '../../components/utils';
import React from 'react';
import { GetStaticPropsSubLayout } from '../../components/getstaticprops/getstaticprops-layouts';
import { GetStaticPaths } from 'next';

const Page = makeLayoutPage(
  {
    getStaticProps: async (context) => {
      await sleep(300);
      return {
        content: context.params?.page as string,
      };
    },
  },
  {
    component: (props) => {
      return <>{props.content}</>;
    },
    layout: GetStaticPropsSubLayout,
    useLayoutProps: (props) =>
      props.requireInitialProps((initialProps) => ({
        subtitle: initialProps.content,
      })),
  }
);

export default Page;

export const getStaticProps = Page._getStaticProps;

export const getStaticPaths: GetStaticPaths = async (context) => {
  return {
    fallback: false,
    paths: ['page2', 'page3'].map((page) => ({
      params: {
        page,
      },
    })),
  };
};
