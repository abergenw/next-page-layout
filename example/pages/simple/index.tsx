import { makeLayoutPage } from 'next-page-layout';
import React from 'react';
import SimpleLayoutComponent from '../../components/simple/SimpleLayoutComponent';

export default makeLayoutPage(undefined, {
  component: (props) => {
    return <>Index</>;
  },
  renderLayout: (props) => {
    return (
      <SimpleLayoutComponent subtitle="Index">
        {props.children}
      </SimpleLayoutComponent>
    );
  },
});
