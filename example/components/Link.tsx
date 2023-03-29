import React, { ComponentProps, CSSProperties, ReactNode } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

interface Props extends ComponentProps<typeof NextLink> {
  href: string;
  exact?: boolean;
  style?: CSSProperties;
  children: ReactNode;
  block?: boolean;
}

export default function Link(props: Props) {
  const router = useRouter();

  // router.asPath is url encoded.
  const currentPath = trim(decodeURIComponent(router.asPath));
  const href = trim(props.href);

  const active = props.exact
    ? currentPath === href
    : currentPath.startsWith(href);

  return (
    <NextLink
      {...props}
      style={{
        ...props.style,
        color: active ? 'white' : 'blue',
        backgroundColor: active ? 'black' : undefined,
        padding: props.block ? 20 : undefined,
        display: props.block ? 'block' : undefined,
      }}
    >
      {props.children}
    </NextLink>
  );
}

const trim = (path: string) => {
  path = path.startsWith('/') ? path.substring(1) : path;
  path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
  return path;
};
