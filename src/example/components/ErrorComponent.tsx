import React from 'react';
import { ErrorComponentProps } from 'next-page-layout';

export default function ErrorComponent(props: ErrorComponentProps) {
  return <div style={{ color: 'red' }}>Error: {props.error?.message}</div>;
}
