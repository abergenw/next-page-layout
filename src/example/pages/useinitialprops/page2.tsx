import { makeLayoutPage } from 'next-page-layout';
import useSWR from 'swr';
import { sleep } from '../../components/utils';
import React from 'react';
import { UseInitialPropsSubLayout } from '../../components/useinitialprops/useinitialprops-layouts';

export default makeLayoutPage(
  {
    useInitialProps: () => {
      const result = useSWR('useInitialProps:page2', async () => {
        await sleep(300);
        return 'Page2';
      });

      return {
        data: {
          content: result.data,
        },
        loading: !result.data,
      };
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
