export {
  makeLayout,
  isServerSideLayout,
  layoutHasGetInitialProps,
  fetchGetInitialProps,
  useLayoutInitialProps,
  isLayout,
} from './layout';
export type {
  LayoutBaseProps,
  ServerSideLayout,
  ClientSideLayout,
  Layout,
  LayoutParentProps,
  LayoutProps,
  InitialProps,
  LayoutInitialProps,
  LayoutInitialPropsStack,
} from './layout';

export { makeLayoutPage, isLayoutPage } from './page';
export type { LayoutPage, LayoutPageInitialPropsOf } from './page';

export { LayoutPageRenderer } from './LayoutPageRenderer';

export { LayoutRenderer } from './LayoutRenderer';
export type { ErrorComponentProps } from './LayoutRenderer';
