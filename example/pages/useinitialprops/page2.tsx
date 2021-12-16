import { makeLayoutPage, wrapSwrInitialProps } from 'next-page-layout';
import useSWR from 'swr';
import { sleep } from '../../components/utils';
import React from 'react';
import { UseInitialPropsSubLayout } from '../../components/useinitialprops/useinitialprops-layouts';

export default makeLayoutPage(
  {
    useInitialProps: () => {
      return wrapSwrInitialProps(
        useSWR('useInitialProps:page2', async () => {
          await sleep(300);
          return { content: 'Page2' };
        })
      );
    },
  },
  {
    component: (props) => {
      return <>{props.content}</>;
    },
    layout: UseInitialPropsSubLayout,
    useLayoutProps: (props) => ({
      subtitle: 'Page2',
    }),
  }
);
