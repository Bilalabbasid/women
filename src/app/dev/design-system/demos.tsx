'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BottomSheet, Switch, Tabs, ToastRegion, toast } from '@/components/ui/interactive';
import { Icon, LevelPicker, Panel, QuickPick, Stepper, SymptomChips } from '@/components/app/kit';

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

export function TrackerDemo() {
  const [feel, setFeel] = useState<1 | 2 | 3 | 4 | 5 | null>(4);
  const [flashes, setFlashes] = useState(3);
  const [sleep, setSleep] = useState<number>(7);
  const [flow, setFlow] = useState<string>('none');
  const [sym, setSym] = useState<Record<string, number>>({ hf: 3 });
  return (
    <div className="grid gap-4">
      <Panel title="How are you today?" hint="Five large levels, drawn as a rising ladder, no faces.">
        <LevelPicker
          label="How you feel"
          value={feel}
          onChange={setFeel}
          levels={[
            { value: 1, label: 'Rough', desc: 'Very hard' },
            { value: 2, label: 'Low', desc: 'Struggling' },
            { value: 3, label: 'Okay', desc: 'Manageable' },
            { value: 4, label: 'Good', desc: 'Steady' },
            { value: 5, label: 'Great', desc: 'Thriving' },
          ]}
        />
      </Panel>
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Hot flashes today" hint="56px − and + buttons; fast taps all count.">
          <Stepper label="Hot flashes today" value={flashes} onChange={setFlashes} unit="hot flashes" decreaseLabel="One fewer" increaseLabel="One more" />
        </Panel>
        <Panel title="Sleep last night">
          <QuickPick
            label="Hours of sleep"
            columns={3}
            value={sleep}
            onChange={setSleep}
            options={[
              { value: 4, label: '4 or less' },
              { value: 5, label: '5' },
              { value: 6, label: '6' },
              { value: 7, label: '7' },
              { value: 8, label: '8' },
              { value: 9, label: '9+' },
            ]}
          />
        </Panel>
      </div>
      <Panel title="Bleeding or spotting">
        <QuickPick
          label="Bleeding"
          columns={3}
          value={flow}
          onChange={setFlow}
          options={['None', 'Spotting', 'Light', 'Medium', 'Heavy'].map((l) => ({ value: l.toLowerCase(), label: l }))}
        />
      </Panel>
      <Panel title="Symptoms" hint="Tap a chip; a 1–5 strength row opens under it.">
        <SymptomChips
          items={[
            { id: 'hf', name: 'Hot flashes' },
            { id: 'ns', name: 'Night sweats' },
            { id: 'bf', name: 'Brain fog' },
            { id: 'jp', name: 'Aching joints' },
          ]}
          selected={sym}
          onToggle={(id) => setSym((s) => { const c = { ...s }; if (c[id]) delete c[id]; else c[id] = 3; return c; })}
          onStrength={(id, v) => setSym((s) => ({ ...s, [id]: v }))}
        />
      </Panel>
      <div className="stats">
        <div className="stat">
          <span className="stat-value">18</span>
          <span className="stat-label">days logged</span>
        </div>
        <div className="stat">
          <span className="stat-value">4.9</span>
          <span className="stat-label">hot flashes a day</span>
        </div>
        <div className="stat">
          <span className="stat-value">6.7h</span>
          <span className="stat-label">sleep a night</span>
        </div>
      </div>
      <p className="saved-note" role="status">
        <Icon.Check width={20} height={20} />
        Saved on this device.
      </p>
    </div>
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
