<script>
  import { connectionLog, formatLog, clearLog } from '../diagnostics.js';

  let open = false;
  let copied = false;

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(formatLog($connectionLog));
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      // Clipboard API unavailable (permissions, insecure context) - the log
      // text is still selectable/readable in the <pre> below.
    }
  }
</script>

<div class="diagnostics">
  <button class="toggle" on:click={() => (open = !open)}>
    {open ? 'Hide' : 'Show'} connection log{$connectionLog.length ? ` (${$connectionLog.length})` : ''}
  </button>

  {#if open}
    <div class="panel">
      <div class="panel-header">
        <span>Connection log</span>
        <div class="panel-actions">
          <button on:click={copyLog}>{copied ? 'Copied!' : 'Copy'}</button>
          <button on:click={clearLog}>Clear</button>
        </div>
      </div>
      <pre>{formatLog($connectionLog) || '(no events yet)'}</pre>
      <p class="hint">
        If a connection fails, copy this log and share it — it records every WebRTC/ICE state
        change, which is usually enough to tell whether the problem is signaling, NAT traversal,
        or something else.
      </p>
    </div>
  {/if}
</div>

<style>
  .diagnostics {
    max-width: 700px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  .toggle {
    display: block;
    margin: 0 auto;
    border: none;
    background: none;
    color: #4b5563;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
  }
  .toggle:hover {
    color: #8b95a1;
  }
  .panel {
    background: #14171b;
    border: 1px solid #262b32;
    border-radius: 6px;
    padding: 0.75rem;
    margin-top: 0.25rem;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #8b95a1;
    margin-bottom: 0.5rem;
  }
  .panel-actions {
    display: flex;
    gap: 0.4rem;
  }
  .panel-actions button {
    border: none;
    border-radius: 4px;
    background: #3a4048;
    color: #fff;
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
  }
  pre {
    max-height: 220px;
    overflow: auto;
    margin: 0;
    font-size: 0.7rem;
    line-height: 1.4;
    color: #c7ccd3;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .hint {
    margin: 0.5rem 0 0;
    font-size: 0.7rem;
    color: #6b7280;
  }
</style>
