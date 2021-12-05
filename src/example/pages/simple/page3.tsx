import { makeLayoutPage } from 'next-page-layout';
import React from 'react';
import SimpleLayoutComponent from '../../components/simple/SimpleLayoutComponent';

export default makeLayoutPage(undefined, {
  component: (props) => {
    return <>Page3</>;
  },
  renderLayout: (props) => {
    return (
      <SimpleLayoutComponent subtitle="Page3">
        {props.children}
      </SimpleLayoutComponent>
    );
  },
});
