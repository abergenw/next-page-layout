import { makeLayoutPage } from 'next-page-layout';
import { sleep } from '../../components/utils';
import React from 'react';
import { GetInitialPropsSubLayout } from '../../components/getinitialprops/getinitialprops-layouts';

export default makeLayoutPage(
  {
    getInitialProps: async (context) => {
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
    layout: GetInitialPropsSubLayout,
    useLayoutProps: (props) => ({
      subtitle: 'Index',
    }),
  }
);
