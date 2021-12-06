import React, { ReactNode, useState } from 'react';

interface Props {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}

export default function MainLayoutComponent(props: Props) {
  const [counter, setCounter] = useState(0);
  return (
    <div style={{ backgroundColor: '#e7e7e7', padding: 20 }}>
      <div>
        <h1 style={{ margin: 0, marginBottom: 20 }}>{props.title}</h1>
        <div>
          <button
            onClick={() => setCounter(counter + 1)}
            style={{ padding: 10 }}
          >
            Click me to update state: ({counter})
          </button>
        </div>
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          {props.description}
        </div>
      </div>
      <div style={{ backgroundColor: 'white' }}>{props.children}</div>
    </div>
  );
}
