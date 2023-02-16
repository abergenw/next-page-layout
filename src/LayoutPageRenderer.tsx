import React, { ComponentType } from 'react';
import { isLayoutPage, LayoutPage, LayoutPageInitialPropsOf } from './page';
import { ErrorComponentProps, LayoutRenderer } from './LayoutRenderer';
import { NextComponentType, NextPageContext } from 'next';

interface Props<TPage extends LayoutPage<any, any>> {
  page: TPage | NextComponentType<NextPageContext, any, any>;
  initialProps:
    | LayoutPageInitialPropsOf<TPage>
    | { _plain: LayoutPageInitialPropsOf<TPage> }
    | any;
  errorComponent?: ComponentType<ErrorComponentProps>;
  loadingComponent?: ComponentType;
}

export function LayoutPageRenderer<TPage extends LayoutPage<any, any>>(
  props: Props<TPage>
) {
  if (!isLayoutPage(props.page)) {
    return <props.page {...props.initialProps} />;
  }

  const initialProps = props.initialProps
    ? '_plain' in props.initialProps
      ? props.initialProps._plain
      : props.initialProps
    : undefined;

  return (
    <LayoutRenderer
      layout={props.page.layout}
      layoutProps={{}}
      initialProps={initialProps}
      errorComponent={props.errorComponent}
      loadingComponent={props.loadingComponent}
    />
  );
}
