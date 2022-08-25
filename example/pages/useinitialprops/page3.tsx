import { makeLayoutPage, wrapSwrInitialProps } from 'next-page-layout';
import useSWR from 'swr';
import { sleep } from '../../components/utils';
import React from 'react';
import { UseInitialPropsSubLayout2 } from '../../components/useinitialprops/useinitialprops-layouts';

export default makeLayoutPage(
  {
    useInitialProps: () => {
      return wrapSwrInitialProps(
        useSWR('useInitialProps:page3', async () => {
          await sleep(300);
          return { content: 'Page3' };
        })
      );
    },
  },
  {
    component: (props) => {
      return <>{props.content}</>;
    },
    layout: UseInitialPropsSubLayout2,
    useLayoutProps: (props) => ({
      subtitle: 'Page3',
    }),
  }
);
