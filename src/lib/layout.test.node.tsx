import {
  ErrorComponent,
  LoadingComponent,
  ParentLayout,
  sleep,
  ssrRenderer,
} from './test-utils';
import { commonLayoutTests } from './layout.test.common';
import { makeLayout } from './layout';
import useSWR from 'swr';
import { LayoutRenderer } from './LayoutRenderer';
import React from 'react';

describe('layout on server', () => {
  commonLayoutTests(ssrRenderer);

  test('with useInitialProps', async () => {
    const Parent = makeLayout(
      {
        useInitialProps: () => {
          const result = useSWR(
            'layoutOnServerWithUseInitialProps:parent',
            async () => {
              await sleep(100);
              return 'initialOne';
            }
          );

          return {
            data: {
              one: result.data,
            },
            loading: !result.data,
          };
        },
      },
      {
        component: ParentLayout,
        useParentProps: (props) => ({}),
      }
    );

    ssrRenderer.renderAndExpect(
      <LayoutRenderer
        layout={Parent}
        layoutProps={{ two: 2 }}
        initialProps={undefined}
        errorComponent={ErrorComponent}
        loadingComponent={LoadingComponent}
      >
        content
      </LayoutRenderer>,
      ['loading']
    );
  });
});
