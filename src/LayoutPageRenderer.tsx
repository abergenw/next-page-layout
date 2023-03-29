import React, { ComponentType } from 'react';
import { isLayoutPage } from './page';
import { ErrorComponentProps, LayoutRenderer } from './LayoutRenderer';

interface Props {
  page: any;
  initialProps: any;
  errorComponent?: ComponentType<ErrorComponentProps>;
  loadingComponent?: ComponentType;
}

export function LayoutPageRenderer(props: Props) {
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
