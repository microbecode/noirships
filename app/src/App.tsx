import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import circuit from '../../circuit/target/circuit.json';

function App() {
  const [count, setCount] = useState(0);

  const show = (id, content) => {
    const container = document.getElementById(id);
    container.appendChild(document.createTextNode(content));
    container.appendChild(document.createElement('br'));
  };

  const submit = async () => {
    try {
      const noir = new Noir(circuit);
      const backend = new UltraHonkBackend(circuit.bytecode);
      const age = 20;
      show('logs', 'Generating witness... ⏳');
      const { witness } = await noir.execute({ age });
      show('logs', 'Generated witness... ✅');
      show('logs', 'Generating proof... ⏳');
      const proof = await backend.generateProof(witness);
      show('logs', 'Generated proof... ✅');
      show('results', proof.proof);
    } catch {
      show('logs', 'Oh 💔');
    }
  };

  return (
    <>
      <div>
        <input id="age" type="number" placeholder="Enter age" />
        <button id="submit" onClick={submit}>
          Submit Age
        </button>
      </div>
      <div>
        <div id="logs">
          <h2>Logs</h2>
        </div>
        <div id="results">
          <h2>Proof</h2>
        </div>
      </div>
    </>
  );
}

export default App;
