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
    <div style={{ backgroundColor: 'lightblue', display: 'flex' }}>
      <div>
        <div>
          <Link href={`/${props.linkPrefix}`} exact={true}>
            Index
          </Link>
        </div>
        <div>
          <Link href={`/${props.linkPrefix}page2`}>Page2</Link>
        </div>
        <div>
          <Link href={`/${props.linkPrefix}page3`}>Page3</Link>
        </div>
      </div>
      <div style={{ marginLeft: 20, flexGrow: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{props.subtitle}</h2>
          <div>
            <button onClick={() => setCounter(counter + 1)}>
              Click me to update state: ({counter})
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'lightgreen', padding: 50 }}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
