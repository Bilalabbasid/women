'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BottomSheet, Switch, Tabs, ToastRegion, toast } from '@/components/ui/interactive';

/** Interactive demos for the design-system page. */

export function SwitchDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <div className="grid gap-1">
      <Switch label="Daily reminder" checked={a} onChange={setA} />
      <Switch label="Weekly summary" checked={b} onChange={setB} />
      <Switch label="Sync to cloud (not available)" checked={false} onChange={() => {}} disabled />
    </div>
  );
}

export function LoadingDemo() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      loading={busy}
      onClick={() => {
        setBusy(true);
        setTimeout(() => {
          setBusy(false);
          toast('Report ready to print');
        }, 1400);
      }}
    >
      Make my report
    </Button>
  );
}

export function ToastDemo() {
  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => toast('Saved. You can find it in Saved pages.')}>
        Save for later
      </button>
      <ToastRegion />
    </>
  );
}

export function SheetDemo() {
  return (
    <BottomSheet
      title="Filter verdicts"
      triggerClassName="btn btn-secondary"
      trigger={<>Open a bottom sheet</>}
    >
      <p>Sheets slide up from the bottom on phones and open as a centred panel on wide screens. Tap outside, press Esc or use Close.</p>
      <div className="chip-row mt-4">
        <button type="button" className="chip" aria-pressed="true">
          Strong
        </button>
        <button type="button" className="chip" aria-pressed="false">
          Moderate
        </button>
        <button type="button" className="chip" aria-pressed="false">
          Limited
        </button>
      </div>
    </BottomSheet>
  );
}

export function TabsDemo() {
  return (
    <Tabs
      tabs={[
        { id: 'iphone', label: 'iPhone', content: <p>Tap Share, then “Add to Home Screen”.</p> },
        { id: 'android', label: 'Android', content: <p>Tap the ⋮ menu, then “Install app”.</p> },
        { id: 'desktop', label: 'Computer', content: <p>Click the install icon at the right of the address bar.</p> },
      ]}
    />
  );
}

export function ChipsDemo() {
  const options = ['Hot at night', "Can't sleep", 'Angry all the time', 'Brain fog'];
  const [on, setOn] = useState<string[]>(["Can't sleep"]);
  return (
    <div className="chip-row" role="group" aria-label="Symptoms">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className="chip"
          aria-pressed={on.includes(o)}
          onClick={() => setOn((xs) => (xs.includes(o) ? xs.filter((x) => x !== o) : [...xs, o]))}
        >
          {o}
        </button>
      ))}
      <button type="button" className="chip" aria-pressed="false">
        Strong evidence <span className="chip-count">4</span>
      </button>
      <button type="button" className="chip" disabled>
        Harm concern <span className="chip-count">0</span>
      </button>
    </div>
  );
}
