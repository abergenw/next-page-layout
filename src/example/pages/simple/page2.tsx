import { makeLayoutPage } from 'next-page-layout';
import React from 'react';
import SimpleLayoutComponent from '../../components/simple/SimpleLayoutComponent';

export default makeLayoutPage(undefined, {
  component: (props) => {
    return <>Page2</>;
  },
  renderLayout: (props) => {
    return (
      <SimpleLayoutComponent subtitle="Page2">
        {props.children}
      </SimpleLayoutComponent>
    );
  },
});
