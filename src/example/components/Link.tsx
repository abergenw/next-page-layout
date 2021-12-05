import React, { ComponentProps, CSSProperties, ReactNode } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

interface Props extends ComponentProps<typeof NextLink> {
  href: string;
  exact?: boolean;
  style?: CSSProperties;
  children: ReactNode;
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
    <NextLink {...props}>
      <a
        style={{
          ...props.style,
          color: active ? 'white' : undefined,
          backgroundColor: active ? 'black' : undefined,
        }}
      >
        {props.children}
      </a>
    </NextLink>
  );
}

const trim = (path: string) => {
  path = path.startsWith('/') ? path.substring(1) : path;
  path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
  return path;
};
