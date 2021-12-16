import React, { ReactNode, useState } from 'react';
import Link from './Link';

interface Props {
  subtitle: ReactNode;
  linkPrefix: ReactNode;
  children: ReactNode;
}

export default function SubLayoutComponent(props: Props) {
  const [counter, setCounter] = useState(0);
  return (
    <div style={{ backgroundColor: '#dadada', display: 'flex', padding: 20 }}>
      <div>
        <div>
          <Link href={`/${props.linkPrefix}`} block exact>
            Index
          </Link>
        </div>
        <div>
          <Link href={`/${props.linkPrefix}page2`} block>
            Page2
          </Link>
        </div>
        <div>
          <Link href={`/${props.linkPrefix}page3`} block>
            Page3
          </Link>
        </div>
      </div>
      <div style={{ marginLeft: 20, flexGrow: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, marginBottom: 20 }}>{props.subtitle}</h2>
          <div>
            <button
              onClick={() => setCounter(counter + 1)}
              style={{ padding: 10 }}
            >
              Click me to update state: ({counter})
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: '#d0d0d0', padding: 50 }}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
