import { makeLayout, makeLayoutPage } from 'next-page-layout';
import { ReactNode } from 'react';

interface LayoutProps {
  title: string;
  children: ReactNode;
}

const Layout = makeLayout(undefined, {
  useParentProps: () => ({}),
  component: (props: LayoutProps) => {
    return (
      <div>
        <h1>title: {props.title}</h1>
        <div>{props.children}</div>
      </div>
    );
  },
});

const Page = makeLayoutPage(undefined, {
  layout: Layout,
  useLayoutProps: () => ({ title: 'Test' }),
  component: (props) => {
    return <div>content</div>;
  },
});

export default Page;
